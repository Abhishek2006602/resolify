import httpx
import logging
from config import INTERCOM_ACCESS_TOKEN

logger = logging.getLogger(__name__)
INTERCOM_BASE = "https://api.intercom.io"


def _headers(access_token: str = "") -> dict:
    return {
        "Authorization": f"Bearer {access_token or INTERCOM_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Intercom-Version": "2.11",
    }


async def _get_admin_id(access_token: str = "") -> str:
    """Fetch the admin ID associated with the access token (needed for replies)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{INTERCOM_BASE}/me", headers=_headers(access_token))
            if resp.status_code == 200:
                return str(resp.json().get("id", ""))
    except Exception as exc:
        logger.warning(f"Could not fetch Intercom admin ID: {exc}")
    return ""


async def get_workspace_info(access_token: str = "") -> dict:
    """Get admin ID and workspace name from /me endpoint."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{INTERCOM_BASE}/me", headers=_headers(access_token))
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "admin_id": str(data.get("id", "")),
                    "workspace_name": data.get("app", {}).get("name", "") or "",
                }
    except Exception as exc:
        logger.error(f"Could not fetch Intercom workspace info: {exc}")
    return {"admin_id": "", "workspace_name": ""}


async def reply_to_conversation(conversation_id: str, message: str, access_token: str = "") -> bool:
    """Send AI-generated reply to customer in Intercom."""
    admin_id = await _get_admin_id(access_token)
    url = f"{INTERCOM_BASE}/conversations/{conversation_id}/reply"
    body: dict = {"message_type": "comment", "type": "admin", "body": message}
    if admin_id:
        body["admin_id"] = admin_id
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=body, headers=_headers(access_token))
            if resp.status_code in (200, 201):
                return True
            logger.error(
                f"Intercom reply failed | conv={conversation_id} "
                f"status={resp.status_code} body={resp.text[:200]}"
            )
    except Exception as exc:
        logger.error(f"Intercom reply error for {conversation_id}: {exc}")
    return False


async def add_internal_note(conversation_id: str, note: str, access_token: str = "") -> bool:
    """Add internal note visible only to agents in Intercom."""
    admin_id = await _get_admin_id(access_token)
    url = f"{INTERCOM_BASE}/conversations/{conversation_id}/reply"
    body: dict = {"message_type": "note", "type": "admin", "body": note}
    if admin_id:
        body["admin_id"] = admin_id
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=body, headers=_headers(access_token))
            if resp.status_code in (200, 201):
                return True
            logger.error(
                f"Intercom note failed | conv={conversation_id} "
                f"status={resp.status_code} body={resp.text[:200]}"
            )
    except Exception as exc:
        logger.error(f"Intercom note error for {conversation_id}: {exc}")
    return False


async def get_contact_details(contact_id: str, access_token: str = "") -> dict:
    """Get contact details from Intercom."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{INTERCOM_BASE}/contacts/{contact_id}",
                headers=_headers(access_token),
            )
            if resp.status_code == 200:
                return resp.json()
            logger.error(f"Intercom contact fetch failed | status={resp.status_code}")
    except Exception as exc:
        logger.error(f"Intercom contact error for {contact_id}: {exc}")
    return {}


async def register_webhook(webhook_url: str, access_token: str) -> bool:
    """Register a webhook URL in Intercom for a client."""
    from config import INTERCOM_WEBHOOK_SECRET
    body: dict = {
        "service_type": "web",
        "url": webhook_url,
        "topics": ["conversation.user.created", "conversation.user.replied"],
    }
    if INTERCOM_WEBHOOK_SECRET:
        body["hub.secret"] = INTERCOM_WEBHOOK_SECRET
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{INTERCOM_BASE}/subscriptions",
                json=body,
                headers=_headers(access_token),
            )
            if resp.status_code in (200, 201):
                logger.info(f"Intercom webhook registered | url={webhook_url}")
                return True
            logger.error(
                f"Webhook registration failed | status={resp.status_code} body={resp.text[:200]}"
            )
    except Exception as exc:
        logger.error(f"Intercom webhook registration error: {exc}")
    return False
