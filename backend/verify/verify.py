"""
Verification module stub for TRACE.
Contract:
verify(claim: Claim, passages: list[Passage]) -> VerdictResult
"""

from typing import List
from backend.app.schemas import Claim, Passage, VerdictResult, VerdictEnum, Evidence


def verify(claim: Claim, passages: List[Passage]) -> VerdictResult:
    """
    Verify an atomic claim against candidate passages.
    Stub implementation returning a hardcoded VerdictResult.
    """
    evidence_list: List[Evidence] = []
    if passages:
        p = passages[0]
        evidence_list.append(
            Evidence(
                doc_id=p.doc_id,
                page=p.page,
                bbox=p.bbox,
                passage_text=p.text,
            )
        )

    return VerdictResult(
        verdict=VerdictEnum.SUPPORTED,
        confidence=0.94,
        reason="Direct alignment found with source section clauses.",
        rule_id="stub.verifier",
        evidence=evidence_list,
    )
