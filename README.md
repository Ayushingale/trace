# TRACE: Claim-Level Verifier for AI-Written Text

> **WCC Launchpad 30 Hackathon** | Team of 4

TRACE ingests digital-text PDFs (contracts, policies, arXiv papers) and pastes of AI-written summaries or answers. It breaks the text into atomic claims and verifies each against source passages using a 10-step hybrid neuro-symbolic pipeline.

---

## Architecture Overview

```
Browser (React + Vite + TypeScript)
  ├─ POST /documents ───────────────┐
  ├─ GET  /jobs/{id}/stream (SSE) ◄─┤
  └─ POST /claims/{id}/review       │
                                    ▼
FastAPI (backend/app)
  api routes → orchestrator → [ docs parser → index → retrieve ]
                           └→ [ extract → classify → checks → NLI → judge → combiner ]
                           └→ SQLite + file storage + LLM wrapper
Models folder (trained artifacts) loaded once at startup
```

## Verdicts
- **SUPPORTED** (Green): Evidence directly entails the claim.
- **CONTRADICTED** (Red): Evidence conflicts with numeric, date, modal, or semantic terms.
- **UNSUPPORTED** (Amber): No corroborating evidence found in source documents.
- **NEEDS_REVIEW** (Purple): Ambiguous, conflicting, or low confidence; abstains and routes to human reviewer.

---

## Project Structure

```
trace/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── CONTRACT.md                 # Single source of truth for schemas & endpoints
│   ├── ARCHITECTURE.md
│   └── EVAL_RESULTS.md
├── backend/
│   ├── app/llm/                    # PERSON 1: LLM client wrapper with retries & timeouts
│   ├── verify/                     # PERSON 1: Verification engine, deterministic checks, judge, extract
│   ├── models/
│   │   ├── claim_type.py           # PERSON 1: TF-IDF + Logistic Regression router
│   │   ├── combiner.py             # PERSON 1: Calibrated Gradient Boosting combiner
│   │   ├── nli.py                  # PERSON 1: Natural Language Inference module
│   │   ├── doc_classifier.py       # PERSON 2: Document type classification
│   │   └── crossencoder.py         # PERSON 2: Cross-encoder reranker
│   ├── docs_pipeline/              # PERSON 3: PDF/DOCX Parsing, BBoxes, Chunker
│   ├── retrieval/                  # PERSON 3: BM25 + Embeddings Hybrid Search
│   ├── app/                        # PERSON 3: FastAPI API routes, DB, orchestrator
│   ├── artifacts/                  # Model weights & trained joblib models
│   └── tests/                      # Unit tests & Golden dataset
├── training/
│   ├── train_claim_type.py         # PERSON 1: Claim type classifier training
│   ├── train_combiner.py           # PERSON 1: Combiner training & abstention curve
│   ├── train_nli.py                # PERSON 1: NLI benchmarking & diagnostic
│   ├── train_crossencoder.py       # PERSON 2: Cross-encoder training
│   └── train_doc_classifier.py     # PERSON 2: Doc classifier training
├── data/                           # PERSON 2: Evaluation data & splits
├── eval/                           # PERSON 2: Evaluation reproduction scripts
└── frontend/                       # PERSON 4: React, Vite, Tailwind, PDF text layer
```

---

## How to Run My Part (Person 1: Verification Engine)

Person 1 owns the **verification engine**, **deterministic checks**, **claim router**, **NLI**, **calibrated combiner**, and **contract integrity**.

### 1. Run Verification Demo (One Command)
```bash
python -m backend.verify.demo
```
This runs the verification engine against the golden Master Services Agreement clauses and 6 test claims (including 5 planted errors: duration unit mismatch, numeric value mismatch, modality flip, negation flip, and unsupported hallucination) and outputs ANSI color-coded verdicts, confidence, fired rules, and reasons.

### 2. Run All Verification Engine Unit Tests
```bash
python -m pytest backend/tests -q
```
Runs all 90 unit tests covering:
- Deterministic checks (8+ tests each for numbers, durations, dates, modality, negation, entities, hedging)
- Atomic claim extraction with fuzzy character offset validation and paragraph chunking
- LLM Judge quote verification (grounding check rejecting hallucinated citations)
- Calibrated combiner and claim type classifier
- Shared contract schema adherence

### 3. Standalone Execution & Mock Fallbacks
The verification engine runs completely standalone:
- **No external API key required**: When `LLM_API_KEY` is omitted, `client.py` and `judge.py` automatically utilize deterministic fallback heuristics.
- **Model weights included**: Pre-trained artifacts (`claim_type_model.joblib` and `combiner_model.joblib`) are generated into `backend/artifacts/` or automatically trained on initial invocation.
- **Upstream dependency isolation**: If Person 2 (eval splits) or Person 3 (retrieval pipeline) components are pending, the engine tests and operates cleanly against stubs and the contract schema.
API runs on `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Frontend Setup & Source Trace Visualizer (Person 4)
```bash
cd frontend
npm install
npm run dev
```
UI runs on `http://localhost:5173`.

#### Running Frontend Tests
```bash
cd frontend
npm test
```
Runs the Vitest test suite validating `buildGraph` DAG layer compilation, node positioning, and upstream path traversal.

#### How to Switch Between Mocks and the Live Backend
TRACE supports seamless switching between offline simulated claims and the live backend:
1. **In the UI**: Click the **Mode: Mocks / Live SSE Backend** pill in the top header. In Mock Mode, the application operates self-contained using `frontend/src/mocks/claims.json` with streaming simulation. In Live Mode, it connects to Person 3's SSE stream at `GET /jobs/{id}/stream`.
2. **Via Environment Variable**: In `frontend/.env`, configure:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   When omitted, `VITE_API_URL` defaults to `http://localhost:8000`.

---

## Person 4 Deliverables: Visualizer & Documentation

- **Source Trace Graph Engine**: 5-layer visual lineage graph built with `@xyflow/react` and `dagre` in [src/graph/](file:///c:/Users/aarya/OneDrive/Desktop/trace/frontend/src/graph).
- **Three-Column Dark Workspace**:
  - **Left**: Verify & Ask panels with annotated claim underlines and blue numbered pill badges `[1]`, `[2]`.
  - **Center**: 5-layer dependency graph with animated verdict-colored edges and upstream path illumination.
  - **Right**: Itemized claim cards with trust bar, review controls (`Confirm`, `Override`, `Need Evidence`), and "Connected to: N upstream sources".
- **PDF Drawer**: Slide-in document drawer with scale-adaptive bounding box highlight.
- **User Interviews & Evidence**: 5 qualitative domain specialist interviews in [docs/EVIDENCE.md](file:///c:/Users/aarya/OneDrive/Desktop/trace/docs/EVIDENCE.md).
- **Project Submission & Architecture Disclosure**: Comprehensive report in [docs/SUBMISSION.md](file:///c:/Users/aarya/OneDrive/Desktop/trace/docs/SUBMISSION.md).
- **3-Minute Hackathon Demo Script**: Narration and action cues in [docs/DEMO.md](file:///c:/Users/aarya/OneDrive/Desktop/trace/docs/DEMO.md).

---

### 3. Docker Compose
```bash
docker-compose up --build
```

