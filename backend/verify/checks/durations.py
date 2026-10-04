"""
Deterministic duration verification check.
Handles time spans (days, business days, working days, calendar days, weeks, months, years),
dual forms like 'thirty (30)', and temporal prepositions ('within' vs 'after' vs 'before').
Specifically catches '30 days' vs '30 business days' with rule_id 'num.unit_mismatch'.
"""

import re
from typing import Any, Dict, List, Optional

WORD_NUMBERS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "fifteen": 15,
    "twenty": 20, "twenty-four": 24, "twenty four": 24, "thirty": 30,
    "forty": 40, "forty-five": 45, "fifty": 50, "sixty": 60, "ninety": 90,
    "one hundred": 100, "100": 100,
}

UNIT_TYPES = {
    "business day": "business_day",
    "business days": "business_day",
    "working day": "business_day",
    "working days": "business_day",
    "calendar day": "calendar_day",
    "calendar days": "calendar_day",
    "day": "day",
    "days": "day",
    "week": "week",
    "weeks": "week",
    "month": "month",
    "months": "month",
    "calendar month": "month",
    "calendar months": "month",
    "year": "year",
    "years": "year",
    "hour": "hour",
    "hours": "hour",
}


def _extract_durations(text: str) -> List[Dict[str, Any]]:
    results = []
    
    # Preposition detection within sentence
    prep = None
    if re.search(r"\bwithin\b", text, re.IGNORECASE):
        prep = "within"
    elif re.search(r"\bafter\b", text, re.IGNORECASE):
        prep = "after"
    elif re.search(r"\bbefore\b|prior to", text, re.IGNORECASE):
        prep = "before"

    # Pattern for "30 (thirty) business days" or "thirty (30) days" or "30 days"
    pattern = re.compile(
        r"(?:(?P<w1>[a-zA-Z-]+)\s*\(\s*(?P<d1>\d+)\s*\)|(?P<d2>\d+)\s*\(\s*(?P<w2>[a-zA-Z-]+)\s*\)|(?P<d3>\d+)|(?P<w3>[a-zA-Z-]+))\s*"
        r"(?P<unit>business\s+days?|working\s+days?|calendar\s+days?|calendar\s+months?|days?|weeks?|months?|years?|hours?)",
        re.IGNORECASE,
    )

    for m in pattern.finditer(text):
        val = None
        if m.group("d1"):
            val = float(m.group("d1"))
        elif m.group("d2"):
            val = float(m.group("d2"))
        elif m.group("d3"):
            val = float(m.group("d3"))
        elif m.group("w3"):
            w = m.group("w3").lower()
            if w in WORD_NUMBERS:
                val = float(WORD_NUMBERS[w])

        if val is None:
            continue

        raw_unit = re.sub(r"\s+", " ", m.group("unit").lower())
        norm_unit = UNIT_TYPES.get(raw_unit, "day")

        results.append({
            "raw": m.group(0),
            "value": val,
            "unit": norm_unit,
            "raw_unit": raw_unit,
            "preposition": prep,
        })

    return results


def check_durations(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing durations in claim vs passage.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_durations = _extract_durations(claim_text)
    if not claim_durations:
        return {
            "status": "not_applicable",
            "rule_id": "dur.none",
            "detail": "No duration entities found in claim.",
        }

    passage_durations = _extract_durations(passage_text)
    if not passage_durations:
        return {
            "status": "mismatch",
            "rule_id": "dur.missing_in_passage",
            "detail": f"Claim specifies duration {[d['raw'] for d in claim_durations]}, not found in passage.",
        }

    for cd in claim_durations:
        for pd in passage_durations:
            # Check for "30 days" vs "30 business days" unit mismatch
            if abs(cd["value"] - pd["value"]) < 1e-4:
                if cd["unit"] != pd["unit"]:
                    return {
                        "status": "mismatch",
                        "rule_id": "num.unit_mismatch",
                        "detail": f"Source says {pd['raw_unit']}, not {cd['raw_unit']}.",
                    }

                # Check preposition mismatch ("within" vs "after")
                if cd["preposition"] and pd["preposition"] and cd["preposition"] != pd["preposition"]:
                    return {
                        "status": "mismatch",
                        "rule_id": "dur.temporal_direction_mismatch",
                        "detail": f"Temporal direction mismatch: claim specifies '{cd['preposition']}' but source specifies '{pd['preposition']}'.",
                    }

                return {
                    "status": "match",
                    "rule_id": "dur.exact_match",
                    "detail": f"Duration matches exactly: {cd['raw']}.",
                }

        # Value mismatch
        return {
            "status": "mismatch",
            "rule_id": "dur.value_mismatch",
            "detail": f"Claim duration {cd['raw']} does not match passage durations {[p['raw'] for p in passage_durations]}.",
        }

    return {
        "status": "not_applicable",
        "rule_id": "dur.none",
        "detail": "No comparable durations.",
    }
