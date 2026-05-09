from models.schemas import EnrichedContext


async def enrich_customer(email: str) -> EnrichedContext:
    # TODO: Replace with real Stripe API call using client.stripe_key
    return EnrichedContext(
        company_name="Demo Company",
        plan="Growth",
        mrr=299,
        days_as_customer=90,
        payment_status="active",
        account_health="healthy",
        last_3_actions=["logged in", "viewed dashboard", "exported report"],
        total_tickets_this_month=5,
    )
