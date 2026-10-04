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
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── app/                        # PERSON 3: API, DB, Orchestrator
│   ├── docs_pipeline/              # PERSON 1: PDF/DOCX Parsing, BBoxes, Chunker
│   ├── retrieval/                  # PERSON 1: BM25 + Embeddings Hybrid Search
│   ├── verify/                     # PERSON 2: Claim Extraction, Deterministic Checks, Judge
│   ├── models/                     # Trained models code
│   ├── artifacts/                  # Model weights (gitignored)
│   └── tests/
├── frontend/                       # PERSON 4: React, Vite, Tailwind, PDF text layer
├── data/                           # PERSON 4: Splits, evaluation data
├── training/                       # Shared fine-tuning notebooks and scripts
└── eval/                           # PERSON 4 (+ P2 inputs): Evaluation reproduction
```

---

## Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```
API runs on `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
UI runs on `http://localhost:5173`.

### 3. Docker Compose
```bash
docker-compose up --build
```
