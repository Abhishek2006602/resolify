"""
RAG service with in-memory caching.
Performs real pgvector cosine-similarity search when OPENAI_API_KEY is set
and the knowledge_chunks table has rows. Falls back to empty results
(and keeps HAS_KNOWLEDGE_BASE = False) when neither condition is met.
"""
import hashlib
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# cache: md5_key -> (chunks, confidence, timestamp)
_cache: dict[str, tuple[list[str], float, float]] = {}
CACHE_MAX_SIZE = 0  # 0 = disabled; set >0 to re-enable in-memory cache
CACHE_TTL_SECONDS = 86_400  # 24 hours

SIMILARITY_THRESHOLD = 0.30
TOP_K = 5
EMBED_MODEL = "text-embedding-3-small"

# Flipped to True the first time a real DB query returns results.
# webhooks.py checks this to decide whether knowledge-gap escalation applies.
HAS_KNOWLEDGE_BASE = False


def _make_key(client_id: Optional[str], query: str) -> str:
    raw = f"{client_id or 'default'}:{query.strip().lower()}"
    return hashlib.md5(raw.encode()).hexdigest()


def clean_expired_cache() -> None:
    if CACHE_MAX_SIZE == 0:
        return
    now = time.time()
    expired = [k for k, (_, _, ts) in _cache.items() if now - ts > CACHE_TTL_SECONDS]
    for k in expired:
        del _cache[k]
    if len(_cache) > CACHE_MAX_SIZE:
        by_age = sorted(_cache.items(), key=lambda x: x[1][2])
        for k, _ in by_age[: len(_cache) - CACHE_MAX_SIZE]:
            del _cache[k]


async def _retrieve_from_vector_db(
    query: str, client_id: Optional[str]
) -> tuple[list[str], float]:
    """
    Embed the query with OpenAI and call the match_knowledge_chunks RPC
    function in Supabase (pgvector cosine similarity).
    Returns (chunks, avg_similarity).
    """
    global HAS_KNOWLEDGE_BASE

    from config import OPENAI_API_KEY
    if not OPENAI_API_KEY:
        return [], 0.0

    try:
        from openai import OpenAI
        from database import get_db

        oai = OpenAI(api_key=OPENAI_API_KEY)
        resp = oai.embeddings.create(model=EMBED_MODEL, input=[query])
        query_embedding = resp.data[0].embedding

        db = get_db()
        result = db.rpc(
            "match_knowledge_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": SIMILARITY_THRESHOLD,
                "match_count": TOP_K,
            },
        ).execute()

        if not result.data:
            return [], 0.0

        chunks = [r["content"] for r in result.data]
        avg_sim = sum(r["similarity"] for r in result.data) / len(result.data)

        # Mark the KB as active once we confirm real results exist
        if chunks:
            HAS_KNOWLEDGE_BASE = True

        return chunks, avg_sim

    except Exception as exc:
        logger.warning(f"Vector search failed: {exc}")
        return [], 0.0


async def retrieve(
    query: str, client_id: Optional[str] = None
) -> tuple[list[str], float]:
    """Returns (chunks, confidence). confidence = avg cosine similarity of top results."""
    if CACHE_MAX_SIZE == 0:
        return await _retrieve_from_vector_db(query, client_id)

    clean_expired_cache()
    key = _make_key(client_id, query)

    if key in _cache:
        chunks, confidence, _ = _cache[key]
        logger.info(f"RAG cache hit  | client={client_id} key={key[:8]}")
        print(f"  [rag] cache HIT  | query={query[:50]!r}")
        return chunks, confidence

    logger.info(f"RAG cache miss | client={client_id} key={key[:8]}")
    print(f"  [rag] cache MISS | query={query[:50]!r}")

    chunks, confidence = await _retrieve_from_vector_db(query, client_id)

    _cache[key] = (chunks, confidence, time.time())
    return chunks, confidence
