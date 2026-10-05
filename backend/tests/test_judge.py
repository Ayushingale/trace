"""
Unit tests for LLM Judge module (backend/verify/judge.py).
Tests:
- Empty passage evidence -> UNSUPPORTED
- Strict quote validation (rejects output when quote is not in passage)
- Acceptance of valid verbatim quote
- Handling of judge failures gracefully
"""

from unittest.mock import patch
from backend.verify.judge import judge_claim_against_passage
from backend.app.schemas import VerdictEnum


def test_judge_empty_passage():
    res = judge_claim_against_passage("Any claim", "")
    assert res["verdict"] == VerdictEnum.UNSUPPORTED.value
    assert res["valid"] is True


def test_judge_rejects_hallucinated_quote():
    claim = "The vendor provides 99.9% uptime SLA."
    passage = "The software is provided on an as-is basis without warranties."

    # Mock LLM returning a verdict with a fabricated quote
    fake_llm_response = {
        "verdict": "SUPPORTED",
        "quote_from_passage": "The vendor guarantees 99.9% high availability uptime.",
        "reasoning": "Uptime guarantee is stated.",
    }

    with patch("backend.verify.judge.call_llm", return_value=fake_llm_response):
        res = judge_claim_against_passage(claim, passage)
        assert res["valid"] is False
        assert res["verdict"] == VerdictEnum.NEEDS_REVIEW.value
        assert "not present in source passage" in res["reasoning"]


def test_judge_accepts_verbatim_quote():
    claim = "Payment is due in 30 business days."
    passage = "Payment terms: Invoices are payable within 30 business days of delivery."

    fake_llm_response = {
        "verdict": "SUPPORTED",
        "quote_from_passage": "Invoices are payable within 30 business days",
        "reasoning": "Direct statement matches claim.",
    }

    with patch("backend.verify.judge.call_llm", return_value=fake_llm_response):
        res = judge_claim_against_passage(claim, passage)
        assert res["valid"] is True
        assert res["verdict"] == "SUPPORTED"
        assert res["quote_from_passage"] == "Invoices are payable within 30 business days"


def test_judge_handles_non_dict_response():
    with patch("backend.verify.judge.call_llm", return_value="Invalid text output"):
        res = judge_claim_against_passage("Claim", "Passage")
        assert res["valid"] is False
        assert res["verdict"] == VerdictEnum.NEEDS_REVIEW.value
