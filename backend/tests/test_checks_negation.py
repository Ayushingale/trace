"""
Unit tests for negation verification check.
Requires 8+ tests testing not, no, unless, except, and polarity flips.
"""

from backend.verify.checks.negation import check_negation


def test_negation_not_polarity_flip_claim_affirmative():
    claim = "The supplier is liable for indirect damages."
    passage = "The supplier is not liable for indirect damages under any circumstance."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_not_polarity_flip_claim_negative():
    claim = "Neither party warrants uninterrupted software operation."
    passage = "The vendor warrants uninterrupted software operation."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_both_negative_consistent():
    claim = "No refund is provided for cancelled subscriptions."
    passage = "There is no refund policy for early terminations."
    res = check_negation(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "neg.consistent"


def test_negation_unless_scope_flip():
    claim = "Subcontracting is permitted."
    passage = "Subcontracting is forbidden unless approved in writing."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_except_scope_flip():
    claim = "All intellectual property is transferred to client."
    passage = "All intellectual property is transferred, except pre-existing background code."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_without_marker():
    claim = "The agreement may be assigned."
    passage = "No assignment can occur without express written consent."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_excludes_marker():
    claim = "The warranty covers accidental physical damage."
    passage = "The warranty excludes accidental physical damage."
    res = check_negation(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "neg.polarity_flip"


def test_negation_not_applicable():
    claim = "Payment will be processed by electronic transfer."
    passage = "Payment will be sent via wire transfer."
    res = check_negation(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "neg.none"
