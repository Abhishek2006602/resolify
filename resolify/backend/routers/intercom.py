import json
import hmac
import hashlib
import httpx
import logging
import re
from urllib.parse import urlencode
from fastapi import APIRouter, Request, HTTPException, Header, Depends, Query
from fastapi.responses import RedirectResponse
from typing import Optional
from models.schemas import IntercomWebhookPayload
from routers.webhooks import process_ticket
from services.auth import get_current_user

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

    item    = data.get("data", {}).get("item", {})
    conv_id = str(item.get("id", "unknown"))
    source  = item.get("source", {})
    author  = source.get("author", {})
    body    = _strip_html(source.get("body", ""))

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
    name  = author.get("name")
    if not email or not body:
        logger.warning(f"Intercom event missing email or body | topic={topic}")
        return None

    return IntercomWebhookPayload(
        ticket_id=f"IC-{conv_id}",
        customer_email=email,
        customer_name=name,
        message=body,
    )


# ── Live webhook (real Intercom events) ───────────────────────────────────────

@router.post("/webhook/intercom/live")
async def intercom_live_webhook(
    request: Request,
    x_hub_signature: Optional[str] = Header(None),
):
    """Receives real Intercom webhook events (conversation.user.created / replied)."""
    raw_body = await request.body()

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

    item    = data.get("data", {}).get("item", {})
    conv_id = str(item.get("id", "")) or None

    payload = _parse_intercom_event(data)
    if payload is None:
        return {"status": "skipped", "reason": "could not extract email or message"}

    return await process_ticket(payload, conversation_id=conv_id)


# ── Manual webhook registration (legacy / admin use) ─────────────────────────

@router.post("/intercom/register-webhook")
async def register_intercom_webhook(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Save a client's Intercom access token and register the webhook URL."""
    from database import get_db
    from services.intercom import register_webhook as svc_register

    data = await request.json()
    access_token = (data.get("access_token") or "").strip()
    webhook_url  = (data.get("webhook_url") or "").strip()

    if not access_token:
        raise HTTPException(status_code=400, detail="access_token is required")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="webhook_url is required")

    client_id = user["sub"]
    db = get_db()

    try:
        db.table("clients").update({
            "intercom_access_token": access_token,
            "intercom_connected": True,
        }).eq("id", client_id).execute()
    except Exception as exc:
        logger.warning(f"Could not set intercom_connected (column may be missing): {exc}")
        try:
            db.table("clients").update({
                "intercom_access_token": access_token,
            }).eq("id", client_id).execute()
        except Exception as exc2:
            logger.error(f"Failed to save Intercom token: {exc2}")
            raise HTTPException(status_code=500, detail="Could not save access token")

    ok = await svc_register(webhook_url, access_token)

    return {
        "ok": True,
        "webhook_registered": ok,
        "message": (
            "Intercom connected and webhook registered successfully"
            if ok
            else "Token saved — webhook registration failed (check token permissions)"
        ),
    }


# ── OAuth flow ────────────────────────────────────────────────────────────────

@router.get("/intercom/oauth/start")
async def intercom_oauth_start(user: dict = Depends(get_current_user)):
    """
    Return the Intercom OAuth authorization URL for the logged-in client.
    The client_id is encoded in the state parameter so the callback can
    associate the token with the right client row.
    """
    from config import INTERCOM_CLIENT_ID, INTERCOM_REDIRECT_URI

    params = {
        "client_id":    INTERCOM_CLIENT_ID,
        "redirect_uri": INTERCOM_REDIRECT_URI,
        "state":        user["sub"],
    }
    oauth_url = f"https://app.intercom.com/oauth?{urlencode(params)}"
    return {"oauth_url": oauth_url}


@router.get("/intercom/oauth/callback")
async def intercom_oauth_callback(
    code:  Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    """
    Public OAuth callback. Intercom redirects here after the user authorizes.
    Exchanges the code for an access token, saves it, and registers the webhook.
    """
    from config import (
        INTERCOM_CLIENT_ID,
        INTERCOM_CLIENT_SECRET,
        INTERCOM_REDIRECT_URI,
        FRONTEND_URL,
    )
    from services.intercom import get_workspace_info, register_webhook as svc_register

    error_redirect = f"{FRONTEND_URL}/onboarding?step=2&error=oauth_failed"
    success_redirect = f"{FRONTEND_URL}/onboarding?step=3&intercom=connected"

    if not code or not state:
        logger.warning("OAuth callback missing code or state")
        return RedirectResponse(error_redirect)

    client_id = state  # state carries the client's UUID

    # Exchange authorization code for access token
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.intercom.io/auth/eagle/token",
                data={
                    "code":          code,
                    "client_id":     INTERCOM_CLIENT_ID,
                    "client_secret": INTERCOM_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if resp.status_code != 200:
                logger.error(
                    f"Intercom token exchange failed | status={resp.status_code} body={resp.text[:300]}"
                )
                return RedirectResponse(error_redirect)

            token_data   = resp.json()
            access_token = token_data.get("access_token", "")
    except Exception as exc:
        logger.error(f"Intercom OAuth token exchange error: {exc}")
        return RedirectResponse(error_redirect)

    if not access_token:
        logger.error("Intercom OAuth: access_token missing from response")
        return RedirectResponse(error_redirect)

    # Fetch workspace name and admin ID
    workspace    = await get_workspace_info(access_token)
    admin_id     = workspace.get("admin_id", "")
    workspace_name = workspace.get("workspace_name", "")

    # Persist to database
    try:
        from database import get_db
        db = get_db()
        update: dict = {
            "intercom_access_token": access_token,
            "intercom_connected":    True,
        }
        if admin_id:
            update["intercom_admin_id"] = admin_id
        if workspace_name:
            update["workspace_name"] = workspace_name
        db.table("clients").update(update).eq("id", client_id).execute()
        logger.info(f"Intercom OAuth success | client={client_id} workspace={workspace_name}")
    except Exception as exc:
        logger.error(f"Failed to save OAuth data to DB: {exc}")
        return RedirectResponse(error_redirect)

    # Register webhook in the client's Intercom workspace
    webhook_url = f"https://resolify-backend.onrender.com/api/webhook/intercom/live"
    await svc_register(webhook_url, access_token)

    return RedirectResponse(success_redirect)
