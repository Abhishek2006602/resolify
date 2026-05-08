import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class SettingsPatch(BaseModel):
    draft_mode: bool


@router.get("/settings")
async def get_settings():
    try:
        from database import get_db
        from services.clients import get_default_client_id
        db = get_db()

        client_id = await get_default_client_id()
        if not client_id:
            return {"configured": False}

        result = db.table("clients").select(
            "id, name, plan, draft_mode, created_at"
        ).eq("id", client_id).execute()

        if not result.data:
            return {"configured": False}

        client = result.data[0]
        ticket_rows = db.table("tickets").select("id").eq("client_id", client_id).execute()
        total_tickets = len(ticket_rows.data)

        return {
            "configured": True,
            "client_id": client["id"],
            "name": client.get("name") or "Resolify",
            "plan": client.get("plan") or "starter",
            "draft_mode": bool(client.get("draft_mode", True)),
            "created_at": client.get("created_at"),
            "total_tickets": total_tickets,
        }
    except Exception as exc:
        logger.error(f"Settings fetch failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/settings")
async def update_settings(body: SettingsPatch):
    try:
        from database import get_db
        from services.clients import get_default_client_id
        db = get_db()

        client_id = await get_default_client_id()
        if not client_id:
            raise HTTPException(status_code=404, detail="No client configured")

        db.table("clients").update({"draft_mode": body.draft_mode}).eq("id", client_id).execute()
        logger.info(f"Settings updated | client_id={client_id} draft_mode={body.draft_mode}")
        return {"ok": True, "draft_mode": body.draft_mode}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Settings update failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
