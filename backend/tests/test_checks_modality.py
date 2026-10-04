"""
Unit tests for modality verification check.
Requires 8+ tests testing obligation, permission, prohibition, and modality flips.
"""

from backend.verify.checks.modality import check_modality


def test_modality_shall_obligation_match():
    claim = "The contractor shall deliver the source code."
    passage = "The contractor must deliver all source code upon request."
    res = check_modality(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "mod.consistent"


def test_modality_may_permission_match():
    claim = "Either party may terminate for convenience."
    passage = "Either party can terminate this agreement without cause."
    res = check_modality(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "mod.consistent"


def test_modality_prohibition_match():
    claim = "Employees shall not disclose confidential data."
    passage = "Staff members must not disclose any non-public information."
    res = check_modality(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "mod.consistent"


def test_modality_obligation_permission_flip():
    claim = "The licensee may audit records."
    passage = "The licensee shall audit records on an annual basis."
    res = check_modality(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "mod.obligation_permission_flip"


def test_modality_prohibition_flip_positive_to_negative():
    claim = "The vendor can assign this agreement."
    passage = "The vendor shall not assign this agreement without prior consent."
    res = check_modality(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "mod.prohibition_flip"


def test_modality_prohibition_flip_negative_to_positive():
    claim = "The company cannot subcontract work."
    passage = "The company may subcontract work with written notice."
    res = check_modality(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "mod.prohibition_flip"


def test_modality_passage_neutral():
    claim = "The vendor shall provide 24/7 technical support."
    passage = "Technical support operates around the clock."
    res = check_modality(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "mod.passage_neutral"


def test_modality_not_applicable():
    claim = "The system runs on Linux servers."
    passage = "The platform is hosted on Debian Linux instances."
    res = check_modality(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "mod.none"
