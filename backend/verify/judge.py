"""
LLM Judge Module.
Invoked only for cases with conflicting signals, edge cases, or low combiner confidence.
Constraint: Must answer from the passage ONLY and provide a verbatim quote.
Rejects judge output if the quote is not actually present in the source passage.
"""

import logging
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from typing import Any, Dict, Optional
from rapidfuzz import fuzz
from backend.app.llm.client import call_llm
from backend.app.schemas import VerdictEnum

logger = logging.getLogger("trace.verify.judge")

JUDGE_SYSTEM_PROMPT = """
You are an impartial, strict legal and factual judge for claim verification.
You are given a CLAIM and a SOURCE PASSAGE.
Your task:
1. Determine if the passage ENTAILS (SUPPORTED), CONFLICTS WITH (CONTRADICTED), or does not mention (UNSUPPORTED) the claim.
2. If ambiguous or uncertain, choose NEEDS_REVIEW.
3. You MUST provide a verbatim quote from the passage supporting your finding.
4. Output STRICTLY a JSON object with:
   - "verdict": "SUPPORTED" | "CONTRADICTED" | "UNSUPPORTED" | "NEEDS_REVIEW"
   - "quote_from_passage": "exact verbatim substring from passage"
   - "reasoning": "brief 1-sentence explanation"
Do not fabricate information. Answer from the passage ONLY.
"""


def judge_claim_against_passage(claim_text: str, passage_text: str) -> Dict[str, Any]:
    """
    Evaluates a claim against a passage using the LLM judge.
    Enforces verbatim quote validation to prevent hallucination.
    """
    if not passage_text.strip():
        return {
            "verdict": VerdictEnum.UNSUPPORTED.value,
            "quote_from_passage": "",
            "reasoning": "Empty passage evidence provided.",
            "valid": True,
        }

    prompt = (
        f"CLAIM:\n{claim_text}\n\n"
        f"SOURCE PASSAGE:\n{passage_text}\n\n"
        "Evaluate strictly and output JSON."
    )

    try:
        response = call_llm(prompt, system_instruction=JUDGE_SYSTEM_PROMPT, json_mode=True)
    except Exception as e:
        logger.warning(f"Judge invocation failed: {e}")
        return {
            "verdict": VerdictEnum.NEEDS_REVIEW.value,
            "quote_from_passage": "",
            "reasoning": f"Judge unavailable: {e}",
            "valid": False,
        }

    if not isinstance(response, dict):
        return {
            "verdict": VerdictEnum.NEEDS_REVIEW.value,
            "quote_from_passage": "",
            "reasoning": "Non-dictionary response received from judge.",
            "valid": False,
        }

    verdict_raw = str(response.get("verdict", "NEEDS_REVIEW")).upper().strip()
    quote = str(response.get("quote_from_passage", "")).strip()
    reasoning = str(response.get("reasoning", "No explanation provided.")).strip()

    # Validate verdict enum
    if verdict_raw not in VerdictEnum.__members__:
        verdict_raw = VerdictEnum.NEEDS_REVIEW.value

    # Grounding check: Quote must be verbatim or near-verbatim in passage
    if quote:
        # Check exact substring
        if quote in passage_text:
            quote_valid = True
        else:
            # Fuzzy match
            f_score = fuzz.partial_ratio(quote.lower(), passage_text.lower())
            quote_valid = f_score >= 85

        if not quote_valid:
            logger.warning(f"Judge hallucinated quote '{quote[:50]}...' not found in passage. Rejecting.")
            return {
                "verdict": VerdictEnum.NEEDS_REVIEW.value,
                "quote_from_passage": "",
                "reasoning": "Judge output rejected: cited quote is not present in source passage.",
                "valid": False,
            }

    return {
        "verdict": verdict_raw,
        "quote_from_passage": quote,
        "reasoning": reasoning,
        "valid": True,
    }
