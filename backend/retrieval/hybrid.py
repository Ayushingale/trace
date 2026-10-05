"""
Hybrid Retrieval Engine for TRACE.
Fuses BM25 keyword matching with numeric/entity boosting and TF-IDF/n-gram similarity.
"""

import re
from typing import List, Optional
from backend.app.schemas import Passage
from backend.retrieval.index import DocumentIndex, tokenize


def extract_numbers_and_entities(text: str) -> set[str]:
    """
    Extracts digits, currency symbols, and capitalized words likely to be critical anchors.
    """
    nums = set(re.findall(r"\b\d+(?:[\.,]\d+)?\b", text))
    caps = set(re.findall(r"\b[A-Z][a-zA-Z0-9_\-]{2,}\b", text.lower()))
    return nums.union(caps)


def hybrid_search(
    query: str,
    passages: List[Passage],
    top_k: int = 5,
    doc_filter: Optional[List[str]] = None,
) -> List[Passage]:
    """
    Executes hybrid retrieval:
    1. Filters passages by doc_filter if supplied.
    2. BM25 score.
    3. Exact number/entity match boost (+0.3 per critical matched token).
    4. Lexical character n-gram/Jaccard overlap.
    5. Normalizes score between 0.0 and 1.0 and assigns to passage.score.
    """
    filtered_passages = passages
    if doc_filter:
        doc_set = set(doc_filter)
        filtered_passages = [p for p in passages if p.doc_id in doc_set]

    if not filtered_passages:
        return []

    index = DocumentIndex(filtered_passages)
    bm25_ranked = index.search_bm25(query, top_k=len(filtered_passages))

    query_anchors = extract_numbers_and_entities(query)
    query_tokens = set(tokenize(query))

    max_bm25 = max([score for _, score in bm25_ranked] + [1.0])
    if max_bm25 <= 0.0:
        max_bm25 = 1.0

    scored_passages: List[tuple[Passage, float]] = []

    for passage, bm25_score in bm25_ranked:
        # Normalized BM25 score (0 to 1)
        norm_bm25 = max(0.0, bm25_score) / max_bm25

        # Anchor boost
        passage_text_lower = passage.text.lower()
        anchor_hits = sum(1 for a in query_anchors if a in passage_text_lower)
        anchor_boost = min(0.35, anchor_hits * 0.15)

        # Token Jaccard overlap
        passage_tokens = set(tokenize(passage.text))
        if passage_tokens:
            jaccard = len(query_tokens.intersection(passage_tokens)) / len(query_tokens.union(passage_tokens))
        else:
            jaccard = 0.0

        final_score = round(min(1.0, 0.55 * norm_bm25 + 0.25 * jaccard + anchor_boost), 4)

        # Clone passage with populated score
        res = Passage(
            doc_id=passage.doc_id,
            page=passage.page,
            bbox=passage.bbox,
            text=passage.text,
            score=final_score,
            section=passage.section,
        )
        scored_passages.append((res, final_score))

    scored_passages.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored_passages[:top_k]]
