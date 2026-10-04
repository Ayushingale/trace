"""
Deterministic numeric verification check.
Handles currency (₹, Rs, INR, $, USD, EUR), scale multipliers (lakh, crore, million, billion, k),
percentages (%), ranges, and number words.
Never converts across different currencies — flags as needs_review.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

WORD_NUMBERS: Dict[str, float] = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    "hundred": 100, "thousand": 1000,
}

SCALE_MULTIPLIERS: Dict[str, float] = {
    "k": 1_000,
    "thousand": 1_000,
    "lakh": 100_000,
    "lac": 100_000,
    "lakhs": 100_000,
    "lacs": 100_000,
    "million": 1_000_000,
    "millions": 1_000_000,
    "crore": 10_000_000,
    "crores": 10_000_000,
    "cr": 10_000_000,
    "billion": 1_000_000_000,
    "billions": 1_000_000_000,
}

CURRENCY_MAP = {
    "₹": "INR",
    "rs": "INR",
    "rs.": "INR",
    "inr": "INR",
    "$": "USD",
    "usd": "USD",
    "€": "EUR",
    "eur": "EUR",
    "£": "GBP",
    "gbp": "GBP",
    "%": "PERCENT",
    "percent": "PERCENT",
    "percentage": "PERCENT",
}


def _extract_numeric_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extracts numbers, units, currencies, and normalized values from text.
    """
    results: List[Dict[str, Any]] = []
    
    # 1. Regex for Currency + digits + multiplier + unit
    pattern = re.compile(
        r"(?P<prefix_curr>₹|Rs\.?|INR|\$|USD|€|EUR|£|GBP)?\s*"
        r"(?P<val>\d+(?:,\d+)*(?:\.\d+)?)\s*"
        r"(?P<mult>crores?|cr|lakhs?|lacs?|millions?|billions?|k|thousand)?\s*"
        r"(?P<suffix_curr>%|percent|percentage|USD|INR|EUR|GBP)?",
        re.IGNORECASE,
    )

    for m in pattern.finditer(text):
        val_str = m.group("val")
        if not val_str:
            continue
        try:
            numeric_val = float(val_str.replace(",", ""))
        except ValueError:
            continue

        mult_str = (m.group("mult") or "").lower()
        if mult_str in SCALE_MULTIPLIERS:
            numeric_val *= SCALE_MULTIPLIERS[mult_str]

        curr = None
        prefix_curr = (m.group("prefix_curr") or "").lower().rstrip(".")
        suffix_curr = (m.group("suffix_curr") or "").lower()
        if prefix_curr in CURRENCY_MAP:
            curr = CURRENCY_MAP[prefix_curr]
        elif suffix_curr in CURRENCY_MAP:
            curr = CURRENCY_MAP[suffix_curr]

        results.append({
            "raw": m.group(0).strip(),
            "value": numeric_val,
            "currency": curr,
            "span": (m.start(), m.end()),
        })

    # 2. Extract word numbers if not already matched
    words = re.findall(r"\b[A-Za-z-]+\b", text.lower())
    for w in words:
        if w in WORD_NUMBERS and not any(r["raw"].lower() == w for r in results):
            results.append({
                "raw": w,
                "value": WORD_NUMBERS[w],
                "currency": None,
                "span": (0, 0),
            })

    return results


def check_numbers(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing numbers in claim vs passage.
    Returns: {status: 'match'|'mismatch'|'needs_review'|'not_applicable', rule_id: str, detail: str}
    """
    claim_nums = _extract_numeric_entities(claim_text)
    if not claim_nums:
        return {
            "status": "not_applicable",
            "rule_id": "num.none",
            "detail": "No numeric entities found in claim text.",
        }

    passage_nums = _extract_numeric_entities(passage_text)
    if not passage_nums:
        return {
            "status": "mismatch",
            "rule_id": "num.missing_in_passage",
            "detail": f"Claim contains numbers {[c['raw'] for c in claim_nums]}, but passage has none.",
        }

    # Verify each claim number
    for c in claim_nums:
        matched = False
        currency_mismatch = False

        for p in passage_nums:
            # Check if currencies conflict (e.g. INR vs USD)
            if c["currency"] and p["currency"] and c["currency"] != p["currency"]:
                currency_mismatch = True
                continue

            # Compare values with small floating tolerance
            if abs(c["value"] - p["value"]) < 1e-4:
                matched = True
                break

        if matched:
            continue
        elif currency_mismatch:
            return {
                "status": "needs_review",
                "rule_id": "num.currency_mismatch",
                "detail": f"Currency mismatch detected ({c.get('currency')} vs passage currency). Never auto-convert currencies.",
            }
        else:
            return {
                "status": "mismatch",
                "rule_id": "num.value_mismatch",
                "detail": f"Claim value {c['raw']} ({c['value']}) does not match passage numbers {[p['raw'] for p in passage_nums]}.",
            }

    return {
        "status": "match",
        "rule_id": "num.exact_match",
        "detail": "All numeric entities in claim match passage numbers and currency specifications.",
    }
