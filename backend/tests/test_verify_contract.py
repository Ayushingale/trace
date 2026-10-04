"""
Unit tests validating retrieve and verify stubs against the SHARED CONTRACT.
"""

from backend.app.schemas import Claim, Passage, VerdictEnum, ReviewStatusEnum
from backend.retrieval.retrieve import retrieve
from backend.verify.verify import verify


def test_retrieve_contract():
    """Verify retrieve() returns list of Passages adhering to contract schema."""
    passages = retrieve("Payment is due within 30 days.", ["doc1"], k=3)
    assert len(passages) <= 3
    assert len(passages) > 0
    p = passages[0]
    assert isinstance(p, Passage)
    assert p.doc_id == "doc1"
    assert len(p.bbox) == 4
    assert isinstance(p.score, float)


def test_verify_contract():
    """Verify verify() returns VerdictResult adhering to contract schema."""
    claim = Claim(
        claim_id="c_test_01",
        claim_text="The contract term is fixed for 24 months.",
        char_start=0,
        char_end=42,
        claim_type="duration",
        verdict=VerdictEnum.NEEDS_REVIEW,
        confidence=0.5,
        reason="Initial state",
        rule_id="init",
        evidence=[],
        review_status=ReviewStatusEnum.NONE,
    )
    passages = retrieve(claim.claim_text, ["doc1"], k=1)
    result = verify(claim, passages)

    assert result.verdict in [
        VerdictEnum.SUPPORTED,
        VerdictEnum.CONTRADICTED,
        VerdictEnum.UNSUPPORTED,
        VerdictEnum.NEEDS_REVIEW,
    ]
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.reason) > 0
    assert len(result.rule_id) > 0
