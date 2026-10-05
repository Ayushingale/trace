"""
TRACE Evaluation Pipeline.
Evaluates end-to-end retrieval and verification against benchmark documents and claims.
"""

import json
import os
import sys
import time

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.schemas import Claim, Passage, VerdictEnum
from backend.docs_pipeline.parser import parse_text_content
from backend.retrieval.retrieve import retrieve, register_job_passages
from backend.verify.verify import verify


def run_benchmark():
    print("=" * 65)
    print("   TRACE END-TO-END PIPELINE EVALUATION")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(base_dir, "data", "documents")
    bench_file = os.path.join(base_dir, "data", "benchmarks", "benchmark_claims.json")

    # 1. Load documents
    all_passages: list[Passage] = []
    doc_files = ["master_services_agreement.txt", "security_compliance_policy.txt"]
    for df in doc_files:
        path = os.path.join(docs_dir, df)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            passages = parse_text_content(content, doc_id=df.replace(".txt", ""))
            all_passages.extend(passages)
            print(f"[LOADED] {df}: {len(passages)} passages extracted.")

    register_job_passages("benchmark_eval", all_passages)

    # 2. Load benchmark claims
    with open(bench_file, "r", encoding="utf-8") as f:
        benchmark_data = json.load(f)

    correct = 0
    total = len(benchmark_data)
    latencies = []

    print(f"\nEvaluating {total} benchmark claims...\n")
    print(f"{'#':<3} | {'CLAIM':<42} | {'EXPECTED':<12} | {'PREDICTED':<12} | {'MATCH':<5}")
    print("-" * 80)

    for i, item in enumerate(benchmark_data, 1):
        claim_text = item["claim_text"]
        expected = item["expected_verdict"]
        claim_obj = Claim(
            claim_id=f"bench_{i:03d}",
            claim_text=claim_text,
            char_start=0,
            char_end=len(claim_text),
            claim_type=item.get("claim_type", "general"),
            verdict=VerdictEnum.UNSUPPORTED,
            confidence=0.5,
            reason="",
            rule_id="",
        )

        t0 = time.perf_counter()
        passages = retrieve(claim_text, passages=all_passages, k=3)
        result = verify(claim_obj, passages)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(latency_ms)

        is_match = (result.verdict.value == expected)
        if is_match:
            correct += 1

        match_str = "PASS" if is_match else "FAIL"
        trunc_claim = (claim_text[:39] + "...") if len(claim_text) > 42 else claim_text
        print(f"{i:<3} | {trunc_claim:<42} | {expected:<12} | {result.verdict.value:<12} | {match_str:<5}")
        if not is_match:
            top_snippet = passages[0].text[:80] if passages else "NO EVIDENCE"
            print(f"    --> Rule: {result.rule_id} | Reason: {result.reason}")
            print(f"    --> Evidence: {top_snippet}")

    accuracy = (correct / total) * 100.0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    print("=" * 80)
    print(f"Total Evaluated: {total}")
    print(f"Accuracy / Agreement: {accuracy:.1f}% ({correct}/{total})")
    print(f"Average Pipeline Latency: {avg_latency:.2f} ms per claim")
    print("=" * 80)


if __name__ == "__main__":
    run_benchmark()
