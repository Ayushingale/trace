"""
Retrieval module stub for TRACE.
Contract:
retrieve(claim_text: str, doc_ids: list[str], k: int = 5) -> list[Passage]
"""

from typing import List
from backend.app.schemas import Passage


def retrieve(claim_text: str, doc_ids: List[str], k: int = 5) -> List[Passage]:
    """
    Retrieve top-k passages matching the claim_text across specified doc_ids.
    Stub implementation returning 3 hardcoded Passage objects.
    """
    primary_doc = doc_ids[0] if doc_ids else "doc_demo"

    return [
        Passage(
            doc_id=primary_doc,
            page=1,
            bbox=[72.0, 120.0, 520.0, 150.0],
            text=f"Primary terms stipulate compliance regarding: {claim_text[:40]}...",
            score=0.92,
            section="Section 1: General Provisions",
        ),
        Passage(
            doc_id=primary_doc,
            page=2,
            bbox=[72.0, 240.0, 520.0, 290.0],
            text="Exceptions apply strictly subject to clause 7 under statutory notice periods.",
            score=0.85,
            section="Section 3: Standard Clauses",
        ),
        Passage(
            doc_id=primary_doc,
            page=3,
            bbox=[72.0, 410.0, 520.0, 460.0],
            text="Payment is due within 30 business days from the receipt of the invoice.",
            score=0.79,
            section="Section 8: Financial Terms",
        ),
    ][:k]
