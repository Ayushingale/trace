"""
Unit tests for hedging verification check.
Requires 8+ tests testing epistemic hedging vs definitive statements.
"""

from backend.verify.checks.hedging import check_hedging


def test_hedging_unwarranted_certainty_proves_vs_suggests():
    claim = "The clinical trial proves the efficacy of the drug."
    passage = "Preliminary clinical trial data suggests the efficacy of the compound."
    res = check_hedging(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "hedge.unwarranted_certainty"


def test_hedging_unwarranted_certainty_demonstrates_vs_may_indicate():
    claim = "The survey demonstrates overwhelming customer dissatisfaction."
    passage = "Recent survey responses may indicate customer dissatisfaction."
    res = check_hedging(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "hedge.unwarranted_certainty"


def test_hedging_unwarranted_certainty_guarantees_vs_appears_to():
    claim = "The algorithm guarantees 99.9% uptime."
    passage = "The system appears to maintain 99.9% uptime during non-peak hours."
    res = check_hedging(claim, passage)
    assert res["status"] == "mismatch"
    assert res["rule_id"] == "hedge.unwarranted_certainty"


def test_hedging_both_hedged_consistent():
    claim = "The analysis suggests a potential revenue decrease."
    passage = "Market data indicates a likely drop in quarterly revenue."
    res = check_hedging(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "hedge.consistent"


def test_hedging_both_definitive_consistent():
    claim = "The experimental benchmark confirms superior throughput."
    passage = "Benchmark results show significantly higher throughput."
    res = check_hedging(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "hedge.consistent"


def test_hedging_claim_hedged_passage_definitive_acceptable():
    claim = "The evidence suggests the system is secure."
    passage = "Third party penetration tests conclusively prove the system is secure."
    res = check_hedging(claim, passage)
    assert res["status"] == "match"
    assert res["rule_id"] == "hedge.acceptable"


def test_hedging_passage_neutral():
    claim = "The findings indicate a strong correlation."
    passage = "The dataset contains 10,000 paired observations."
    res = check_hedging(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "hedge.passage_neutral"


def test_hedging_not_applicable():
    claim = "The meeting starts at 10 AM."
    passage = "The meeting is scheduled for 10:00 AM in Conference Room B."
    res = check_hedging(claim, passage)
    assert res["status"] == "not_applicable"
    assert res["rule_id"] == "hedge.none"
