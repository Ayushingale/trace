"""
Unit tests for entities verification check.
Requires 8+ tests testing party names, corporate suffixes (Ltd/Pvt/Inc), punctuation, and mismatches.
"""

from backend.verify.checks.entities import check_entities


def test_entities_exact_match():
    claim = "The agreement is executed with Acme Corporation."
    passage = "Entered into by and between Acme Corporation and the Client."
    res = check_entities(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "ent.exact_match"


def test_entities_pvt_ltd_tolerance():
    claim = "Bharat Logistics Private Limited is the designated supplier."
    passage = "Services shall be rendered by Bharat Logistics Pvt Ltd."
    res = check_entities(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "ent.exact_match"


def test_entities_inc_and_punctuation_tolerance():
    claim = "Apex Global, Inc. holds the software license."
    passage = "The license is held by Apex Global Inc under Schedule B."
    res = check_entities(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "ent.exact_match"


def test_entities_case_insensitivity():
    claim = "The audit was conducted by Ernst & Young."
    passage = "Independent auditor report by ernst & young confirmed compliance."
    res = check_entities(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "ent.exact_match"


def test_entities_llc_tolerance():
    claim = "Delta Technologies LLC agreed to the terms."
    passage = "Signed on behalf of Delta Technologies."
    res = check_entities(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "ent.exact_match"


def test_entities_name_mismatch():
    claim = "The contract was signed with Cyberdyne Systems Ltd."
    passage = "The contract was executed by Initech Corporation."
    res = check_entities(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "ent.name_mismatch"


def test_entities_partial_confusion():
    claim = "Acme Technologies delivered the servers."
    passage = "Zenith Technologies handled the hardware installation."
    res = check_entities(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "ent.name_mismatch"


def test_entities_not_applicable():
    claim = "The monthly report is due on Friday."
    passage = "Status reports shall be submitted weekly."
    res = check_entities(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "ent.none"
