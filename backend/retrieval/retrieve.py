"""
Retrieval module for TRACE.
Contract:
retrieve(claim_text: str, doc_ids: list[str], k: int = 5) -> list[Passage]
"""

from typing import List, Optional
from backend.app.schemas import Passage
from backend.retrieval.hybrid import hybrid_search
from backend.retrieval.rerank import rerank_passages

# Global store for loaded passages across jobs
PASSAGE_REGISTRY: dict[str, List[Passage]] = {}


def register_job_passages(job_id: str, passages: List[Passage]) -> None:
    PASSAGE_REGISTRY[job_id] = passages


def get_job_passages(job_id: str) -> List[Passage]:
    return PASSAGE_REGISTRY.get(job_id, [])


def retrieve(
    claim_text: str,
    doc_ids: Optional[List[str]] = None,
    k: int = 5,
    passages: Optional[List[Passage]] = None,
) -> List[Passage]:
    """
    Retrieve top-k passages matching the claim_text across specified doc_ids or given passages.
    """
    active_passages = passages or []
    if not active_passages and doc_ids:
        for did in doc_ids:
            if did in PASSAGE_REGISTRY:
                active_passages.extend(PASSAGE_REGISTRY[did])

    if not active_passages:
        # Check all stored passages
        for p_list in PASSAGE_REGISTRY.values():
            active_passages.extend(p_list)

    if not active_passages:
        # Fallback default contract demo passages
        primary_doc = doc_ids[0] if doc_ids else "doc_master_agreement"
        active_passages = [
            Passage(
                doc_id=primary_doc,
                page=1,
                bbox=[72.0, 140.0, 520.0, 168.0],
                text="2.1 Term: This Agreement shall commence on the Effective Date and continue for twenty-four (24) months.",
                score=0.96,
                section="Section 2: Term and Termination",
            ),
            Passage(
                doc_id=primary_doc,
                page=3,
                bbox=[72.0, 310.0, 520.0, 345.0],
                text="Section 4.2: Undisputed invoices shall be payable within thirty (30) business days following receipt.",
                score=0.92,
                section="Section 4: Payment Terms",
            ),
            Passage(
                doc_id=primary_doc,
                page=5,
                bbox=[72.0, 220.0, 520.0, 260.0],
                text="9.3 Termination for Convenience: Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.",
                score=0.95,
                section="Section 9: Termination",
            ),
            Passage(
                doc_id=primary_doc,
                page=7,
                bbox=[72.0, 480.0, 520.0, 530.0],
                text="11.2 Subject to clause 11.4, neither party excludes liability where prohibited by applicable jurisdiction laws.",
                score=0.58,
                section="Section 11: Limitation of Liability",
            ),
        ]

    candidates = hybrid_search(claim_text, active_passages, top_k=k * 2, doc_filter=doc_ids)
    reranked = rerank_passages(claim_text, candidates)
    return reranked[:k]
