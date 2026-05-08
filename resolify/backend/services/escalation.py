from models.schemas import EnrichedContext


def _summarise_message(message: str) -> str:
    msg = message.strip().rstrip(".")
    return msg[:120] + "..." if len(msg) > 120 else msg


def _suggest_action(message: str, context: EnrichedContext) -> str:
    msg_lower = message.lower()

    if context.account_health == "churning" or "cancel" in msg_lower:
        return f"URGENT — retention risk. Loop in account manager immediately. MRR at stake: ${context.mrr}/mo"

    if context.payment_status == "past_due":
        return f"Resolve billing issue first, then address ticket. Past-due since unknown — check Stripe."

    if context.account_health == "at_risk":
        return f"Handle with priority. Customer showing churn signals ({context.total_tickets_this_month} tickets this month)."

    if context.payment_status == "trialing":
        return f"Trial customer ({context.days_as_customer} days in). Fast resolution may convert to paid."

    if "export" in msg_lower or "csv" in msg_lower or "download" in msg_lower:
        return "Self-serve likely — point to docs. Low urgency."

    if "login" in msg_lower or "log in" in msg_lower or "password" in msg_lower or "access" in msg_lower:
        return "Auth issue — check SSO config or send password reset link."

    if context.total_tickets_this_month >= 5:
        return f"High-volume customer ({context.total_tickets_this_month} tickets this month) — consider proactive outreach."

    return "Standard support response. Aim for same-day resolution."


def build_escalation_summary(
    ticket_message: str,
    customer_email: str,
    context: EnrichedContext,
) -> str:
    actions_line = ", ".join(context.last_3_actions)
    issue_line = _summarise_message(ticket_message)
    action_line = _suggest_action(ticket_message, context)

    return (
        f"🎫 RESOLIFY — TICKET SUMMARY\n\n"
        f"👤 Customer: {customer_email} | {context.company_name}\n"
        f"💰 Plan: {context.plan} | MRR: ${context.mrr}/mo | Status: {context.payment_status}\n"
        f"📅 Customer for: {context.days_as_customer} days | Health: {context.account_health}\n"
        f"🔄 Recent activity: {actions_line}\n"
        f"📊 Tickets this month: {context.total_tickets_this_month}\n\n"
        f"❓ Issue: {issue_line}\n"
        f"⚠️  Action needed: {action_line}"
    )
