"""
Atomic Claim Extraction Module.
Uses LLM to split pasted text into atomic claims with character offsets.
Validates offsets against original text and uses fuzzy matching to correct slight misalignments.
"""

import logging
import os
import re
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from typing import List, Dict, Any, Optional
from rapidfuzz import fuzz
from backend.app.llm.client import call_llm
from backend.app.schemas import Claim, VerdictEnum, ReviewStatusEnum

logger = logging.getLogger("trace.verify.extract")


SYSTEM_EXTRACTION_PROMPT = """
You are a precise claim extraction engine.
Given a text, decompose it into independent, atomic verifiable factual statements.
Rules:
1. Every claim must express a single factual proposition.
2. Return a JSON list of objects with keys:
   - "claim_text": the exact or near-exact substring from the source representing the claim
   - "char_start": integer start character offset in the provided text (0-indexed)
   - "char_end": integer end character offset in the provided text (exclusive)
   - "claim_type": one of ["numeric", "date", "duration", "entity", "modal", "negation", "causal", "general"]
3. If no verifiable factual claims are present, return an empty list [].
4. Output strictly valid JSON without markdown wrapping.
"""


def _find_best_offset_match(target_text: str, full_text: str, search_window_start: int = 0) -> Optional[tuple[int, int]]:
    """
    Locates the best matching substring in full_text for target_text.
    First tries exact find, then regex/whitespace normalization, then sliding window fuzzy search.
    """
    clean_target = target_text.strip()
    if not clean_target:
        return None

    # 1. Exact match starting from search_window_start
    idx = full_text.find(clean_target, search_window_start)
    if idx != -1:
        return idx, idx + len(clean_target)
    
    # 1b. Exact match anywhere in full_text
    idx = full_text.find(clean_target)
    if idx != -1:
        return idx, idx + len(clean_target)

    # 2. Match with flexible whitespace
    escaped = re.escape(clean_target)
    pattern = re.sub(r"\\\s+", r"\\s+", escaped)
    match = re.search(pattern, full_text, flags=re.IGNORECASE)
    if match:
        return match.start(), match.end()

    # 3. Fuzzy search in sliding windows of similar length
    target_len = len(clean_target)
    best_score = 0.0
    best_range: Optional[tuple[int, int]] = None
    
    step = max(1, target_len // 4)
    for start_pos in range(0, max(1, len(full_text) - target_len + 10), step):
        candidate = full_text[start_pos : start_pos + target_len]
        score = fuzz.ratio(clean_target.lower(), candidate.lower())
        if score > best_score and score >= 75:
            best_score = score
            best_range = (start_pos, min(len(full_text), start_pos + target_len))

    return best_range


def extract_claims_from_chunk(chunk_text: str, chunk_offset: int) -> List[Dict[str, Any]]:
    """
    Extracts atomic claims from a chunk of text, adjusting offsets relative to chunk_offset.
    """
    if not chunk_text.strip():
        return []

    prompt = f"Extract atomic claims from this text:\n\n{chunk_text}"
    result = call_llm(prompt, system_instruction=SYSTEM_EXTRACTION_PROMPT, json_mode=True)

    if not isinstance(result, list):
        # Could be wrapped in a dictionary like {"claims": [...]}
        if isinstance(result, dict) and "claims" in result and isinstance(result["claims"], list):
            result = result["claims"]
        else:
            logger.warning(f"Malformed or unexpected LLM extraction result: {result}")
            # Fallback heuristic: split into sentences as claims
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk_text) if s.strip()]
            claims = []
            curr_pos = 0
            for s in sentences:
                start = chunk_text.find(s, curr_pos)
                if start == -1:
                    start = chunk_text.find(s)
                if start != -1:
                    end = start + len(s)
                    curr_pos = end
                    claims.append({
                        "claim_text": s,
                        "char_start": start,
                        "char_end": end,
                        "claim_type": "general",
                    })
            result = claims

    extracted: List[Dict[str, Any]] = []
    for item in result:
        if not isinstance(item, dict):
            continue
        text = str(item.get("claim_text", "")).strip()
        if not text:
            continue
        
        raw_start = item.get("char_start")
        raw_end = item.get("char_end")
        claim_type = item.get("claim_type", "general")

        # Validate offsets within chunk
        exact_match = (
            isinstance(raw_start, int)
            and isinstance(raw_end, int)
            and 0 <= raw_start < raw_end <= len(chunk_text)
            and chunk_text[raw_start:raw_end].strip() == text
        )

        if exact_match:
            valid_start = raw_start + chunk_offset
            valid_end = raw_end + chunk_offset
        else:
            # Fuzzy or substring correction
            offset_tuple = _find_best_offset_match(text, chunk_text, search_window_start=raw_start if isinstance(raw_start, int) else 0)
            if offset_tuple:
                valid_start, valid_end = offset_tuple[0] + chunk_offset, offset_tuple[1] + chunk_offset
                logger.info(f"Fixed claim offset alignment for '{text[:30]}' -> [{valid_start}, {valid_end}]")
            else:
                logger.warning(f"Dropping claim '{text[:30]}' as substring could not be reliably located in text.")
                continue

        extracted.append({
            "claim_text": text,
            "char_start": valid_start,
            "char_end": valid_end,
            "claim_type": claim_type,
        })

    return extracted


def extract_claims(full_text: str, max_chunk_chars: int = 1500) -> List[Claim]:
    """
    Decomposes full_text into atomic claims with validated character offsets.
    Handles long text by paragraph chunking.
    """
    full_text = full_text.strip()
    if not full_text:
        return []

    # If text is within max_chunk_chars, process directly
    if len(full_text) <= max_chunk_chars:
        raw_claims = extract_claims_from_chunk(full_text, 0)
    else:
        # Split by paragraphs / double newlines to preserve sentence integrity
        paragraphs = re.split(r"(\n\s*\n)", full_text)
        raw_claims = []
        current_offset = 0
        current_chunk = ""
        current_chunk_start = 0

        for part in paragraphs:
            if len(current_chunk) + len(part) > max_chunk_chars and current_chunk.strip():
                chunk_claims = extract_claims_from_chunk(current_chunk, current_chunk_start)
                raw_claims.extend(chunk_claims)
                current_chunk_start = current_offset
                current_chunk = part
            else:
                current_chunk += part
            current_offset += len(part)

        if current_chunk.strip():
            chunk_claims = extract_claims_from_chunk(current_chunk, current_chunk_start)
            raw_claims.extend(chunk_claims)

    claims: List[Claim] = []
    for idx, c in enumerate(raw_claims):
        claims.append(
            Claim(
                claim_id=f"c_{idx+1:03d}",
                claim_text=c["claim_text"],
                char_start=c["char_start"],
                char_end=c["char_end"],
                claim_type=c.get("claim_type", "general"),
                verdict=VerdictEnum.NEEDS_REVIEW,
                confidence=0.5,
                reason="Extracted atomic claim pending verification.",
                rule_id="extract.pending",
                evidence=[],
                review_status=ReviewStatusEnum.NONE,
            )
        )

    return claims
