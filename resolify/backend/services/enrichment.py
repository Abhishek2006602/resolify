import random
from models.schemas import EnrichedContext


_KNOWN_CUSTOMERS: dict[str, dict] = {
    "john@acmesaas.com": {
        "plan": "Growth",
        "mrr": 299,
        "days_as_customer": 187,
        "payment_status": "active",
        "last_3_actions": ["exported report", "added team member", "upgraded plan"],
        "account_health": "healthy",
        "total_tickets_this_month": 1,
        "company_name": "AcmeSaaS",
    },
    "test@startup.io": {
        "plan": "Starter",
        "mrr": 99,
        "days_as_customer": 23,
        "payment_status": "trialing",
        "last_3_actions": ["created first project", "invited collaborator", "viewed onboarding guide"],
        "account_health": "healthy",
        "total_tickets_this_month": 2,
        "company_name": "Startup.io",
    },
    "angry@bigcorp.com": {
        "plan": "Scale",
        "mrr": 599,
        "days_as_customer": 412,
        "payment_status": "past_due",
        "last_3_actions": ["failed payment retry", "downloaded invoice", "opened billing page"],
        "account_health": "at_risk",
        "total_tickets_this_month": 5,
        "company_name": "BigCorp",
    },
}

_RANDOM_POOL = [
    {
        "plan": "Free",
        "mrr": 0,
        "days_as_customer": 14,
        "payment_status": "active",
        "last_3_actions": ["signed up", "viewed dashboard", "created first project"],
        "account_health": "healthy",
        "total_tickets_this_month": 0,
        "company_name": "Unknown Co",
    },
    {
        "plan": "Starter",
        "mrr": 99,
        "days_as_customer": 61,
        "payment_status": "active",
        "last_3_actions": ["ran report", "updated profile", "connected integration"],
        "account_health": "healthy",
        "total_tickets_this_month": 1,
        "company_name": "Bright Labs",
    },
    {
        "plan": "Growth",
        "mrr": 299,
        "days_as_customer": 203,
        "payment_status": "past_due",
        "last_3_actions": ["bulk export", "removed team member", "viewed billing"],
        "account_health": "at_risk",
        "total_tickets_this_month": 4,
        "company_name": "Nova Systems",
    },
    {
        "plan": "Scale",
        "mrr": 599,
        "days_as_customer": 540,
        "payment_status": "cancelled",
        "last_3_actions": ["exported all data", "removed integrations", "contacted support"],
        "account_health": "churning",
        "total_tickets_this_month": 7,
        "company_name": "Apex Corp",
    },
    {
        "plan": "Starter",
        "mrr": 99,
        "days_as_customer": 8,
        "payment_status": "trialing",
        "last_3_actions": ["completed onboarding", "added first user", "viewed pricing"],
        "account_health": "healthy",
        "total_tickets_this_month": 1,
        "company_name": "Seedling Inc",
    },
]


async def enrich_customer(email: str) -> EnrichedContext:
    if email in _KNOWN_CUSTOMERS:
        data = _KNOWN_CUSTOMERS[email]
    else:
        seed = sum(ord(c) for c in email)
        data = _RANDOM_POOL[seed % len(_RANDOM_POOL)]

    return EnrichedContext(**data)
