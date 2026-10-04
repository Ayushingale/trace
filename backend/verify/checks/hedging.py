"""
Deterministic hedging verification check.
Detects epistemic hedging vs definitive claims:
- Hedged/Tentative: suggests, may indicate, indicates, likely, possibly, appears to, preliminary
- Definitive/Absolute: proves, shows, demonstrates, confirms, establishes, guarantees, indisputable
Flags unwarranted certainty escalation where claim claims 'proves' but source says 'suggests'.
"""

import re
from typing import Any, Dict, List, Optional

HEDGED_PATTERNS = [
    r"\bsuggests?\b",
    r"\bmay\s+indicate\b",
    r"\bindicates?\b",
    r"\blikely\b",
    r"\bpossibly\b",
    r"\bpotential\b",
    r"\bappears\s+to\b",
    r"\bpreliminary\b",
    r"\bhypothesized\b",
]

DEFINITIVE_PATTERNS = [
    r"\bproves?\b",
    r"\bshows?\b",
    r"\bdemonstrates?\b",
    r"\bconfirms?\b",
    r"\bestablishes?\b",
    r"\bguarantees?\b",
    r"\bindisputabl[ey]\b",
    r"\bconclusive\b",
]


def _detect_epistemic_strength(text: str) -> Optional[str]:
    text_lower = text.lower()
    for pat in DEFINITIVE_PATTERNS:
        if re.search(pat, text_lower):
            return "definitive"
    for pat in HEDGED_PATTERNS:
        if re.search(pat, text_lower):
            return "hedged"
    return None


def check_hedging(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing epistemic hedging/certainty between claim and passage.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_level = _detect_epistemic_strength(claim_text)
    if not claim_level:
        return {
            "status": "not_applicable",
            "rule_id": "hedge.none",
            "detail": "No explicit epistemic hedging or definitive assertion markers found in claim.",
        }

    passage_level = _detect_epistemic_strength(passage_text)
    if not passage_level:
        return {
            "status": "not_applicable",
            "rule_id": "hedge.passage_neutral",
            "detail": f"Claim expresses {claim_level} certainty, but passage is epistemic-neutral.",
        }

    # Escalation: claim is definitive but source is only hedged
    if claim_level == "definitive" and passage_level == "hedged":
        return {
            "status": "mismatch",
            "rule_id": "hedge.unwarranted_certainty",
            "detail": "Unwarranted certainty escalation: claim asserts definitive proof ('proves/demonstrates') while passage only 'suggests/indicates'.",
        }

    if claim_level == passage_level:
        return {
            "status": "match",
            "rule_id": "hedge.consistent",
            "detail": f"Epistemic certainty is aligned ({claim_level}).",
        }

    return {
        "status": "match",
        "rule_id": "hedge.acceptable",
        "detail": f"Epistemic strength compatible (claim: {claim_level}, passage: {passage_level}).",
    }
