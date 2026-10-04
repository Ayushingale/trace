import asyncio
import json
import uuid
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from backend.app.config import settings
from backend.app.schemas import (
    Claim,
    Evidence,
    VerdictEnum,
    ReviewStatusEnum,
    DocumentUploadResponse,
    ClaimReviewRequest,
    AskRequest,
    AskResponse,
)

app = FastAPI(
    title="TRACE API",
    description="Claim-level verifier for AI-written text",
    version="0.1.0",
)

# CORS Middleware
origins = settings.cors_origins if settings.cors_origins else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory mock store for claims
MOCK_CLAIMS: dict[str, Claim] = {}


def get_mock_claims_for_job(job_id: str) -> List[Claim]:
    return [
        Claim(
            claim_id=f"c_{job_id}_001",
            claim_text="The contract term is fixed for a period of 24 months.",
            char_start=0,
            char_end=54,
            claim_type="duration",
            verdict=VerdictEnum.SUPPORTED,
            confidence=0.96,
            reason="Clause 2.1 explicitly specifies an initial duration of 24 calendar months.",
            rule_id="dur.exact_match",
            evidence=[
                Evidence(
                    doc_id="doc_master_agreement",
                    page=1,
                    bbox=[72.0, 140.0, 520.0, 168.0],
                    passage_text="2.1 Term: This Agreement shall commence on the Effective Date and continue for twenty-four (24) months.",
                )
            ],
            review_status=ReviewStatusEnum.NONE,
        ),
        Claim(
            claim_id=f"c_{job_id}_002",
            claim_text="Payment is due within 30 days of invoice receipt.",
            char_start=55,
            char_end=104,
            claim_type="numeric",
            verdict=VerdictEnum.CONTRADICTED,
            confidence=0.92,
            reason="Source stipulates 30 business days, not 30 calendar days.",
            rule_id="num.unit_mismatch",
            evidence=[
                Evidence(
                    doc_id="doc_master_agreement",
                    page=3,
                    bbox=[72.0, 310.0, 520.0, 345.0],
                    passage_text="Section 4.2: Undisputed invoices shall be payable within thirty (30) business days following receipt.",
                )
            ],
            review_status=ReviewStatusEnum.NONE,
        ),
        Claim(
            claim_id=f"c_{job_id}_003",
            claim_text="The supplier holds ISO 27001 certification across all global data centers.",
            char_start=105,
            char_end=178,
            claim_type="entity",
            verdict=VerdictEnum.UNSUPPORTED,
            confidence=0.88,
            reason="No record of global ISO 27001 certification exists in the provided document set.",
            rule_id="ent.missing_corroboration",
            evidence=[],
            review_status=ReviewStatusEnum.NONE,
        ),
        Claim(
            claim_id=f"c_{job_id}_004",
            claim_text="Either party may terminate without cause by giving 60 days written notice.",
            char_start=179,
            char_end=253,
            claim_type="modal",
            verdict=VerdictEnum.SUPPORTED,
            confidence=0.95,
            reason="Clause 9.3 authorizes termination for convenience with sixty days written notice.",
            rule_id="mod.permissive_match",
            evidence=[
                Evidence(
                    doc_id="doc_master_agreement",
                    page=5,
                    bbox=[72.0, 220.0, 520.0, 260.0],
                    passage_text="9.3 Termination for Convenience: Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.",
                )
            ],
            review_status=ReviewStatusEnum.NONE,
        ),
        Claim(
            claim_id=f"c_{job_id}_005",
            claim_text="Liability for consequential damages is uncapped under gross negligence.",
            char_start=254,
            char_end=326,
            claim_type="negation",
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.58,
            reason="Clause 11 contains ambiguous cross-references to regional liability exclusions; confidence below threshold.",
            rule_id="combiner.abstain",
            evidence=[
                Evidence(
                    doc_id="doc_master_agreement",
                    page=7,
                    bbox=[72.0, 480.0, 520.0, 530.0],
                    passage_text="11.2 Subject to clause 11.4, neither party excludes liability where prohibited by applicable jurisdiction laws.",
                )
            ],
            review_status=ReviewStatusEnum.PENDING,
        ),
    ]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TRACE Backend"}


@app.post("/documents", response_model=DocumentUploadResponse)
async def upload_documents(
    files: Optional[List[UploadFile]] = File(default=None),
    text_to_verify: Optional[str] = Form(default=""),
):
    """
    Mock upload endpoint. Generates a new job ID and registers claims in mock store.
    """
    job_id = str(uuid.uuid4())[:8]
    claims = get_mock_claims_for_job(job_id)
    for c in claims:
        MOCK_CLAIMS[c.claim_id] = c
    return DocumentUploadResponse(job_id=job_id)


@app.get("/jobs/{job_id}/stream")
async def stream_job_claims(job_id: str):
    """
    SSE endpoint that emits mock claims with 1 second delay between each,
    followed by a 'done' event.
    """
    claims = [c for cid, c in MOCK_CLAIMS.items() if cid.startswith(f"c_{job_id}")]
    if not claims:
        claims = get_mock_claims_for_job(job_id)
        for c in claims:
            MOCK_CLAIMS[c.claim_id] = c

    async def event_generator():
        for claim in claims:
            await asyncio.sleep(1.0)
            data = claim.model_dump_json()
            yield f"event: claim\ndata: {data}\n\n"

        await asyncio.sleep(0.5)
        done_payload = json.dumps({"status": "done", "job_id": job_id, "total_claims": len(claims)})
        yield f"event: done\ndata: {done_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/claims/{claim_id}/review", response_model=Claim)
async def review_claim(claim_id: str, payload: ClaimReviewRequest):
    """
    Update human review status and verdict of a claim.
    """
    claim = MOCK_CLAIMS.get(claim_id)
    if not claim:
        # Create a stub claim if not found in memory
        claim = Claim(
            claim_id=claim_id,
            claim_text="Stub claim for review.",
            char_start=0,
            char_end=22,
            claim_type="general",
            verdict=VerdictEnum.NEEDS_REVIEW,
            confidence=0.5,
            reason="Uncertain verification.",
            rule_id="combiner.abstain",
            evidence=[],
            review_status=ReviewStatusEnum.PENDING,
        )

    if payload.action.value == "confirm":
        claim.review_status = ReviewStatusEnum.CONFIRMED
    elif payload.action.value == "override":
        claim.review_status = ReviewStatusEnum.OVERRIDDEN
        if payload.new_verdict:
            claim.verdict = payload.new_verdict
    elif payload.action.value == "needs_more_evidence":
        claim.review_status = ReviewStatusEnum.PENDING

    MOCK_CLAIMS[claim_id] = claim
    return claim


@app.post("/ask", response_model=AskResponse)
async def ask_question(payload: AskRequest):
    """
    Ask Mode endpoint. Answers strictly from sources, verified sentence by sentence.
    """
    claims = get_mock_claims_for_job(payload.job_id)
    # Filter to only supported sentences as per specification
    supported_sentences = [c for c in claims if c.verdict == VerdictEnum.SUPPORTED]
    return AskResponse(answer_sentences=supported_sentences)


@app.get("/jobs/{job_id}/report")
async def get_job_report(job_id: str):
    """
    Downloadable evidence report HTML.
    """
    claims = [c for cid, c in MOCK_CLAIMS.items() if cid.startswith(f"c_{job_id}")]
    if not claims:
        claims = get_mock_claims_for_job(job_id)

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TRACE Evidence Report - Job {job_id}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }}
    h1 {{ color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }}
    .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }}
    .SUPPORTED {{ background-color: #dcfce7; color: #15803d; }}
    .CONTRADICTED {{ background-color: #fee2e2; color: #b91c1c; }}
    .UNSUPPORTED {{ background-color: #fef3c7; color: #b45309; }}
    .NEEDS_REVIEW {{ background-color: #f3e8ff; color: #6b21a8; }}
    .claim-card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }}
    .meta {{ font-size: 13px; color: #64748b; margin-top: 6px; }}
  </style>
</head>
<body>
  <h1>TRACE Claim Verification Report</h1>
  <p><strong>Job ID:</strong> {job_id}</p>
  <p><strong>Total Claims Analyzed:</strong> {len(claims)}</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <div>
"""
    for c in claims:
        evidence_html = "".join(
            f"<li><strong>Page {e.page} ({e.doc_id}):</strong> <em>\"{e.passage_text}\"</em></li>"
            for e in c.evidence
        )
        if not evidence_html:
            evidence_html = "<li><em>No corroborating evidence detected.</em></li>"

        html_content += f"""
    <div class="claim-card">
      <span class="badge {c.verdict.value}">{c.verdict.value}</span>
      <span style="margin-left: 8px; font-size: 13px; color: #64748b;">Confidence: {int(c.confidence * 100)}% | Type: {c.claim_type} | Rule: {c.rule_id}</span>
      <p style="font-size: 16px; font-weight: 500; margin: 10px 0 6px 0;">"{c.claim_text}"</p>
      <p style="font-size: 14px; color: #334155; margin: 4px 0;"><strong>Reason:</strong> {c.reason}</p>
      <ul style="font-size: 13px; color: #475569; padding-left: 20px;">
        {evidence_html}
      </ul>
    </div>
"""
    html_content += """
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
