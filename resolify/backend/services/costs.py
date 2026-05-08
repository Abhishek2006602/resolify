"""
Cost tracking utilities.
Unit: api_cost_cents column stores values in 0.01-cent units (hundredths of a cent).
So 1 unit = $0.00001.  Divide by 100 to get cents, by 10_000 to get dollars.

Example: $0.00521 per ticket → stored as 521 units → shown as 5.21 cents.
"""

HAIKU_INPUT_RATE  = 0.80    # $ per 1M tokens
HAIKU_OUTPUT_RATE = 4.00    # $ per 1M tokens
SONNET_INPUT_RATE  = 3.00   # $ per 1M tokens
SONNET_OUTPUT_RATE = 15.00  # $ per 1M tokens

PLAN_MONTHLY_REVENUE = {
    "free":    0,
    "starter": 99,
    "growth":  299,
    "scale":   599,
}


def calc_cost_units(input_tokens: int, output_tokens: int, model: str) -> int:
    """Return cost in hundredths-of-a-cent units (1 unit = $0.00001)."""
    if "haiku" in model:
        dollars = (input_tokens * HAIKU_INPUT_RATE + output_tokens * HAIKU_OUTPUT_RATE) / 1_000_000
    else:
        dollars = (input_tokens * SONNET_INPUT_RATE + output_tokens * SONNET_OUTPUT_RATE) / 1_000_000
    return max(1, round(dollars * 100_000))


def units_to_cents(units: int) -> float:
    return round(units / 100, 4)


def check_cost_alert(total_units: int, plan: str) -> tuple[bool, str | None]:
    """Returns (alert, message). Alert if monthly cost > 20% of plan MRR."""
    revenue = PLAN_MONTHLY_REVENUE.get(plan, 99)
    if revenue == 0:
        return False, None
    monthly_dollars = total_units / 100_000
    threshold = revenue * 0.20
    if monthly_dollars > threshold:
        msg = (
            f"COST ALERT: Monthly API cost ${monthly_dollars:.2f} exceeds "
            f"20% of plan revenue (${threshold:.2f}) for plan '{plan}'"
        )
        return True, msg
    return False, None
