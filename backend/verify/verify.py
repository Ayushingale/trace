"""
TRACE Verification Engine.
Turns (claim, passages) into a VerdictResult adhering strictly to the contract.
Rule: Code decides what code can decide; trained models handle the rest; LLM is a last resort.
- Empty evidence -> UNSUPPORTED.
- Any internal error -> NEEDS_REVIEW with reason 'processing error', never crashes.
- Every result contains rule_id and a human-readable explanation.
"""

import logging
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from typing import List, Optional
from backend.app.schemas import (
    Claim,
    Passage,
    VerdictResult,
    VerdictEnum,
    Evidence,
)
from backend.models.claim_type import classify_claim_type
from backend.models.combiner import (
    get_combiner,
    extract_feature_vector,
)
from backend.models.nli import predict_nli
from backend.verify.checks.numbers import check_numbers
from backend.verify.checks.durations import check_durations
from backend.verify.checks.dates import check_dates
from backend.verify.checks.modality import check_modality
from backend.verify.checks.negation import check_negation
from backend.verify.checks.entities import check_entities
from backend.verify.checks.hedging import check_hedging
from backend.verify.judge import judge_claim_against_passage

logger = logging.getLogger("trace.verify")


def verify(claim: Claim, passages: List[Passage]) -> VerdictResult:
    """
    Main verification function adhering to shared contract:
    verify(claim: Claim, passages: list[Passage]) -> VerdictResult
    """
    try:
        # Rule 1: Empty evidence -> UNSUPPORTED
        if not passages:
            return VerdictResult(
                verdict=VerdictEnum.UNSUPPORTED,
                confidence=1.0,
                reason="No corroborating evidence passages found in source documents.",
                rule_id="retrieval.no_passages",
                evidence=[],
            )

        top_passage = passages[0]
        evidence_item = Evidence(
            doc_id=top_passage.doc_id,
            page=top_passage.page,
            bbox=top_passage.bbox,
            passage_text=top_passage.text,
        )
        evidence_list = [evidence_item]

        # Determine claim type
        claim_type = claim.claim_type or "general"
        if claim_type == "general":
            claim_type = classify_claim_type(claim.claim_text)

        # Rule 2: Deterministic checks (Code decides what code can decide)
        # Run all relevant checks against top passage text
        num_res = check_numbers(claim.claim_text, top_passage.text)
        dur_res = check_durations(claim.claim_text, top_passage.text)
        date_res = check_dates(claim.claim_text, top_passage.text)
        mod_res = check_modality(claim.claim_text, top_passage.text)
        neg_res = check_negation(claim.claim_text, top_passage.text)
        ent_res = check_entities(claim.claim_text, top_passage.text)
        hedge_res = check_hedging(claim.claim_text, top_passage.text)

        checker_statuses = {
            "numbers": num_res["status"],
            "durations": dur_res["status"],
            "dates": date_res["status"],
            "modality": mod_res["status"],
            "negation": neg_res["status"],
            "entities": ent_res["status"],
            "hedging": hedge_res["status"],
        }

        # Check for currency mismatch first -> never auto convert, flag as needs_review
        if num_res.get("rule_id") == "num.currency_mismatch":
            return VerdictResult(
                verdict=VerdictEnum.NEEDS_REVIEW,
                confidence=0.75,
                reason=num_res["detail"],
                rule_id=num_res["rule_id"],
                evidence=evidence_list,
            )

        # Check for hard deterministic mismatches (Contradictions)
        # Order checks prioritizing the routed claim_type
        # Check if primary dedicated check resolves duration, numeric, or date claim immediately
        if claim_type in ("duration", "numeric", "date"):
            primary_chk = dur_res if claim_type == "duration" else num_res if claim_type == "numeric" else date_res
            if primary_chk["status"] == "match":
                return VerdictResult(
                    verdict=VerdictEnum.SUPPORTED,
                    confidence=0.95,
                    reason=primary_chk["detail"],
                    rule_id=primary_chk["rule_id"],
                    evidence=evidence_list,
                )
            elif primary_chk["status"] == "mismatch":
                return VerdictResult(
                    verdict=VerdictEnum.CONTRADICTED,
                    confidence=0.93,
                    reason=primary_chk["detail"],
                    rule_id=primary_chk["rule_id"],
                    evidence=evidence_list,
                )

        ordered_checks = []
        if claim_type == "negation":
            ordered_checks.append(neg_res)
        elif claim_type == "modal":
            ordered_checks.append(mod_res)
        elif claim_type == "duration":
            ordered_checks.append(dur_res)
        elif claim_type == "numeric":
            ordered_checks.append(num_res)
        elif claim_type == "date":
            ordered_checks.append(date_res)
        elif claim_type == "entity":
            ordered_checks.append(ent_res)

        # Append all remaining checks
        for chk in [dur_res, num_res, date_res, neg_res, mod_res, ent_res, hedge_res]:
            if chk not in ordered_checks:
                ordered_checks.append(chk)

        for chk in ordered_checks:
            if chk["status"] == "mismatch":
                return VerdictResult(
                    verdict=VerdictEnum.CONTRADICTED,
                    confidence=0.93,
                    reason=chk["detail"],
                    rule_id=chk["rule_id"],
                    evidence=evidence_list,
                )

        # If deterministic match with high certainty on specific claim types:
        if claim_type in ("duration", "numeric", "date", "entity"):
            if (
                dur_res["status"] == "match"
                or num_res["status"] == "match"
                or date_res["status"] == "match"
                or ent_res["status"] == "match"
            ):
                active_rule = (
                    dur_res["rule_id"] if dur_res["status"] == "match"
                    else num_res["rule_id"] if num_res["status"] == "match"
                    else date_res["rule_id"] if date_res["status"] == "match"
                    else ent_res["rule_id"]
                )
                active_detail = (
                    dur_res["detail"] if dur_res["status"] == "match"
                    else num_res["detail"] if num_res["status"] == "match"
                    else date_res["detail"] if date_res["status"] == "match"
                    else ent_res["detail"]
                )
                return VerdictResult(
                    verdict=VerdictEnum.SUPPORTED,
                    confidence=0.95,
                    reason=active_detail,
                    rule_id=active_rule,
                    evidence=evidence_list,
                )

        # Rule 3: Semantic check (NLI + Gradient Boosted Combiner)
        nli_probs = predict_nli(top_passage.text, claim.claim_text)
        
        feature_vec = extract_feature_vector(
            retrieval_score=top_passage.score or 0.85,
            rerank_score=top_passage.score or 0.85,
            claim_type=claim_type,
            checker_statuses=checker_statuses,
            nli_probs=nli_probs,
            judge_agreement=0,
            passage_len=len(top_passage.text),
        )

        combiner = get_combiner()
        pred_verdict_str, confidence = combiner.predict(feature_vec)

        # If high-confidence resolution from combiner:
        if pred_verdict_str in ("SUPPORTED", "CONTRADICTED") and confidence >= 0.70:
            verdict_enum = VerdictEnum[pred_verdict_str]
            return VerdictResult(
                verdict=verdict_enum,
                confidence=round(confidence, 2),
                reason=f"Semantic NLI & feature ensemble aligned (entailment: {nli_probs['entailment']}, contradiction: {nli_probs['contradiction']}).",
                rule_id="combiner.calibrated",
                evidence=evidence_list,
            )

        # Rule 4: LLM Judge as last resort for uncertain / low confidence cases
        judge_res = judge_claim_against_passage(claim.claim_text, top_passage.text)
        if judge_res.get("valid") and judge_res.get("verdict") in VerdictEnum.__members__:
            j_verdict = VerdictEnum[judge_res["verdict"]]
            return VerdictResult(
                verdict=j_verdict,
                confidence=0.85 if j_verdict != VerdictEnum.NEEDS_REVIEW else 0.55,
                reason=f"LLM Judge: {judge_res.get('reasoning')}",
                rule_id="judge.llm",
                evidence=evidence_list,
            )

        # Fallback to NEEDS_REVIEW when unsure (Responsible design: Never guess)
        return VerdictResult(
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=round(confidence, 2),
            reason="Ambiguous evidence or confidence below verification threshold; routing to human review.",
            rule_id="combiner.abstain",
            evidence=evidence_list,
        )

    except Exception as exc:
        logger.exception(f"Internal error verifying claim '{claim.claim_id}': {exc}")
        # Contract safety rule: Never crash, return NEEDS_REVIEW with reason 'processing error'
        return VerdictResult(
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.5,
            reason=f"processing error: {str(exc)}",
            rule_id="error.exception",
            evidence=[],
        )
