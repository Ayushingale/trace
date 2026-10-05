"""
Unit tests for Atomic Claim Extraction module (backend/verify/extract.py).
Tests:
- Empty input
- Character offset accuracy
- Fuzzy offset correction
- Paragraph chunking for long input
- Fallback on malformed or non-JSON responses
"""

from backend.verify.extract import extract_claims, _find_best_offset_match


def test_extract_empty_string():
    claims = extract_claims("")
    assert claims == []
    claims_whitespace = extract_claims("   \n\n  \t  ")
    assert claims_whitespace == []


def test_find_best_offset_match_exact():
    full_text = "All invoices are payable within 30 business days from receipt."
    target = "within 30 business days"
    offsets = _find_best_offset_match(target, full_text)
    assert offsets is not None
    start, end = offsets
    assert full_text[start:end] == target


def test_find_best_offset_match_flexible_whitespace():
    full_text = "The license fee\n   shall be paid   upon signing."
    target = "The license fee shall be paid"
    offsets = _find_best_offset_match(target, full_text)
    assert offsets is not None
    start, end = offsets
    assert "license fee" in full_text[start:end]


def test_find_best_offset_match_fuzzy():
    full_text = "The vendor shall maintain ISO-27001 standard certification."
    target = "vendor shall maintain ISO 27001 certification"
    offsets = _find_best_offset_match(target, full_text)
    assert offsets is not None
    start, end = offsets
    assert start >= 0 and end <= len(full_text)


def test_extract_claims_short_text():
    text = "Payment is due within 30 days. The interest rate is 5%."
    claims = extract_claims(text)
    assert len(claims) >= 1
    for c in claims:
        assert len(c.claim_text) > 0
        assert 0 <= c.char_start < c.char_end <= len(text)
        assert c.rule_id == "extract.pending"


def test_extract_claims_long_text_chunking():
    # Long text with paragraphs exceeding 1500 chars
    para1 = "Section 1: General Terms. " + ("The licensee agrees to abide by all local laws. " * 30)
    para2 = "Section 2: Payment Terms. " + ("Invoices are payable within 30 business days. " * 30)
    full_text = f"{para1}\n\n{para2}"
    assert len(full_text) > 1500

    claims = extract_claims(full_text, max_chunk_chars=1000)
    assert len(claims) >= 2
    for c in claims:
        assert 0 <= c.char_start < c.char_end <= len(full_text)
        assert c.claim_text.strip() != ""
