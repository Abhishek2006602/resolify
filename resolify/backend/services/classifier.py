import json
import logging
import anthropic
from config import ANTHROPIC_API_KEY
from models.schemas import ClassificationResult
from services.costs import calc_cost_units

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

_MODEL = "claude-haiku-4-5-20251001"

_BASE_PROMPT = """You are a customer support ticket classifier. Analyze the ticket and return ONLY valid JSON with these exact fields:

{
  "intent": "<one of: billing, technical, account, refund, cancellation, howto, general>",
  "confidence": <float 0.0-1.0>,
  "tone": "<one of: neutral, frustrated, angry, polite, urgent>",
  "escalate_immediately": <true or false>,
  "escalate_reason": "<brief reason if escalate_immediately is true, else null>"
}

Escalate immediately if the message contains: refund demand, cancellation threat, legal threat, fraud accusation, data loss, charged twice, wrong charge, or is extremely angry/threatening.

Return ONLY the JSON object. No explanation, no markdown."""


async def classify_ticket(
    message: str,
    language: str = "en",
) -> ClassificationResult:
    system = _BASE_PROMPT
    if language != "en":
        system += f"\nNote: This ticket is written in {language}. Classify accordingly."

    try:
        response = _client.messages.create(
            model=_MODEL,
            max_tokens=256,
            system=system,
            messages=[{"role": "user", "content": message}],
        )
    except anthropic.APIError as exc:
        raise  # let webhook handle queuing

    raw = response.content[0].text.strip()
    input_tok  = response.usage.input_tokens
    output_tok = response.usage.output_tokens
    cost       = calc_cost_units(input_tok, output_tok, _MODEL)

    logger.info(f"Classifier tokens | in={input_tok} out={output_tok} cost_units={cost}")
    print(f"  [classifier] tokens: {input_tok} in / {output_tok} out | cost: {cost} units")
    print(f"  [classifier] raw: {raw!r}")

    cleaned = raw
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(cleaned)
        result = ClassificationResult(
            intent=data.get("intent", "general"),
            confidence=float(data.get("confidence", 0.5)),
            tone=data.get("tone", "neutral"),
            escalate_immediately=bool(data.get("escalate_immediately", False)),
            escalate_reason=data.get("escalate_reason"),
            tokens_used=input_tok + output_tok,
            cost_units=cost,
        )
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning(f"Classifier JSON parse failed: {exc} | raw={raw!r}")
        result = ClassificationResult(
            intent="general",
            confidence=0.5,
            tone="neutral",
            escalate_immediately=False,
            escalate_reason=None,
            tokens_used=input_tok + output_tok,
            cost_units=cost,
        )

    print(f"  [classifier] intent={result.intent} conf={result.confidence:.2f} "
          f"tone={result.tone} escalate={result.escalate_immediately}")
    return result
