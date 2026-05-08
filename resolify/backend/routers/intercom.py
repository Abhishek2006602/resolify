import json
import hmac
import hashlib
import logging
import re
from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
from models.schemas import IntercomWebhookPayload
from routers.webhooks import receive_intercom_webhook

logger = logging.getLogger(__name__)
router = APIRouter()

SUPPORTED_TOPICS = {"conversation.user.created", "conversation.user.replied"}


def _verify_signature(secret: str, raw_body: bytes, header_sig: str) -> bool:
    expected = "sha1=" + hmac.new(secret.encode(), raw_body, hashlib.sha1).hexdigest()
    return hmac.compare_digest(expected, header_sig)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").strip()


def _parse_intercom_event(data: dict) -> Optional[IntercomWebhookPayload]:
    """Map Intercom's notification_event structure to our internal payload."""
    topic = data.get("topic", "")
    if topic not in SUPPORTED_TOPICS:
        return None

    item = data.get("data", {}).get("item", {})
    conv_id = str(item.get("id", "unknown"))

    source = item.get("source", {})
    author = source.get("author", {})
    body = _strip_html(source.get("body", ""))

    # For replied events, grab the latest part authored by the user
    if topic == "conversation.user.replied":
        parts = (
            item.get("conversation_parts", {})
            .get("conversation_parts", [])
        )
        user_parts = [
            p for p in parts
            if p.get("author", {}).get("type") in ("user", "lead")
        ]
        if user_parts:
            latest = user_parts[-1]
            body = _strip_html(latest.get("body", "")) or body
            if not author.get("email"):
                author = latest.get("author", author)

    email = author.get("email", "").strip()
    name = author.get("name")
    if not email or not body:
        logger.warning(f"Intercom event missing email or body | topic={topic}")
        return None

    return IntercomWebhookPayload(
        ticket_id=f"IC-{conv_id}",
        customer_email=email,
        customer_name=name,
        message=body,
    )


@router.post("/webhook/intercom/live")
async def intercom_live_webhook(
    request: Request,
    x_hub_signature: Optional[str] = Header(None),
):
    """Receives real Intercom webhook events (conversation.user.created / replied)."""
    raw_body = await request.body()

    # Signature verification — only enforced when a secret is configured
    try:
        from database import get_db
        from services.clients import get_default_client_id
        db = get_db()
        client_id = await get_default_client_id()
        if client_id:
            rows = db.table("clients").select("intercom_webhook_secret").eq("id", client_id).execute()
            secret = rows.data[0].get("intercom_webhook_secret") if rows.data else None
            if secret and x_hub_signature:
                if not _verify_signature(secret, raw_body, x_hub_signature):
                    logger.warning("Intercom webhook signature mismatch — rejecting")
                    raise HTTPException(status_code=401, detail="Invalid signature")
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"Signature check skipped — could not fetch client: {exc}")

    try:
        data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    topic = data.get("topic", "")
    logger.info(f"Intercom live event | topic={topic}")

    if topic == "ping":
        return {"status": "pong"}

    if topic not in SUPPORTED_TOPICS:
        return {"status": "ignored", "topic": topic}

    payload = _parse_intercom_event(data)
    if payload is None:
        return {"status": "skipped", "reason": "could not extract email or message"}

    return await receive_intercom_webhook(payload)
