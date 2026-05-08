import logging
from typing import Optional

logger = logging.getLogger(__name__)

_default_client_id: Optional[str] = None


async def get_default_client_id() -> Optional[str]:
    global _default_client_id
    if _default_client_id:
        return _default_client_id
    try:
        from database import get_db
        db = get_db()
        result = db.table("clients").select("id").order("created_at").limit(1).execute()
        if result.data:
            _default_client_id = result.data[0]["id"]
            logger.info(f"Default client loaded | id={_default_client_id}")
            return _default_client_id
    except Exception as exc:
        logger.warning(f"Could not fetch default client: {exc}")
    return None


async def get_client(client_id: str) -> Optional[dict]:
    try:
        from database import get_db
        db = get_db()
        result = db.table("clients").select("*").eq("id", client_id).execute()
        return result.data[0] if result.data else None
    except Exception as exc:
        logger.warning(f"Could not fetch client {client_id}: {exc}")
        return None


async def is_draft_mode(client_id: Optional[str]) -> bool:
    """Returns True if client is in draft mode. Safe default is True."""
    if not client_id:
        return True
    client = await get_client(client_id)
    if client is None:
        return True
    return bool(client.get("draft_mode", True))
