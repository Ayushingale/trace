"""
Unit tests for dates verification check.
Requires 8+ tests testing calendar dates, ISO, ordinals, and year mismatches.
"""

from backend.verify.checks.dates import check_dates


def test_dates_exact_text_match():
    claim = "The agreement was executed on January 15, 2024."
    passage = "Executed by the authorized representatives on January 15, 2024."
    res = check_dates(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "date.exact_match"


def test_dates_ordinal_match():
    claim = "The contract starts on the 1st of April 2023."
    passage = "Effective date: 1 April 2023."
    res = check_dates(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "date.exact_match"


def test_dates_iso_format_match():
    claim = "The report is due 2024-12-31."
    passage = "Deadline for submission is 2024-12-31."
    res = check_dates(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "date.exact_match"


def test_dates_year_mismatch():
    claim = "The policy takes effect in 2025."
    passage = "The policy takes effect in 2024."
    res = check_dates(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "date.value_mismatch"


def test_dates_day_mismatch():
    claim = "The event will occur on 15th August 2024."
    passage = "The event will occur on 16th August 2024."
    res = check_dates(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "date.value_mismatch"


def test_dates_month_mismatch():
    claim = "The audit concluded in October 2022."
    passage = "The audit concluded in November 2022."
    res = check_dates(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "date.value_mismatch"


def test_dates_missing_in_passage():
    claim = "The patent was granted on 2021-05-10."
    passage = "The company holds multiple intellectual property patents."
    res = check_dates(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "date.missing_in_passage"


def test_dates_not_applicable():
    claim = "Payment is due upon completion of services."
    passage = "Invoices will be submitted upon milestone completion."
    res = check_dates(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "date.none"
