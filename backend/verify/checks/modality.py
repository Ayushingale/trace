"""
Deterministic modality verification check.
Categories:
- Obligation: shall, must, will, is required to, obligated to
- Permission: may, can, is entitled to, permitted to
- Prohibition: shall not, must not, may not, cannot, will not, is prohibited
Flags modal category flips between claim and source evidence.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

OBLIGATION_PATTERNS = [
    r"\bshall\b(?!\s+not\b)",
    r"\bmust\b(?!\s+not\b)",
    r"\bwill\b(?!\s+not\b)",
    r"\bis required to\b",
    r"\bobligated to\b",
]

PERMISSION_PATTERNS = [
    r"\bmay\b(?!\s+not\b)",
    r"\bcan\b(?!\s+not\b)",
    r"\bentitled to\b",
    r"\bpermitted to\b",
    r"\boption to\b",
]

PROHIBITION_PATTERNS = [
    r"\bshall not\b",
    r"\bmust not\b",
    r"\bmay not\b",
    r"\bcannot\b",
    r"\bcan not\b",
    r"\bwill not\b",
    r"\bprohibited\b",
    r"\bforbidden\b",
]


def _detect_modality(text: str) -> Optional[str]:
    """
    Detects the dominant modality category in a given text snippet.
    Returns: 'prohibition' | 'obligation' | 'permission' | None
    """
    text_lower = text.lower()
    for pat in PROHIBITION_PATTERNS:
        if re.search(pat, text_lower):
            return "prohibition"
    for pat in OBLIGATION_PATTERNS:
        if re.search(pat, text_lower):
            return "obligation"
    for pat in PERMISSION_PATTERNS:
        if re.search(pat, text_lower):
            return "permission"
    return None


def check_modality(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing modality between claim and passage.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_mod = _detect_modality(claim_text)
    if not claim_mod:
        return {
            "status": "not_applicable",
            "rule_id": "mod.none",
            "detail": "No dominant deontic modality detected in claim.",
        }

    passage_mod = _detect_modality(passage_text)
    if not passage_mod:
        return {
            "status": "not_applicable",
            "rule_id": "mod.passage_neutral",
            "detail": f"Claim has {claim_mod} modality, but passage does not express explicit modality.",
        }

    if claim_mod == passage_mod:
        return {
            "status": "match",
            "rule_id": "mod.consistent",
            "detail": f"Modality is consistent ({claim_mod}).",
        }

    # Flips detection
    if "prohibition" in (claim_mod, passage_mod):
        return {
            "status": "mismatch",
            "rule_id": "mod.prohibition_flip",
            "detail": f"Severe modality conflict: claim is {claim_mod} but source is {passage_mod}.",
        }

    return {
        "status": "mismatch",
        "rule_id": "mod.obligation_permission_flip",
        "detail": f"Modality shift: claim asserts {claim_mod} while source stipulates {passage_mod}.",
    }
