import logging
import anthropic
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from services.costs import units_to_cents, check_cost_alert, PLAN_MONTHLY_REVENUE
from config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)
router = APIRouter()

_haiku_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def _month_start() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


def _today_start() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


def _week_start() -> str:
    now = datetime.now(timezone.utc)
    return (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()


@router.get("/tickets")
async def list_tickets():
    try:
        from database import get_db
        db = get_db()
        result = db.table("tickets").select("*").order("created_at", desc=True).execute()
        return result.data
    except Exception as exc:
        logger.error(f"Failed to fetch tickets: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stats/today")
async def stats_today():
    try:
        from database import get_db
        db = get_db()
        rows = db.table("tickets").select("status").gte("created_at", _today_start()).execute().data

        total    = len(rows)
        resolved = sum(1 for r in rows if r["status"] == "resolved")
        escalated= sum(1 for r in rows if r["status"] == "escalated")
        pending  = sum(1 for r in rows if r["status"] in ("pending", "enriched", "queued"))

        return {
            "total_tickets":      total,
            "resolved":           resolved,
            "escalated":          escalated,
            "pending":            pending,
            "time_saved_minutes": resolved * 8,
            "cost_saved_dollars": round(resolved * 3.33, 2),
            "resolution_rate":    round((resolved / total * 100), 1) if total > 0 else 0.0,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stats/costs")
async def stats_costs():
    try:
        from database import get_db
        db = get_db()

        rows = (
            db.table("tickets")
            .select("api_cost_cents, client_id")
            .gte("created_at", _month_start())
            .execute()
            .data
        )

        total_units = sum(r.get("api_cost_cents") or 0 for r in rows)
        count       = len(rows)
        avg_units   = total_units / count if count else 0

        total_cents = units_to_cents(total_units)
        avg_cents   = units_to_cents(int(avg_units))

        # Alert check — use first client's plan if available
        alert = False
        alert_message = None
        try:
            client_rows = (
                db.table("clients").select("plan").order("created_at").limit(1).execute().data
            )
            plan = client_rows[0]["plan"] if client_rows else "starter"
            alert, alert_message = check_cost_alert(total_units, plan)
            if alert:
                logger.warning(alert_message)
                print(f"  [cost-alert] {alert_message}")
        except Exception:
            pass

        return {
            "total_cost_this_month_cents": total_cents,
            "cost_per_ticket_avg_cents":   avg_cents,
            "alert":         alert,
            "alert_message": alert_message,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stats/knowledge-gaps")
async def stats_knowledge_gaps():
    try:
        from database import get_db
        db = get_db()

        rows = (
            db.table("tickets")
            .select("id, message, created_at")
            .eq("knowledge_gap", True)
            .gte("created_at", _week_start())
            .order("created_at", desc=True)
            .execute()
            .data
        )

        gaps_count = len(rows)

        # Extract topics via Claude Haiku for up to 10 gap tickets
        topics: list[str] = []
        for row in rows[:10]:
            try:
                resp = _haiku_client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=16,
                    messages=[{
                        "role": "user",
                        "content": (
                            f"In 3 words or fewer, describe what this support question is about. "
                            f"Return ONLY the topic, no punctuation:\n{row['message'][:200]}"
                        ),
                    }],
                )
                topic = resp.content[0].text.strip()
                if topic and topic not in topics:
                    topics.append(topic)
            except Exception:
                pass

        return {
            "gaps_this_week":          gaps_count,
            "top_unanswered_topics":   topics[:5],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stats/analytics")
async def stats_analytics():
    """7-day trend, intent breakdown, model usage — for Analytics page."""
    from collections import defaultdict
    try:
        from database import get_db
        db = get_db()

        week_ago = (datetime.now(timezone.utc) - timedelta(days=6)).replace(
            hour=0, minute=0, second=0, microsecond=0
        ).isoformat()

        rows = (
            db.table("tickets")
            .select("status, intent, model_used, api_cost_cents, created_at, language, confidence")
            .gte("created_at", week_ago)
            .order("created_at")
            .execute()
            .data
        )

        # Daily counts
        daily: dict = defaultdict(lambda: {"total": 0, "resolved": 0, "escalated": 0})
        for r in rows:
            day = r["created_at"][:10]
            daily[day]["total"] += 1
            if r["status"] == "resolved":
                daily[day]["resolved"] += 1
            elif r["status"] == "escalated":
                daily[day]["escalated"] += 1

        daily_list = []
        for i in range(7):
            d = (datetime.now(timezone.utc) - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            base = {"date": d, "total": 0, "resolved": 0, "escalated": 0}
            base.update(daily.get(d, {}))
            base["date"] = d
            daily_list.append(base)

        # Intent breakdown
        intent_counts: dict = defaultdict(int)
        for r in rows:
            intent_counts[r.get("intent") or "unknown"] += 1

        # Model usage
        model_counts: dict = defaultdict(int)
        for r in rows:
            if r.get("model_used"):
                model_counts[r["model_used"]] += 1

        # Language breakdown
        lang_counts: dict = defaultdict(int)
        for r in rows:
            lang_counts[r.get("language") or "en"] += 1

        total = len(rows)
        resolved = sum(1 for r in rows if r["status"] == "resolved")
        confs = [r["confidence"] for r in rows if r.get("confidence") is not None]

        return {
            "daily": daily_list,
            "intent_breakdown": [
                {"intent": k, "count": v}
                for k, v in sorted(intent_counts.items(), key=lambda x: -x[1])
            ],
            "model_usage": dict(model_counts),
            "language_breakdown": [
                {"language": k, "count": v}
                for k, v in sorted(lang_counts.items(), key=lambda x: -x[1])[:5]
            ],
            "total_7d": total,
            "resolved_7d": resolved,
            "resolution_rate_7d": round(resolved / total * 100, 1) if total > 0 else 0.0,
            "avg_confidence": round(sum(confs) / len(confs) * 100, 1) if confs else 0.0,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    try:
        from database import get_db
        db = get_db()
        result = db.table("tickets").select("*").eq("id", ticket_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
