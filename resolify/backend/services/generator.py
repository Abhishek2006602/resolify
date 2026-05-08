import logging
import anthropic
from config import ANTHROPIC_API_KEY
from models.schemas import EnrichedContext, GeneratedResponse
from services.costs import calc_cost_units

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

_HAIKU  = "claude-haiku-4-5-20251001"
_SONNET = "claude-sonnet-4-6"


def _build_system_prompt(context: EnrichedContext, language: str = "en") -> str:
    actions = ", ".join(context.last_3_actions)
    lang_note = (
        f"\nIMPORTANT: Respond in {language} to match the customer's language."
        if language != "en" else ""
    )
    return (
        f"You are a warm, professional customer support agent for a SaaS platform.\n\n"
        f"Customer context:\n"
        f"- Company: {context.company_name}\n"
        f"- Plan: {context.plan} | MRR: ${context.mrr}/mo\n"
        f"- Customer for: {context.days_as_customer} days\n"
        f"- Payment status: {context.payment_status}\n"
        f"- Account health: {context.account_health}\n"
        f"- Recent activity: {actions}\n\n"
        f"Write a helpful, empathetic reply under 150 words. Be warm and direct. "
        f"Do not mention internal metrics or account health scores. "
        f"Sign off as \"The {context.company_name} Support Team\"."
        f"{lang_note}"
    )


async def generate_response(
    message: str,
    context: EnrichedContext,
    intent: str,
    tone: str = "neutral",
    language: str = "en",
) -> GeneratedResponse:
    # Fix 8 — use Haiku for simple FAQ tickets, Sonnet for everything else
    use_haiku = (
        intent == "howto"
        and tone in ("neutral", "polite")
    )
    model = _HAIKU if use_haiku else _SONNET
    label = "Haiku — simple FAQ" if use_haiku else "Sonnet — complex ticket"
    print(f"  [generator] GENERATING with {label}")
    logger.info(f"Generator model selected: {model}")

    system = _build_system_prompt(context, language)

    try:
        response = _client.messages.create(
            model=model,
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": message}],
        )
    except anthropic.APIError:
        raise

    response_text = response.content[0].text.strip()
    input_tok  = response.usage.input_tokens
    output_tok = response.usage.output_tokens
    cost       = calc_cost_units(input_tok, output_tok, model)
    model_name = "haiku" if use_haiku else "sonnet"

    logger.info(f"Generator tokens | in={input_tok} out={output_tok} cost_units={cost} model={model_name}")
    print(f"  [generator] tokens: {input_tok} in / {output_tok} out | cost: {cost} units | model: {model_name}")

    return GeneratedResponse(
        response_text=response_text,
        confidence=0.9,
        tokens_used=input_tok + output_tok,
        cost_units=cost,
        model_used=model_name,
    )
