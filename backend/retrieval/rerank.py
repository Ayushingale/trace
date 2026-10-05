"""
Reranker module for TRACE.
Reranks retrieved candidate passages to ensure the most pertinent evidence
is placed at rank 0 for verification.
"""

from typing import List
# pyrefly: ignore [missing-import]
from backend.app.schemas import Passage
import re


def rerank_passages(claim_text: str, candidate_passages: List[Passage]) -> List[Passage]:
    """
    Reranks candidate passages by aligning claim predicates, numbers, and entities.
    """
    if not candidate_passages:
        return []

    query_words = set(re.findall(r"\w+", claim_text.lower()))

    def score_passage(p: Passage) -> float:
        base = p.score
        p_words = set(re.findall(r"\w+", p.text.lower()))
        overlap = len(query_words.intersection(p_words))
        return base + (overlap * 0.05)

    ranked = sorted(candidate_passages, key=score_passage, reverse=True)
    return ranked
