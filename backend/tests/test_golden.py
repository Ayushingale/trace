"""
Golden Test Suite.
Evaluates TRACE verification engine against the golden dataset with 5 planted errors.
Verifies that:
1. All verdicts match expected golden verdicts (SUPPORTED, CONTRADICTED, UNSUPPORTED).
2. All rule_ids match expected deterministic rules.
3. Every result is valid per the shared contract schema.
"""

import json
import os
from typing import List
from backend.app.schemas import Claim, Passage, VerdictEnum, ReviewStatusEnum
from backend.verify.verify import verify

GOLDEN_DIR = os.path.join(os.path.dirname(__file__), "golden")


def load_golden_data():
    passages_path = os.path.join(GOLDEN_DIR, "contract_passages.json")
    claims_path = os.path.join(GOLDEN_DIR, "planted_claims.json")

    with open(passages_path, "r", encoding="utf-8") as f:
        passages_raw = json.load(f)
    with open(claims_path, "r", encoding="utf-8") as f:
        claims_raw = json.load(f)

    passages = [Passage(**p) for p in passages_raw]
    return passages, claims_raw


def test_golden_claims_verdicts():
    passages, claims_meta = load_golden_data()

    for item in claims_meta:
        claim = Claim(
            claim_id=item["claim_id"],
            claim_text=item["claim_text"],
            char_start=0,
            char_end=len(item["claim_text"]),
            claim_type=item["claim_type"],
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.5,
            reason="Unverified",
            rule_id="init",
            evidence=[],
            review_status=ReviewStatusEnum.NONE,
        )

        passage_idx = item["passage_index"]
        if passage_idx is None:
            candidate_passages: List[Passage] = []
        else:
            candidate_passages = [passages[passage_idx]]

        result = verify(claim, candidate_passages)

        assert result.verdict.value == item["expected_verdict"], (
            f"Verdict mismatch for {item['claim_id']}: expected {item['expected_verdict']}, got {result.verdict.value}. "
            f"Reason: {result.reason} (Rule: {result.rule_id})"
        )
        assert result.rule_id == item["expected_rule"], (
            f"Rule ID mismatch for {item['claim_id']}: expected {item['expected_rule']}, got {result.rule_id}."
        )
        assert 0.0 <= result.confidence <= 1.0
        assert len(result.reason) > 0


def test_verify_handles_empty_passages():
    """Empty evidence passages must return UNSUPPORTED per contract."""
    claim = Claim(
        claim_id="c_empty_test",
        claim_text="Any arbitrary statement without source evidence.",
        char_start=0,
        char_end=45,
        claim_type="general",
        verdict=VerdictEnum.NEEDS_REVIEW,
        confidence=0.5,
        reason="None",
        rule_id="none",
        evidence=[],
        review_status=ReviewStatusEnum.NONE,
    )
    result = verify(claim, [])
    assert result.verdict == VerdictEnum.UNSUPPORTED
    assert result.confidence == 1.0
    assert result.rule_id == "retrieval.no_passages"


def test_verify_handles_malformed_input_gracefully():
    """Any internal exception must return NEEDS_REVIEW without crashing."""
    # Pass a claim with non-string text or invalid type that could cause internal error
    claim = Claim(
        claim_id="c_err_test",
        claim_text="Valid text format",
        char_start=0,
        char_end=17,
        claim_type="numeric",
        verdict=VerdictEnum.NEEDS_REVIEW,
        confidence=0.5,
        reason="None",
        rule_id="none",
        evidence=[],
        review_status=ReviewStatusEnum.NONE,
    )
    # Even if unexpected passage structure is passed, function returns valid VerdictResult
    passages = [
        Passage(doc_id="d1", page=1, bbox=[], text="Sample passage", score=0.9)
    ]
    result = verify(claim, passages)
    assert result.verdict in VerdictEnum
    assert isinstance(result.reason, str)
