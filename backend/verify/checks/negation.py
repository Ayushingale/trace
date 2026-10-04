"""
Deterministic negation verification check.
Detects negation markers (not, no, never, neither, nor, none, without, except, unless, excludes).
Flags polarity flips between claim and source passage.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

NEGATION_PATTERNS = [
    r"\bnot\b",
    r"\bno\b(?!\s+(?:longer|matter)\b)",
    r"\bnever\b",
    r"\bneither\b",
    r"\bnor\b",
    r"\bnone\b",
    r"\bwithout\b",
    r"\bunless\b",
    r"\bexcept\b",
    r"\bexcluding\b",
    r"\bexcludes\b",
    r"\bnon-existent\b",
    r"\bincapable\b",
]


def _has_negation(text: str) -> Tuple[bool, List[str]]:
    text_lower = text.lower()
    found = []
    for pat in NEGATION_PATTERNS:
        matches = re.findall(pat, text_lower)
        if matches:
            found.extend(matches)
    return (len(found) > 0, found)


def check_negation(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check verifying negation consistency.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_neg, claim_markers = _has_negation(claim_text)
    passage_neg, passage_markers = _has_negation(passage_text)

    # If neither has negation, not applicable
    if not claim_neg and not passage_neg:
        return {
            "status": "not_applicable",
            "rule_id": "neg.none",
            "detail": "Neither claim nor passage contains explicit negation markers.",
        }

    # Polarity flip: one contains negation while the other does not
    if claim_neg != passage_neg:
        if claim_neg and not passage_neg:
            return {
                "status": "mismatch",
                "rule_id": "neg.polarity_flip",
                "detail": f"Polarity flip: claim asserts negative ({claim_markers}) while passage is affirmative.",
            }
        else:
            return {
                "status": "mismatch",
                "rule_id": "neg.polarity_flip",
                "detail": f"Polarity flip: claim is affirmative while passage contains negation ({passage_markers}).",
            }

    return {
        "status": "match",
        "rule_id": "neg.consistent",
        "detail": f"Both claim and passage share negative polarity structure ({claim_markers} vs {passage_markers}).",
    }
