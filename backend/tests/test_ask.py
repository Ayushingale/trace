"""
Unit tests for Ask Mode (backend/verify/ask.py).
Tests:
- Constrained generation & verification
- Filtering and dropping of non-SUPPORTED sentences
- Reporting count of dropped and supported sentences
"""

from unittest.mock import patch
from backend.app.schemas import Passage, VerdictResult, VerdictEnum
from backend.verify.ask import answer_and_verify


def test_ask_empty_passages():
    with patch("backend.verify.ask.retrieve", return_value=[]):
        res = answer_and_verify("What is the payment term?", ["doc1"])
        assert res["supported_count"] == 0
        assert res["dropped_count"] == 0
        assert "No relevant source documents found" in res["answer"]


def test_ask_filters_non_supported_sentences():
    mock_passages = [
        Passage(
            doc_id="d1",
            page=1,
            bbox=[0, 0, 100, 100],
            text="Invoices are payable within 30 business days. Total liability is capped at $50,000.",
            score=0.9,
        )
    ]

    # Generated answer has 2 sentences: one true, one hallucinated
    fake_answer = "Invoices are payable within 30 business days. The contract requires 5 years commitment."

    with patch("backend.verify.ask.retrieve", return_value=mock_passages), \
         patch("backend.verify.ask.call_llm", return_value=fake_answer):
        res = answer_and_verify("What are the terms?", ["d1"])
        assert res["total_generated"] == 2
        assert res["supported_count"] >= 1
        assert res["dropped_count"] >= 1
        # Dropped sentence must not appear in filtered answer
        assert "30 business days" in res["answer"]
        assert "5 years commitment" not in res["answer"]
