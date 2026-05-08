import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)
router = APIRouter()

CHUNK_SIZE = 400
CHUNK_OVERLAP = 50
EMBED_MODEL = "text-embedding-3-small"
EMBED_BATCH = 100  # OpenAI max per request


class UploadBody(BaseModel):
    text: str
    source: Optional[str] = "manual"


def _chunk_text(text: str) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        chunk = text[start : start + CHUNK_SIZE].strip()
        if chunk:
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def _get_openai():
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in .env")
    try:
        from openai import OpenAI
        return OpenAI(api_key=OPENAI_API_KEY)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="openai package not installed — run: pip install openai",
        )


def _embed_batch(client, texts: list[str]) -> list[list[float]]:
    """Embed texts in batches to stay within OpenAI's per-request limit."""
    embeddings: list[list[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i : i + EMBED_BATCH]
        resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
        embeddings.extend(item.embedding for item in resp.data)
    return embeddings


@router.post("/upload")
async def upload_knowledge(body: UploadBody):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    chunks = _chunk_text(body.text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No usable chunks produced from input")

    try:
        from database import get_db
        oai = _get_openai()
        db = get_db()

        embeddings = _embed_batch(oai, chunks)

        rows = [
            {
                "content": chunk,
                "source": body.source or "manual",
                "embedding": embedding,
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]

        result = db.table("knowledge_chunks").insert(rows).execute()
        created = len(result.data) if result.data else 0

        logger.info(f"Knowledge upload | source={body.source!r} chunks={created}")
        return {"status": "ok", "chunks_created": created, "source": body.source}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Knowledge upload failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/list")
async def list_knowledge():
    try:
        from database import get_db
        db = get_db()
        result = (
            db.table("knowledge_chunks")
            .select("id, source, content, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        return [
            {
                "id": r["id"],
                "source": r["source"],
                "preview": (r["content"] or "")[:100],
                "created_at": r["created_at"],
            }
            for r in (result.data or [])
        ]
    except Exception as exc:
        logger.error(f"Knowledge list failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/clear")
async def clear_knowledge():
    try:
        from database import get_db
        db = get_db()
        # neq with the nil UUID matches every real row (all have auto-generated UUIDs)
        result = (
            db.table("knowledge_chunks")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
            .execute()
        )
        deleted = len(result.data) if result.data else 0
        logger.info(f"Knowledge cleared | rows={deleted}")
        return {"status": "ok", "chunks_deleted": deleted}
    except Exception as exc:
        logger.error(f"Knowledge clear failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
