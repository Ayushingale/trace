"""
BM25 and Inverted Index for TRACE Passages.
"""

import re
from typing import List, Dict, Any, Optional
from backend.app.schemas import Passage

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None


def tokenize(text: str) -> List[str]:
    """
    Standard lowercased alphanumeric tokenizer.
    """
    return re.findall(r"\w+", text.lower())


class DocumentIndex:
    """
    In-memory BM25 index over passages.
    """
    def __init__(self, passages: Optional[List[Passage]] = None):
        self.passages: List[Passage] = passages or []
        self.tokenized_corpus: List[List[str]] = [tokenize(p.text) for p in self.passages]
        if BM25Okapi and self.tokenized_corpus:
            self.bm25 = BM25Okapi(self.tokenized_corpus)
        else:
            self.bm25 = None

    def add_passages(self, new_passages: List[Passage]) -> None:
        self.passages.extend(new_passages)
        self.tokenized_corpus = [tokenize(p.text) for p in self.passages]
        if BM25Okapi and self.tokenized_corpus:
            self.bm25 = BM25Okapi(self.tokenized_corpus)

    def search_bm25(self, query: str, top_k: int = 10) -> List[tuple[Passage, float]]:
        if not self.passages:
            return []

        tokens = tokenize(query)
        if not tokens:
            return [(p, 0.0) for p in self.passages[:top_k]]

        if self.bm25:
            scores = self.bm25.get_scores(tokens)
        else:
            # Simple TF fallback if BM25Okapi not present
            scores = []
            token_set = set(tokens)
            for doc_toks in self.tokenized_corpus:
                overlap = sum(1 for t in doc_toks if t in token_set)
                scores.append(overlap / (len(doc_toks) + 1.0))

        # Rank pairs
        ranked = sorted(zip(self.passages, scores), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
