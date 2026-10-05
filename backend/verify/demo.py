"""
TRACE Verification Demo Script.
Run with:
    python -m backend.verify.demo
Prints verified verdicts for the golden contract example with planted errors.
"""

import json
import os
import sys

# Ensure repository root is on sys.path so script can be run directly or as a module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.schemas import Claim, Passage, VerdictEnum, ReviewStatusEnum
from backend.verify.verify import verify

# ANSI Color Codes for terminal
COLORS = {
    "SUPPORTED": "\033[92m",      # Green
    "CONTRADICTED": "\033[91m",    # Red
    "UNSUPPORTED": "\033[93m",     # Amber / Yellow
    "NEEDS_REVIEW": "\033[95m",    # Purple / Magenta
    "RESET": "\033[0m",
    "BOLD": "\033[1m",
    "DIM": "\033[2m",
}


def run_demo():
    print(f"\n{COLORS['BOLD']}============================================================{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}        TRACE - CLAIM VERIFICATION ENGINE (DEMO)           {COLORS['RESET']}")
    print(f"{COLORS['BOLD']}============================================================{COLORS['RESET']}\n")

    golden_dir = os.path.join(os.path.dirname(__file__), "..", "tests", "golden")
    passages_path = os.path.join(golden_dir, "contract_passages.json")
    claims_path = os.path.join(golden_dir, "planted_claims.json")

    with open(passages_path, "r", encoding="utf-8") as f:
        passages_raw = json.load(f)
    with open(claims_path, "r", encoding="utf-8") as f:
        claims_meta = json.load(f)

    passages = [Passage(**p) for p in passages_raw]
    print(f"Loaded {len(passages)} source contract passages.")
    print(f"Evaluating {len(claims_meta)} claims (including 5 planted errors)...\n")

    for idx, item in enumerate(claims_meta, 1):
        claim = Claim(
            claim_id=item["claim_id"],
            claim_text=item["claim_text"],
            char_start=0,
            char_end=len(item["claim_text"]),
            claim_type=item["claim_type"],
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.5,
            reason="Unverified",
            rule_id="init",
            evidence=[],
            review_status=ReviewStatusEnum.NONE,
        )

        p_idx = item["passage_index"]
        cand_passages = [passages[p_idx]] if p_idx is not None else []

        result = verify(claim, cand_passages)

        verdict_str = result.verdict.value
        color = COLORS.get(verdict_str, "")
        reset = COLORS["RESET"]

        print(f"[{idx}] {COLORS['BOLD']}Claim ID:{reset} {item['claim_id']} ({item['claim_type']})")
        print(f"    {COLORS['BOLD']}Text:{reset} \"{item['claim_text']}\"")
        print(f"    {COLORS['BOLD']}Verdict:{reset} {color}{verdict_str}{reset} (Confidence: {int(result.confidence * 100)}%)")
        print(f"    {COLORS['BOLD']}Rule:{reset} {result.rule_id}")
        print(f"    {COLORS['BOLD']}Reason:{reset} {result.reason}")
        if result.evidence:
            print(f"    {COLORS['BOLD']}Evidence:{reset} \"{result.evidence[0].passage_text[:90]}...\"")
        else:
            print(f"    {COLORS['BOLD']}Evidence:{reset} None (No passage found)")
        print(f"    {COLORS['DIM']}Expected: {item['expected_verdict']} | Test: {'PASS' if verdict_str == item['expected_verdict'] else 'FAIL'}{reset}\n")

    print(f"{COLORS['BOLD']}Demo completed successfully.{COLORS['RESET']}\n")


if __name__ == "__main__":
    run_demo()
