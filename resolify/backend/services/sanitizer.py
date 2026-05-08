import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

_PATTERNS: list[tuple[str, int]] = [
    (r"ignore\s+(previous|all)\s+instructions?",  re.IGNORECASE),
    (r"forget\s+everything",                       re.IGNORECASE),
    (r"you\s+are\s+now\b",                         re.IGNORECASE),
    (r"new\s+personality",                          re.IGNORECASE),
    (r"system\s+prompt",                            re.IGNORECASE),
    (r"reveal\s+your\s+instructions?",             re.IGNORECASE),
    (r"^#{3,}.*$",                                  re.IGNORECASE | re.MULTILINE),
    (r"^-{3,}.*$",                                  re.IGNORECASE | re.MULTILINE),
]


@dataclass
class SanitizationResult:
    text: str
    injection_detected: bool = False
    patterns_matched: list[str] = field(default_factory=list)


def sanitize_input(text: str, ticket_id: str = "unknown") -> SanitizationResult:
    cleaned = text
    detected = False
    matched: list[str] = []

    for pattern, flags in _PATTERNS:
        if re.search(pattern, cleaned, flags):
            detected = True
            matched.append(pattern)
            cleaned = re.sub(pattern, "[REDACTED]", cleaned, flags=flags)

    if detected:
        logger.warning(f"Prompt injection attempt detected in ticket {ticket_id}")
        print(f"  [sanitizer] INJECTION DETECTED in ticket {ticket_id} | patterns={len(matched)}")

    return SanitizationResult(text=cleaned, injection_detected=detected, patterns_matched=matched)
