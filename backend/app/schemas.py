from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class VerdictEnum(str, Enum):
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    UNSUPPORTED = "UNSUPPORTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ReviewStatusEnum(str, Enum):
    NONE = "none"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    OVERRIDDEN = "overridden"


class ReviewActionEnum(str, Enum):
    CONFIRM = "confirm"
    OVERRIDE = "override"
    NEEDS_MORE_EVIDENCE = "needs_more_evidence"


class Evidence(BaseModel):
    doc_id: str
    page: int
    bbox: List[float] = Field(default_factory=list, description="[x0, y0, x1, y1]")
    passage_text: str


class Passage(BaseModel):
    doc_id: str
    page: int
    bbox: List[float] = Field(default_factory=list, description="[x0, y0, x1, y1]")
    text: str
    score: float = 0.0
    section: Optional[str] = None


class Claim(BaseModel):
    claim_id: str
    claim_text: str
    char_start: int
    char_end: int
    claim_type: str
    verdict: VerdictEnum
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    rule_id: str
    evidence: List[Evidence] = Field(default_factory=list)
    review_status: ReviewStatusEnum = ReviewStatusEnum.NONE


class VerdictResult(BaseModel):
    verdict: VerdictEnum
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    rule_id: str
    evidence: List[Evidence] = Field(default_factory=list)


class DocumentUploadResponse(BaseModel):
    job_id: str


class ClaimReviewRequest(BaseModel):
    action: ReviewActionEnum
    new_verdict: Optional[VerdictEnum] = None


class AskRequest(BaseModel):
    question: str
    job_id: str


class AskResponse(BaseModel):
    answer_sentences: List[Claim]
