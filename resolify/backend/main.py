import sys
import asyncio
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.webhooks import router as webhook_router, process_queued_ticket
from routers.tickets import router as tickets_router
from routers.settings import router as settings_router
from routers.intercom import router as intercom_router
from routers.knowledge import router as knowledge_router
from services.rag import clean_expired_cache

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

RETRY_INTERVAL_SECONDS   = 300   # 5 minutes
CACHE_CLEANUP_INTERVAL   = 3_600 # 1 hour


async def _retry_queued_tickets() -> None:
    """Fix 3 — Background task: retry tickets with status='queued' every 5 minutes."""
    while True:
        await asyncio.sleep(RETRY_INTERVAL_SECONDS)
        try:
            from database import get_db
            db = get_db()
            queued = db.table("tickets").select("*").eq("status", "queued").execute().data
            if queued:
                logger.info(f"Retry task: found {len(queued)} queued ticket(s)")
                print(f"\n[retry] Processing {len(queued)} queued ticket(s)...")
                for ticket in queued:
                    await process_queued_ticket(ticket)
            else:
                logger.debug("Retry task: no queued tickets")
        except Exception as exc:
            logger.error(f"Retry task error: {exc}")


async def _rag_cache_cleanup() -> None:
    """Fix 7 — Background task: purge expired RAG cache entries every hour."""
    while True:
        await asyncio.sleep(CACHE_CLEANUP_INTERVAL)
        try:
            clean_expired_cache()
            logger.info("RAG cache cleanup complete")
        except Exception as exc:
            logger.error(f"RAG cache cleanup error: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    import gc
    gc.collect()
    gc.set_threshold(100, 5, 5)
    logger.info("Resolify is running")
    print("Resolify is running")

    retry_task   = asyncio.create_task(_retry_queued_tickets())
    cleanup_task = asyncio.create_task(_rag_cache_cleanup())

    yield

    retry_task.cancel()
    cleanup_task.cancel()
    try:
        await retry_task
    except asyncio.CancelledError:
        pass
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Resolify", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://resolify.vercel.app",
        "https://resolify-r3rqwbe1h-abhishekkamlakar425-9629s-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(intercom_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api/knowledge")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
