"""
Ask Mode Module.
Answers questions strictly from source documents, verifies every sentence
through the TRACE verification engine, and drops any non-SUPPORTED sentences.
"""

import logging
import re
from typing import Any, Dict, List
from backend.app.llm.client import call_llm
from backend.app.schemas import Claim, Passage, VerdictEnum, ReviewStatusEnum
from backend.retrieval.retrieve import retrieve
from backend.verify.verify import verify

logger = logging.getLogger("trace.verify.ask")

ASK_SYSTEM_PROMPT = """
You are a factual Q&A engine.
Answer the user's question using ONLY the provided source passages.
Rules:
1. Do not use outside knowledge.
2. Every sentence in your answer must be directly supported by the text.
3. Be concise and factual.
"""


def answer_and_verify(
    question: str,
    doc_ids: List[str],
    k: int = 5,
) -> Dict[str, Any]:
    """
    Answers question from sources, verifies every sentence, drops non-supported sentences.
    """
    # 1. Retrieve relevant passages
    passages = retrieve(question, doc_ids, k=k)
    if not passages:
        return {
            "answer": "No relevant source documents found to answer this question.",
            "answer_sentences": [],
            "supported_count": 0,
            "dropped_count": 0,
            "total_generated": 0,
        }

    # 2. Generate answer constrained strictly to passages
    context_text = "\n\n".join(f"Passage {idx+1}:\n{p.text}" for idx, p in enumerate(passages))
    prompt = f"SOURCE PASSAGES:\n{context_text}\n\nQUESTION: {question}\n\nAnswer:"
    
    raw_answer = call_llm(prompt, system_instruction=ASK_SYSTEM_PROMPT)
    if isinstance(raw_answer, dict):
        raw_answer = raw_answer.get("answer", "")
    raw_answer = str(raw_answer).strip()

    # 3. Split generated answer into sentences
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", raw_answer) if len(s.strip()) > 3]

    verified_claims: List[Claim] = []
    supported_claims: List[Claim] = []
    dropped_count = 0

    curr_offset = 0
    for idx, sentence in enumerate(sentences):
        start = raw_answer.find(sentence, curr_offset)
        if start == -1:
            start = raw_answer.find(sentence)
        end = start + len(sentence) if start != -1 else curr_offset + len(sentence)
        curr_offset = end

        claim = Claim(
            claim_id=f"ask_c_{idx+1:03d}",
            claim_text=sentence,
            char_start=max(0, start),
            char_end=max(0, end),
            claim_type="general",
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.5,
            reason="Ask mode verification",
            rule_id="ask.verifier",
            evidence=[],
            review_status=ReviewStatusEnum.NONE,
        )

        # Run claim through the verification engine
        verdict_result = verify(claim, passages)
        claim.verdict = verdict_result.verdict
        claim.confidence = verdict_result.confidence
        claim.reason = verdict_result.reason
        claim.rule_id = verdict_result.rule_id
        claim.evidence = verdict_result.evidence

        verified_claims.append(claim)

        if verdict_result.verdict == VerdictEnum.SUPPORTED:
            supported_claims.append(claim)
        else:
            dropped_count += 1
            logger.info(
                f"Ask Mode: Dropped non-supported sentence: '{sentence}' (Verdict: {verdict_result.verdict}, Rule: {verdict_result.rule_id})"
            )

    filtered_answer = " ".join(c.claim_text for c in supported_claims)
    if not filtered_answer and sentences:
        filtered_answer = f"Generated {len(sentences)} candidate sentences, but none could be strictly verified against the uploaded source documents."

    return {
        "answer": filtered_answer,
        "answer_sentences": supported_claims,
        "all_sentences": verified_claims,
        "supported_count": len(supported_claims),
        "dropped_count": dropped_count,
        "total_generated": len(sentences),
    }
