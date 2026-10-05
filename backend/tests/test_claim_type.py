"""
Unit tests for Claim Type Classifier (backend/models/claim_type.py).
Tests:
- Classification into 8 canonical types
- Fast-path heuristic rules
- Fallback to general
"""

from backend.models.claim_type import classify_claim_type, CLAIM_TYPES


def test_classify_numeric():
    assert classify_claim_type("The penalty fee is $50,000 USD.") == "numeric"
    assert classify_claim_type("Revenue grew by 25% year over year.") == "numeric"
    assert classify_claim_type("The advance payment is 10 lakh INR.") == "numeric"


def test_classify_duration():
    assert classify_claim_type("Payment is due within 30 business days.") == "duration"
    assert classify_claim_type("The contract term lasts for 24 months.") == "duration"
    assert classify_claim_type("Support responds within 48 hours.") == "duration"


def test_classify_date():
    assert classify_claim_type("The agreement commenced on January 15, 2024.") == "date"
    assert classify_claim_type("Filing deadline is 2024-12-31.") == "date"


def test_classify_modal():
    assert classify_claim_type("The licensee shall comply with confidentiality.") == "modal"
    assert classify_claim_type("Either party may terminate upon mutual agreement.") == "modal"


def test_classify_negation():
    assert classify_claim_type("The vendor provides no warranties under this clause.") == "negation"
    assert classify_claim_type("Neither party shall disclose confidential information.") == "negation"
    assert classify_claim_type("The service is provided without any guarantees.") == "negation"


def test_classify_valid_types():
    assert classify_claim_type("Standard operating procedure clause.") in CLAIM_TYPES
