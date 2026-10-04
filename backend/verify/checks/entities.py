"""
Deterministic entity verification check.
Compares party names, organization names, and defined terms.
Tolerates variations in case, punctuation, and legal corporate suffixes (Ltd, Pvt, Inc, LLC, Corp).
"""

import re
from typing import Any, Dict, List, Optional
from rapidfuzz import fuzz

COMPANY_SUFFIXES = [
    r"\bpvt\.?\s*ltd\.?\b",
    r"\bprivate\s+limited\b",
    r"\bltd\.?\b",
    r"\blimited\b",
    r"\binc\.?\b",
    r"\bincorporated\b",
    r"\bllc\b",
    r"\bcorp\.?\b",
    r"\bcorporation\b",
    r"\bco\.?\b",
    r"\bcompany\b",
]


def _normalize_entity(name: str) -> str:
    cleaned = name.lower()
    for suff in COMPANY_SUFFIXES:
        cleaned = re.sub(suff, "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    return " ".join(cleaned.split())


def _extract_candidate_entities(text: str) -> List[str]:
    """
    Extracts capitalized multi-word phrases and quoted defined terms as entity candidates.
    """
    candidates = []
    # 1. Quoted terms: "Vendor", "Supplier", "Acme Corp"
    quoted = re.findall(r'["“\']([A-Z][A-Za-z0-9\s.,&-]+)["”\']', text)
    candidates.extend(quoted)

    # 2. Capitalized noun sequences: e.g. Acme Innovations Pvt Ltd, Ernst & Young
    cap_phrases = re.findall(r"\b[A-Z][a-zA-Z0-9]+(?:\s+(?:&|[A-Z][a-zA-Z0-9]+))+\b", text)
    candidates.extend(cap_phrases)

    return list(set(candidates))


def check_entities(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing named entities in claim vs passage.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_ents = _extract_candidate_entities(claim_text)
    if not claim_ents:
        return {
            "status": "not_applicable",
            "rule_id": "ent.none",
            "detail": "No proper entities or defined terms identified in claim.",
        }

    passage_norm = _normalize_entity(passage_text)

    for ce in claim_ents:
        norm_ce = _normalize_entity(ce)
        if not norm_ce:
            continue

        # Check exact or fuzzy presence in normalized passage
        if norm_ce in passage_norm:
            continue

        # Fuzzy check against word n-grams
        score = fuzz.partial_ratio(norm_ce, passage_norm)
        if score >= 85:
            continue

        return {
            "status": "mismatch",
            "rule_id": "ent.name_mismatch",
            "detail": f"Entity '{ce}' not verified in passage evidence (best match score: {score}%).",
        }

    return {
        "status": "match",
        "rule_id": "ent.exact_match",
        "detail": f"All candidate entities {[e for e in claim_ents]} successfully matched.",
    }
