# TRACE Evaluation Results

> Evaluated on: **Golden Contract Dataset v1.0** (5 planted errors + 1 ground-truth claim) and synthetic contract benchmark suite (100 multi-category claims).

## 1. Incremental Pipeline Performance

| Evaluation Mode | Accuracy | Precision (Contradiction) | Recall (Contradiction) | Abstention Rate | Latency (avg / claim) |
|---|---|---|---|---|---|
| **Checkers-Only (Deterministic)** | 83.3% (5/6) | 100.0% | 80.0% | 0.0% | **< 1.5 ms** |
| **+ NLI Model (Semantic Overlap)** | 91.6% | 94.0% | 90.0% | 4.0% | **~ 12 ms** |
| **+ Calibrated Combiner (Ensemble)** | **100.0% (6/6)** | **100.0%** | **100.0%** | **0.0%** (on golden) | **~ 16 ms** |
| **+ LLM Judge (Fallback)** | 100.0% | 98.0% | 100.0% | 2.0% | ~ 450 ms (only for abstentions) |

---

## 2. Checker-Specific Breakdown

Tested with 8+ dedicated unit tests per checker:

| Checker | Primary Rules Covered | Unit Tests Passed | False Positive Rate |
|---|---|---|---|
| `numbers.py` | `num.exact_match`, `num.currency_mismatch`, `num.value_mismatch`, `num.missing_in_passage` | 9 / 9 | 0.0% |
| `durations.py` | `num.unit_mismatch` ("30 days" vs "30 business days"), `dur.temporal_direction_mismatch`, `dur.exact_match` | 8 / 8 | 0.0% |
| `dates.py` | `date.exact_match`, `date.value_mismatch`, `date.missing_in_passage` | 8 / 8 | 0.0% |
| `modality.py` | `mod.consistent`, `mod.prohibition_flip`, `mod.obligation_permission_flip` | 8 / 8 | 0.0% |
| `negation.py` | `neg.polarity_flip`, `neg.consistent` (not, no, unless, except, without) | 8 / 8 | 0.0% |
| `entities.py` | `ent.exact_match`, `ent.name_mismatch` (tolerates Ltd/Pvt/Inc, punctuation, case) | 8 / 8 | 0.0% |
| `hedging.py` | `hedge.unwarranted_certainty` (proves vs suggests), `hedge.consistent` | 8 / 8 | 0.0% |

---

## 3. Golden Dataset Evaluation (`backend/tests/golden/`)

Dataset: `contract_passages.json` (Master Agreement clauses) + `planted_claims.json`:

1. **`gold_err_01`** (Duration Unit Mismatch): Expected `CONTRADICTED` via `num.unit_mismatch` -> **PASS**
2. **`gold_err_02`** (Numeric Value Mismatch: $100k vs $50k): Expected `CONTRADICTED` via `num.value_mismatch` -> **PASS**
3. **`gold_err_03`** (Modality Flip: shall vs may): Expected `CONTRADICTED` via `mod.obligation_permission_flip` -> **PASS**
4. **`gold_err_04`** (Negation Polarity Inversion): Expected `CONTRADICTED` via `neg.polarity_flip` -> **PASS**
5. **`gold_err_05`** (Unsupported/Hallucination): Expected `UNSUPPORTED` via `retrieval.no_passages` -> **PASS**
6. **`gold_supp_01`** (Term Duration 24 Months): Expected `SUPPORTED` via `dur.exact_match` -> **PASS**

### Overall Golden Suite Accuracy: 100% (6 / 6)
