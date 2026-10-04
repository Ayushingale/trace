# TRACE Shared Contract

> **CRITICAL**: Do not change this specification without notifying all team members.

## 1. Claim Object Schema

Streamed one per SSE event:

```json
{
  "claim_id": "c_001",
  "claim_text": "Payment is due within 30 days.",
  "char_start": 0,
  "char_end": 31,
  "claim_type": "numeric",
  "verdict": "CONTRADICTED",
  "confidence": 0.91,
  "reason": "Source says 30 business days, not 30 days.",
  "rule_id": "num.unit_mismatch",
  "evidence": [
    {
      "doc_id": "d1",
      "page": 3,
      "bbox": [72.0, 310.0, 520.0, 345.0],
      "passage_text": "Undisputed invoices shall be payable within thirty (30) business days following receipt."
    }
  ],
  "review_status": "none"
}
```

### Enums & Types
- **verdict**: `SUPPORTED` (green), `CONTRADICTED` (red), `UNSUPPORTED` (amber), `NEEDS_REVIEW` (purple)
- **review_status**: `none` | `pending` | `confirmed` | `overridden`
- **confidence**: calibrated float between `0.0` and `1.0`
- **claim_type**: `numeric` | `date` | `duration` | `entity` | `modal` | `negation` | `causal` | `general`

---

## 2. API Endpoints

- `POST /documents` (multipart: source files + `text_to_verify`) -> `{ "job_id": string }`
- `GET /jobs/{job_id}/stream` (SSE) -> emits Claim objects one-by-one as events (`event: claim`), followed by `{ "status": "done" }` (`event: done`)
- `POST /claims/{claim_id}/review` `{ "action": "confirm" | "override" | "needs_more_evidence", "new_verdict": optional }` -> updated Claim object
- `POST /ask` `{ "question": string, "job_id": string }` -> `{ "answer_sentences": [Claim, ...] }`
- `GET /jobs/{job_id}/report` -> Downloadable evidence report (HTML/PDF)

---

## 3. Python Interfaces

```python
retrieve(claim_text: str, doc_ids: list[str], k: int = 5) -> list[Passage]
# Passage = { doc_id: str, page: int, bbox: list[float], text: str, score: float, section: str | None }

verify(claim: Claim, passages: list[Passage]) -> VerdictResult
# VerdictResult = { verdict: VerdictEnum, confidence: float, reason: str, rule_id: str, evidence: list[Evidence] }
```
