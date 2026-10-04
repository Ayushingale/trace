"""
Deterministic date verification check.
Handles calendar dates, month names, ISO dates, ordinals (1st, 2nd, 31st), and years.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

MONTHS = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def _extract_dates(text: str) -> List[Dict[str, Any]]:
    results = []

    # 1. ISO style: YYYY-MM-DD
    for m in re.finditer(r"\b(?P<y>\d{4})-(?P<m>\d{1,2})-(?P<d>\d{1,2})\b", text):
        results.append({
            "raw": m.group(0),
            "year": int(m.group("y")),
            "month": int(m.group("m")),
            "day": int(m.group("d")),
        })

    # 2. Textual dates: "15th January 2024", "January 15, 2024", "15 Jan 2024", "October 2022"
    text_date_pattern = re.compile(
        r"(?:(?P<d1>\d{1,2})(?:st|nd|rd|th)?\s+(?P<m1>[A-Za-z]+)\s+(?P<y1>\d{4}))|"
        r"(?:(?P<m2>[A-Za-z]+)\s+(?P<d2>\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(?P<y2>\d{4}))|"
        r"(?:(?P<m3>[A-Za-z]+)\s+(?P<y3>\d{4}))",
        re.IGNORECASE,
    )
    for m in text_date_pattern.finditer(text):
        m_str = (m.group("m1") or m.group("m2") or m.group("m3")).lower()
        if m_str in MONTHS:
            month_num = MONTHS[m_str]
            day_num = int(m.group("d1") or m.group("d2")) if (m.group("d1") or m.group("d2")) else None
            year_num = int(m.group("y1") or m.group("y2") or m.group("y3"))
            results.append({
                "raw": m.group(0),
                "year": year_num,
                "month": month_num,
                "day": day_num,
            })

    # 3. Solo years: e.g. "in 2025"
    if not results:
        for m in re.finditer(r"\b(19\d{2}|20\d{2})\b", text):
            results.append({
                "raw": m.group(0),
                "year": int(m.group(0)),
                "month": None,
                "day": None,
            })

    return results


def check_dates(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Pure check comparing dates in claim vs passage.
    Returns: {status: 'match'|'mismatch'|'not_applicable', rule_id: str, detail: str}
    """
    claim_dates = _extract_dates(claim_text)
    if not claim_dates:
        return {
            "status": "not_applicable",
            "rule_id": "date.none",
            "detail": "No calendar dates found in claim.",
        }

    passage_dates = _extract_dates(passage_text)
    if not passage_dates:
        return {
            "status": "mismatch",
            "rule_id": "date.missing_in_passage",
            "detail": f"Claim specifies dates {[d['raw'] for d in claim_dates]}, not found in passage.",
        }

    for cd in claim_dates:
        matched = False
        for pd in passage_dates:
            # Check year match
            if cd["year"] != pd["year"]:
                continue
            # If month/day specified in both, check exact match
            if cd["month"] is not None and pd["month"] is not None:
                if cd["month"] != pd["month"]:
                    continue
                if cd["day"] is not None and pd["day"] is not None:
                    if cd["day"] != pd["day"]:
                        continue
            matched = True
            break

        if matched:
            return {
                "status": "match",
                "rule_id": "date.exact_match",
                "detail": f"Date {cd['raw']} verified against passage dates.",
            }
        else:
            return {
                "status": "mismatch",
                "rule_id": "date.value_mismatch",
                "detail": f"Claim date {cd['raw']} contradicts passage dates {[p['raw'] for p in passage_dates]}.",
            }

    return {
        "status": "not_applicable",
        "rule_id": "date.none",
        "detail": "No comparable dates.",
    }
