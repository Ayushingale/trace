# TRACE User Research & Evidence Collection

## Overview
As part of the design and validation of **TRACE** (Claim-Level Source Trace Verifier), we conducted qualitative user interviews with 5 participants across academic, legal compliance, and research domains. The goal was to quantify trust degradation, identify the cost of hallucinated/unverified AI summaries, and analyze existing manual verification behaviors.

---

## Participant Profiles

| ID | Persona / Role | Domain | Primary AI Usage | Frequency |
|---|---|---|---|---|
| **P1** | Graduate Student (CS / NLP) | Academic Research | Literature review & paper summarization | Daily |
| **P2** | Paralegal / Legal Assistant | Corporate Law | Contract abstraction & clause comparison | 3-4x / week |
| **P3** | Compliance Analyst | Fintech / Banking | Regulatory policy review & vendor audit | Daily |
| **P4** | Master of Finance Student | Financial Analysis | 10-K & earnings call transcript synthesis | Weekly |
| **P5** | Clinical Research Coordinator | Health Sciences | Protocol review & trial guideline summaries | 2-3x / week |

---

## Quantitative Findings

- **100% (5/5)** use AI summarization tools (ChatGPT, Claude, Perplexity, or internal Copilots) regularly.
- **0% (0/5)** completely trust raw AI outputs without manual verification for critical tasks.
- **100% (5/5)** have encountered subtle, high-impact hallucinations (factual inversions, mismatched dates, distorted thresholds).
- **80% (4/5)** reported direct negative consequences (lost submission points, embarrassing stakeholder correction, 3+ wasted hours manual cross-checking).
- **Average time spent manually verifying an AI summary**: **28 minutes** per document/report.

---

## Core Interview Questions & Anonymized Quotes

### 1. "Do you use AI summaries, and how much do you trust them?"
> **P1 (Graduate Student)**: *"I use Claude to summarize related papers before writing seminar abstracts. But I never trust numbers or citation references. The models sound ultra-confident even when they invent baselines."*

> **P2 (Paralegal)**: *"We test LLMs for summarizing vendor agreements. Trust is near zero for liability caps and notice windows. If the AI misses a 'business days' vs 'calendar days' distinction, that's a breach."*

> **P3 (Compliance Analyst)**: *"We are strictly prohibited from submitting uncorroborated AI summaries to the audit committee. Every sentence must have an audit trail back to the actual compliance framework."*

---

### 2. "Has an AI summary ever been wrong, and what did it cost you?"
> **P1**: *"During a thesis defense prep, an LLM summarized a benchmark claim saying a model scored 91.4% F1, but the original paper was on a completely different dataset split. My advisor caught it. It was humiliating."*

> **P2**: *"An AI summarized a master services agreement claiming indemnity was capped at $500,000. It failed to see an exception carveout in Section 14.3 for gross negligence and data breach. If we hadn't manually verified the PDF, that could have been a multi-million-dollar liability oversight."*

> **P4 (Finance Student)**: *"An earnings summary claimed a SaaS company increased gross margin by 240 bps YoY. It turned out it was down 40 bps, and the AI hallucinated the sign by confusing operating margin with gross margin. Cost me 15% on a graded equity pitch."*

> **P5 (Clinical Research)**: *"An AI protocol summary stated dosage titration was every 7 days instead of 14 days due to confusing clinical phase 1 and 2 tables. That taught us never to deploy generative summaries without sentence-level grounding."*

---

### 3. "How do you check/verify AI outputs today?"
> **P1**: *"Ctrl+F in 4 different open PDFs across two monitors. It takes forever and breaks my concentration."*

> **P2**: *"Side-by-side split screen. I highlight every single clause and compare it line-by-line with sticky notes. It completely defeats the speed advantage of using AI in the first place."*

> **P3**: *"Manual footnote tracking in Word tables. We essentially re-read the original document to confirm what the AI wrote, which feels absurd."*

---

## Implications for TRACE Product Design

1. **Granular Visual Lineage (Judges & Users must SEE the path)**:
   Users don't want a single aggregate score; they need to click an individual sentence and immediately see the exact page, bounding box, and decision engine that verified it.
2. **Deterministic Pre-emption**:
   Users specifically highlighted numeric units (days vs business days), negation reversals, and date misalignments. Pure LLM judges often suffer from the same attention blind spots, so deterministic checks + calibrated combiners are critical.
3. **Interactive Human-in-the-Loop Override**:
   For ambiguous claims (NEEDS_REVIEW), users want single-click confirmation, override, or evidence requests directly in the workflow.
