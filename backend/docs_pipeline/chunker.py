"""
Passage chunker for TRACE.
Refines extracted document blocks into optimal passages for verification.
"""

import re
from typing import List
from backend.app.schemas import Passage


def chunk_passages(raw_passages: List[Passage], max_words: int = 150, overlap_words: int = 30) -> List[Passage]:
    """
    Takes parsed passages and ensures length is optimal for NLI and deterministic verification.
    Long passages are broken into sliding window sub-passages while retaining bbox and page metadata.
    """
    refined: List[Passage] = []

    for p in raw_passages:
        words = p.text.split()
        if len(words) <= max_words:
            refined.append(p)
            continue

        # Split into overlapping chunks
        start_idx = 0
        chunk_idx = 0
        total_chunks = max(1, (len(words) - overlap_words) // (max_words - overlap_words) + 1)
        
        while start_idx < len(words):
            end_idx = min(start_idx + max_words, len(words))
            chunk_words = words[start_idx:end_idx]
            chunk_text = " ".join(chunk_words)

            # Interpolate bounding box fractionally for subchunks
            frac_top = chunk_idx / total_chunks
            frac_bottom = (chunk_idx + 1) / total_chunks
            y0 = p.bbox[1] if len(p.bbox) == 4 else 72.0
            y1 = p.bbox[3] if len(p.bbox) == 4 else 720.0
            chunk_bbox = [
                p.bbox[0] if len(p.bbox) == 4 else 72.0,
                round(y0 + frac_top * (y1 - y0), 1),
                p.bbox[2] if len(p.bbox) == 4 else 520.0,
                round(y0 + frac_bottom * (y1 - y0), 1),
            ]

            refined.append(
                Passage(
                    doc_id=p.doc_id,
                    page=p.page,
                    bbox=chunk_bbox,
                    text=chunk_text,
                    score=p.score,
                    section=p.section,
                )
            )

            if end_idx >= len(words):
                break
            start_idx += max_words - overlap_words
            chunk_idx += 1

    return refined
