import logging
import anthropic
from config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def detect_language(text: str) -> str:
    """Returns ISO 639-1 language code. Defaults to 'en' on any failure."""
    try:
        response = _client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8,
            messages=[{
                "role": "user",
                "content": (
                    "Detect the language of this text. "
                    "Return ONLY the ISO 639-1 language code (en, fr, de, es, pt, ja, zh, etc). "
                    f"Text: {text[:300]}"
                ),
            }],
        )
        code = response.content[0].text.strip().lower()
        if len(code) == 2 and code.isalpha():
            logger.info(f"Language detected: {code}")
            return code
        logger.warning(f"Unexpected language code: {code!r} — defaulting to en")
        return "en"
    except Exception as exc:
        logger.warning(f"Language detection failed: {exc} — defaulting to en")
        return "en"
