import logging
import anthropic
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
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


@router.post("/webhook/intercom")
async def receive_intercom_webhook(payload: IntercomWebhookPayload):
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

    # ── Fix 4: Sanitize input ──────────────────────────────────────────
    sanitized = sanitize_input(payload.message, ticket_id=payload.ticket_id)
    safe_message = sanitized.text
    injection_detected = sanitized.injection_detected

    # ── Fix 6: Detect language ─────────────────────────────────────────
    language = await detect_language(safe_message)
    print(f"  [language] detected: {language}")

    # ── Fix 5: RAG retrieve ────────────────────────────────────────────
    rag_chunks, rag_confidence = await rag_retrieve(safe_message, client_id)
    knowledge_gap = rag_confidence < RAG_CONFIDENCE_THRESHOLD
    print(f"  [rag] confidence={rag_confidence:.2f} knowledge_gap={knowledge_gap}")

    # ── Step 1: Save ticket immediately ───────────────────────────────
    try:
        from database import get_db
        db = get_db()

        insert_result = db.table("tickets").insert({
            "ticket_id":   payload.ticket_id,
            "customer_email": payload.customer_email,
            "customer_name":  payload.customer_name,
            "message":     payload.message,
            "status":      "pending",
            "client_id":   client_id,
            "language":    language,
            "knowledge_gap":   knowledge_gap,
            "rag_confidence":  rag_confidence,
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
            total_tokens    += classification.tokens_used
            total_cost_units += classification.cost_units

            # Fix 4: force escalation if injection detected
            if injection_detected:
                classification.escalate_immediately = True
                classification.escalate_reason = "Prompt injection attempt detected"
                logger.warning(f"Injection escalation forced | ticket_id={payload.ticket_id}")

        except anthropic.APIError as exc:
            # Fix 3: queue on Claude API failure
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

    # Fix 5: escalate on knowledge gap — only when a real KB is connected
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
                total_tokens    += generated.tokens_used
                total_cost_units += generated.cost_units
                model_used = generated.model_used

                # Fix 1: draft mode — save response but never send
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
            "status":       final_status,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "tokens_used":  total_tokens,
            "api_cost_cents": total_cost_units,
            "knowledge_gap":  knowledge_gap,
            "rag_confidence": rag_confidence,
            "language":       language,
        }
        if context is not None:
            update["customer_context"]  = context.model_dump()
            update["escalation_summary"] = escalation_summary
        if classification is not None:
            update["intent"]             = classification.intent
            update["confidence"]         = classification.confidence
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

    print(f"{'='*60}\n")

    # ── Build response ────────────────────────────────────────────────
    resp: dict = {
        "ticket_id": payload.ticket_id,
        "db_id":     db_id,
        "status":    final_status,
        "language":  language,
        "draft_mode": draft,
        "injection_detected": injection_detected,
        "knowledge_gap":  knowledge_gap,
        "rag_confidence": rag_confidence,
        "tokens_used":    total_tokens,
        "cost_units":     total_cost_units,
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
        # Reset status to pending so the main handler processes it
        db.table("tickets").update({"status": "pending"}).eq("id", db_id).execute()
        # Re-run classification + generation directly
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
                "status": "escalated",
                "intent": classification.intent,
                "confidence": classification.confidence,
                "escalate_immediately": classification.escalate_immediately,
                "tokens_used": classification.tokens_used,
                "api_cost_cents": classification.cost_units,
            }).eq("id", db_id).execute()
            logger.info(f"Queued ticket escalated on retry | db_id={db_id}")
        else:
            generated = await generate_response(
                message=safe_message, context=context,
                intent=classification.intent, tone=classification.tone,
                language=language,
            )
            db.table("tickets").update({
                "status": "resolved",
                "intent": classification.intent,
                "confidence": classification.confidence,
                "ai_response": generated.response_text,
                "model_used": generated.model_used,
                "tokens_used": classification.tokens_used + generated.tokens_used,
                "api_cost_cents": classification.cost_units + generated.cost_units,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", db_id).execute()
            logger.info(f"Queued ticket resolved on retry | db_id={db_id}")

    except anthropic.APIError:
        db.table("tickets").update({"status": "queued"}).eq("id", db_id).execute()
        logger.warning(f"Retry failed — Claude still unavailable | db_id={db_id}")
    except Exception as exc:
        logger.error(f"Retry error for {db_id}: {exc}")
        db.table("tickets").update({"status": "queued"}).eq("id", db_id).execute()
