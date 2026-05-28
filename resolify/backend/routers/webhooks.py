import json
import hmac
import hashlib
import logging
import re
import anthropic
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Request
from models.schemas import IntercomWebhookPayload
from services.enrichment import enrich_customer
from services.escalation import build_escalation_summary
from services.classifier import classify_ticket
from services.generator import generate_response
from services.sanitizer import sanitize_input
from services.language import detect_language
from services.rag import retrieve as rag_retrieve, HAS_KNOWLEDGE_BASE
from services.clients import get_default_client_id, is_draft_mode

logger = logging.getLogger(__name__)
router = APIRouter()

RAG_CONFIDENCE_THRESHOLD = 0.3
SUPPORTED_TOPICS = {"conversation.user.created", "conversation.user.replied"}


def _verify_intercom_signature(raw_body: bytes, header_sig: str, secret: str) -> bool:
    expected = "sha1=" + hmac.new(secret.encode(), raw_body, hashlib.sha1).hexdigest()
    return hmac.compare_digest(expected, header_sig)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").strip()


# ── Core pipeline ──────────────────────────────────────────────────────────────

async def process_ticket(
    payload: IntercomWebhookPayload,
    conversation_id: Optional[str] = None,
) -> dict:
    """
    Core ticket processing pipeline.
    Called by the HTTP endpoint, the /live endpoint, and the queued-retry task.
    conversation_id is the real Intercom conversation ID; when set, Intercom
    replies/notes are sent after processing (unless draft_mode is active).
    """
    ts = datetime.now(timezone.utc).isoformat()
    db_id = None

    print(f"\n{'='*60}")
    print(f"[{ts}] INCOMING TICKET")
    print(f"  ticket_id : {payload.ticket_id}")
    print(f"  customer  : {payload.customer_email}")
    print(f"  message   : {payload.message[:100]}")
    print(f"{'='*60}")
    logger.info(f"Incoming ticket | ticket_id={payload.ticket_id} customer={payload.customer_email}")

    # ── Resolve client & draft mode ────────────────────────────────────
    client_id = payload.client_id or await get_default_client_id()
    draft = await is_draft_mode(client_id)
    print(f"  [client] id={client_id} draft_mode={draft}")

    # ── Sanitize input ─────────────────────────────────────────────────
    sanitized = sanitize_input(payload.message, ticket_id=payload.ticket_id)
    safe_message = sanitized.text
    injection_detected = sanitized.injection_detected

    # ── Detect language ────────────────────────────────────────────────
    language = await detect_language(safe_message)
    print(f"  [language] detected: {language}")

    # ── RAG retrieve ───────────────────────────────────────────────────
    rag_chunks, rag_confidence = await rag_retrieve(safe_message, client_id)
    knowledge_gap = rag_confidence < RAG_CONFIDENCE_THRESHOLD
    print(f"  [rag] confidence={rag_confidence:.2f} knowledge_gap={knowledge_gap}")

    # ── Step 1: Save ticket immediately ───────────────────────────────
    try:
        from database import get_db
        db = get_db()

        insert_result = db.table("tickets").insert({
            "ticket_id":      payload.ticket_id,
            "customer_email": payload.customer_email,
            "customer_name":  payload.customer_name,
            "message":        payload.message,
            "status":         "pending",
            "client_id":      client_id,
            "language":       language,
            "knowledge_gap":  knowledge_gap,
            "rag_confidence": rag_confidence,
        }).execute()

        if not insert_result.data:
            raise HTTPException(status_code=500, detail="Failed to save ticket")

        db_id = insert_result.data[0]["id"]
        print(f"[{ts}] TICKET SAVED | db_id={db_id}")
        logger.info(f"Ticket saved | db_id={db_id}")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"DB insert failed for {payload.ticket_id}: {exc}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(exc)}")

    # ── Step 2: Enrich customer ────────────────────────────────────────
    context = None
    escalation_summary = None

    try:
        context = await enrich_customer(payload.customer_email)
        print(f"\n[{ts}] CUSTOMER CONTEXT")
        print(f"  company  : {context.company_name}")
        print(f"  plan     : {context.plan}  |  MRR: ${context.mrr}/mo")
        print(f"  payment  : {context.payment_status}")
        print(f"  health   : {context.account_health}")
        print(f"  age      : {context.days_as_customer} days")
        escalation_summary = build_escalation_summary(
            ticket_message=payload.message,
            customer_email=payload.customer_email,
            context=context,
        )
    except Exception as exc:
        logger.error(f"Enrichment failed for {payload.ticket_id}: {exc}")
        print(f"[{ts}] ENRICHMENT FAILED: {exc}")

    # ── Step 3: Classify ───────────────────────────────────────────────
    classification = None
    total_tokens = 0
    total_cost_units = 0

    if context is not None:
        try:
            print(f"\n[{ts}] CLASSIFYING...")
            classification = await classify_ticket(safe_message, language=language)
            total_tokens     += classification.tokens_used
            total_cost_units += classification.cost_units

            if injection_detected:
                classification.escalate_immediately = True
                classification.escalate_reason = "Prompt injection attempt detected"
                logger.warning(f"Injection escalation forced | ticket_id={payload.ticket_id}")

        except anthropic.APIError as exc:
            logger.error(f"Claude API unavailable — ticket queued for retry | {exc}")
            print(f"[{ts}] Claude API unavailable — ticket queued for retry")
            _queue_ticket(db, db_id, ts)
            return {"ticket_id": payload.ticket_id, "db_id": db_id, "status": "queued"}

        except Exception as exc:
            logger.error(f"Classification failed: {exc}")
            print(f"[{ts}] CLASSIFICATION FAILED: {exc}")

    # ── Step 4: Escalate or generate ──────────────────────────────────
    ai_response = None
    final_status = "pending"
    model_used = None

    if HAS_KNOWLEDGE_BASE and knowledge_gap and not rag_chunks:
        if classification is not None:
            classification.escalate_immediately = True
            current_reason = classification.escalate_reason or ""
            classification.escalate_reason = (
                "Knowledge gap — no relevant documentation found for this query"
                + (f"; {current_reason}" if current_reason else "")
            )

    if classification is not None:
        should_escalate = (
            classification.escalate_immediately
            or classification.intent in ("cancellation", "billing")
            or classification.confidence < 0.75
        )

        if should_escalate:
            final_status = "escalated"
            reason = classification.escalate_reason or f"intent={classification.intent}, conf={classification.confidence:.2f}"
            print(f"\n[{ts}] *** ESCALATED *** | {reason}")
            logger.info(f"Ticket escalated | ticket_id={payload.ticket_id} reason={reason}")
        else:
            try:
                print(f"\n[{ts}] GENERATING AI RESPONSE...")
                generated = await generate_response(
                    message=safe_message,
                    context=context,
                    intent=classification.intent,
                    tone=classification.tone,
                    language=language,
                )
                total_tokens     += generated.tokens_used
                total_cost_units += generated.cost_units
                model_used = generated.model_used

                if draft:
                    print(f"[{ts}] DRAFT MODE — response saved, not sent to customer")
                    logger.info(f"Draft mode active — response withheld | ticket_id={payload.ticket_id}")

                ai_response  = generated.response_text
                final_status = "resolved"
                print(f"\n[{ts}] *** RESOLVED *** | model={model_used} draft={draft}")
                print(f"  AI RESPONSE:\n  {ai_response[:200]}")

            except anthropic.APIError as exc:
                logger.error(f"Claude API unavailable (generation) — queuing | {exc}")
                print(f"[{ts}] Claude API unavailable — ticket queued for retry")
                _queue_ticket(db, db_id, ts)
                return {"ticket_id": payload.ticket_id, "db_id": db_id, "status": "queued"}

            except Exception as exc:
                final_status = "escalated"
                logger.error(f"Generation failed: {exc}")
                print(f"[{ts}] GENERATION FAILED (escalating): {exc}")

    elif context is not None:
        final_status = "escalated"

    # ── Step 5: Update DB ──────────────────────────────────────────────
    try:
        update: dict = {
            "status":         final_status,
            "processed_at":   datetime.now(timezone.utc).isoformat(),
            "tokens_used":    total_tokens,
            "api_cost_cents": total_cost_units,
            "knowledge_gap":  knowledge_gap,
            "rag_confidence": rag_confidence,
            "language":       language,
        }
        if context is not None:
            update["customer_context"]   = context.model_dump()
            update["escalation_summary"] = escalation_summary
        if classification is not None:
            update["intent"]               = classification.intent
            update["confidence"]           = classification.confidence
            update["escalate_immediately"] = classification.escalate_immediately
        if ai_response is not None:
            update["ai_response"] = ai_response
        if model_used:
            update["model_used"] = model_used

        db.table("tickets").update(update).eq("id", db_id).execute()
        print(f"[{ts}] DB UPDATED | status={final_status} tokens={total_tokens} cost_units={total_cost_units}")

    except Exception as exc:
        logger.error(f"DB update failed for {db_id}: {exc}")
        print(f"[{ts}] DB UPDATE FAILED: {exc}")

    # ── Step 6: Send Intercom reply ────────────────────────────────────
    if conversation_id:
        await _send_intercom_action(
            conversation_id=conversation_id,
            client_id=client_id,
            final_status=final_status,
            ai_response=ai_response,
            escalation_summary=escalation_summary,
            draft=draft,
            ts=ts,
        )

    print(f"{'='*60}\n")

    # ── Build response ────────────────────────────────────────────────
    resp: dict = {
        "ticket_id":          payload.ticket_id,
        "db_id":              db_id,
        "status":             final_status,
        "language":           language,
        "draft_mode":         draft,
        "injection_detected": injection_detected,
        "knowledge_gap":      knowledge_gap,
        "rag_confidence":     rag_confidence,
        "tokens_used":        total_tokens,
        "cost_units":         total_cost_units,
    }
    if classification is not None:
        resp["intent"]     = classification.intent
        resp["confidence"] = classification.confidence
        resp["model_used"] = model_used
    if final_status == "resolved" and ai_response and not draft:
        resp["ai_response"] = ai_response
    elif final_status == "resolved" and draft:
        resp["ai_response_draft"] = ai_response
    elif escalation_summary:
        resp["escalation_summary"] = escalation_summary
    return resp


async def _send_intercom_action(
    conversation_id: str,
    client_id: Optional[str],
    final_status: str,
    ai_response: Optional[str],
    escalation_summary: Optional[str],
    draft: bool,
    ts: str,
) -> None:
    """Send reply or internal note to Intercom after ticket processing."""
    if draft:
        logger.info(f"DRAFT MODE — response saved, not sent | conv={conversation_id}")
        print(f"[{ts}] DRAFT MODE — response saved, not sent to Intercom")
        return

    try:
        from services.intercom import reply_to_conversation, add_internal_note

        # Fetch the client's Intercom access token
        client_access_token = ""
        if client_id:
            try:
                from database import get_db
                rows = get_db().table("clients").select("intercom_access_token").eq("id", client_id).execute()
                if rows.data:
                    client_access_token = rows.data[0].get("intercom_access_token") or ""
            except Exception as exc:
                logger.warning(f"Could not fetch client Intercom token: {exc}")

        if final_status == "resolved" and ai_response:
            ok = await reply_to_conversation(conversation_id, ai_response, client_access_token)
            if ok:
                logger.info(f"REPLIED to conversation {conversation_id}")
                print(f"[{ts}] REPLIED to conversation {conversation_id}")
            else:
                logger.warning(f"Reply not sent for conversation {conversation_id}")

        elif final_status == "escalated" and escalation_summary:
            ok = await add_internal_note(conversation_id, escalation_summary, client_access_token)
            if ok:
                logger.info(f"NOTE ADDED to conversation {conversation_id}")
                print(f"[{ts}] NOTE ADDED to conversation {conversation_id}")
            else:
                logger.warning(f"Note not added for conversation {conversation_id}")

    except Exception as exc:
        logger.error(f"Intercom action failed for {conversation_id}: {exc}")


# ── HTTP endpoint ──────────────────────────────────────────────────────────────

@router.post("/webhook/intercom")
async def receive_intercom_webhook(
    request: Request,
    x_hub_signature: Optional[str] = Header(None),
):
    """
    Unified Intercom webhook endpoint.
    Accepts both real Intercom notification_event payloads and simple test payloads.
    Verifies HMAC-SHA1 signature when X-Hub-Signature is present and
    INTERCOM_WEBHOOK_SECRET is configured.
    """
    raw_body = await request.body()

    # ── Signature verification ─────────────────────────────────────────
    from config import INTERCOM_WEBHOOK_SECRET
    if x_hub_signature and INTERCOM_WEBHOOK_SECRET:
        if not _verify_intercom_signature(raw_body, x_hub_signature, INTERCOM_WEBHOOK_SECRET):
            logger.warning("Intercom webhook signature mismatch — rejecting")
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    if data.get("topic") == "ping":
        return {"status": "pong"}

    # ── Format detection ───────────────────────────────────────────────
    conversation_id: Optional[str] = None

    if "data" in data and "item" in data.get("data", {}):
        # ── Real Intercom notification_event format ────────────────────
        topic = data.get("topic", "")
        if topic not in SUPPORTED_TOPICS:
            logger.info(f"Ignoring unsupported Intercom topic: {topic}")
            return {"status": "ignored", "topic": topic}

        item        = data["data"]["item"]
        conversation_id = str(item.get("id", ""))
        source      = item.get("source", {})
        author      = source.get("author", {})
        body_text   = _strip_html(source.get("body", ""))

        # For replied events, use the latest user-authored part
        if topic == "conversation.user.replied":
            parts = item.get("conversation_parts", {}).get("conversation_parts", [])
            user_parts = [p for p in parts if p.get("author", {}).get("type") in ("user", "lead")]
            if user_parts:
                latest = user_parts[-1]
                body_text = _strip_html(latest.get("body", "")) or body_text
                if not author.get("email"):
                    author = latest.get("author", author)

        email = (author.get("email") or "").strip() or "unknown@intercom.com"
        name  = author.get("name") or "Unknown"

        if not body_text:
            return {"status": "skipped", "reason": "empty message body"}

        payload = IntercomWebhookPayload(
            ticket_id=f"IC-{conversation_id}",
            customer_email=email,
            customer_name=name,
            message=body_text,
        )
        logger.info(f"Real Intercom event | topic={topic} conv={conversation_id} email={email}")

    else:
        # ── Simple test format: {ticket_id, customer_email, message, …} ─
        try:
            payload = IntercomWebhookPayload(**data)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Invalid payload: {exc}")
        # Strip HTML from test messages too
        stripped = _strip_html(payload.message)
        if stripped != payload.message:
            payload = payload.model_copy(update={"message": stripped})
        logger.info(f"Test webhook | ticket_id={payload.ticket_id}")

    return await process_ticket(payload, conversation_id=conversation_id)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _queue_ticket(db, db_id: str, ts: str) -> None:
    try:
        db.table("tickets").update({"status": "queued"}).eq("id", db_id).execute()
        logger.info(f"Ticket queued | db_id={db_id}")
        print(f"[{ts}] Ticket status set to 'queued'")
    except Exception as exc:
        logger.error(f"Failed to set queued status: {exc}")


async def process_queued_ticket(ticket: dict) -> None:
    """Re-process a single queued ticket. Called by the background retry task."""
    db_id     = ticket["id"]
    ticket_id = ticket["ticket_id"]
    logger.info(f"Retrying queued ticket | db_id={db_id} ticket_id={ticket_id}")
    print(f"  [retry] Processing {ticket_id}")

    from database import get_db
    db = get_db()

    payload = IntercomWebhookPayload(
        ticket_id=ticket["ticket_id"],
        customer_email=ticket["customer_email"],
        message=ticket["message"],
        customer_name=ticket.get("customer_name"),
        client_id=str(ticket["client_id"]) if ticket.get("client_id") else None,
    )

    try:
        db.table("tickets").update({"status": "pending"}).eq("id", db_id).execute()
        context = await enrich_customer(payload.customer_email)
        safe_message = sanitize_input(payload.message, ticket_id=ticket_id).text
        language = ticket.get("language", "en")
        classification = await classify_ticket(safe_message, language=language)

        should_escalate = (
            classification.escalate_immediately
            or classification.intent in ("cancellation", "billing")
            or classification.confidence < 0.75
        )
        if should_escalate:
            db.table("tickets").update({
                "status":               "escalated",
                "intent":               classification.intent,
                "confidence":           classification.confidence,
                "escalate_immediately": classification.escalate_immediately,
                "tokens_used":          classification.tokens_used,
                "api_cost_cents":       classification.cost_units,
            }).eq("id", db_id).execute()
            logger.info(f"Queued ticket escalated on retry | db_id={db_id}")
        else:
            generated = await generate_response(
                message=safe_message, context=context,
                intent=classification.intent, tone=classification.tone,
                language=language,
            )
            db.table("tickets").update({
                "status":         "resolved",
                "intent":         classification.intent,
                "confidence":     classification.confidence,
                "ai_response":    generated.response_text,
                "model_used":     generated.model_used,
                "tokens_used":    classification.tokens_used + generated.tokens_used,
                "api_cost_cents": classification.cost_units + generated.cost_units,
                "processed_at":   datetime.now(timezone.utc).isoformat(),
            }).eq("id", db_id).execute()
            logger.info(f"Queued ticket resolved on retry | db_id={db_id}")

    except anthropic.APIError:
        db.table("tickets").update({"status": "queued"}).eq("id", db_id).execute()
        logger.warning(f"Retry failed — Claude still unavailable | db_id={db_id}")
    except Exception as exc:
        logger.error(f"Retry error for {db_id}: {exc}")
        db.table("tickets").update({"status": "queued"}).eq("id", db_id).execute()
