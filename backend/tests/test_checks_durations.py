"""
Unit tests for durations verification check.
Requires 8+ tests testing days vs business days (num.unit_mismatch),
'thirty (30)', within vs after, and value mismatches.
"""

from backend.verify.checks.durations import check_durations


def test_durations_business_days_unit_mismatch():
    claim = "Payment is due within 30 days of invoice receipt."
    passage = "Payment is due within 30 business days of invoice receipt."
    res = check_durations(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "num.unit_mismatch"
    assert "business days" in res["detail"]


def test_durations_working_days_unit_mismatch():
    claim = "Notice must be given within 10 days."
    passage = "Notice must be given within 10 working days."
    res = check_durations(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "num.unit_mismatch"


def test_durations_word_and_paren_number_match():
    claim = "The agreement term is thirty (30) days."
    passage = "This agreement remains active for 30 days."
    res = check_durations(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "dur.exact_match"


def test_durations_within_vs_after_direction_mismatch():
    claim = "Refund is issued within 14 days of return."
    passage = "Refund is issued after 14 days of return."
    res = check_durations(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "dur.temporal_direction_mismatch"


def test_durations_months_match():
    claim = "The initial term is fixed for 24 months."
    passage = "2.1 Initial Term: The agreement shall remain in effect for 24 months."
    res = check_durations(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "dur.exact_match"


def test_durations_value_mismatch():
    claim = "Termination notice is 60 days."
    passage = "Termination notice requires 90 days."
    res = check_durations(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "dur.value_mismatch"


def test_durations_missing_in_passage():
    claim = "The warranty period is 2 years."
    passage = "Goods shall be free from defects."
    res = check_durations(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "dur.missing_in_passage"


def test_durations_not_applicable():
    claim = "The software is provided as is."
    passage = "The software is provided without warranty."
    res = check_durations(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "dur.none"
