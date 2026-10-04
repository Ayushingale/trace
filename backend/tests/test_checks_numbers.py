"""
Unit tests for deterministic numbers verification check.
Requires 8+ unit tests covering currencies, multipliers, scales, words, and currency mismatch.
"""

from backend.verify.checks.numbers import check_numbers


def test_numbers_exact_dollar_match():
    claim = "The total license fee is $50,000."
    passage = "Customer agrees to pay a license fee of $50,000 upon signing."
    res = check_numbers(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "num.exact_match"


def test_numbers_currency_mismatch_never_converts():
    claim = "The penalty fee is $50,000."
    passage = "The penalty fee is ₹50,000 under clause 4."
    res = check_numbers(claim, passage)
    assert res["status"] == "needs_review"
    assert res["rule_id"] == "num.currency_mismatch"


def test_numbers_lakh_multiplier():
    claim = "The advance amount is 50 lakh rupees."
    passage = "Advance payment payable is 5,000,000 INR."
    res = check_numbers(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "num.exact_match"


def test_numbers_crore_multiplier():
    claim = "The contract valuation is 2 crore INR."
    passage = "Project budget is set at Rs 20,000,000."
    res = check_numbers(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "num.exact_match"


def test_numbers_million_multiplier():
    claim = "Liability cap is 1.5 million USD."
    passage = "Aggregate liability shall not exceed $1,500,000."
    res = check_numbers(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "num.exact_match"


def test_numbers_percentage_match():
    claim = "The royalty rate is 8.5%."
    passage = "Licensee agrees to pay an 8.5 percent royalty fee."
    res = check_numbers(claim, passage)
    assert res["status"] == "match"


def test_numbers_value_mismatch():
    claim = "The license fee is $75,000."
    passage = "The license fee is $50,000."
    res = check_numbers(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "num.value_mismatch"


def test_numbers_missing_in_passage():
    claim = "The fine is $2,000."
    passage = "Fines may apply for repeated breaches."
    res = check_numbers(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "num.missing_in_passage"


def test_numbers_not_applicable():
    claim = "The contract can be terminated by mutual consent."
    passage = "Either party may terminate upon mutual written agreement."
    res = check_numbers(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "num.none"
