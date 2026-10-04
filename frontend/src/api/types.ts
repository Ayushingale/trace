export type Verdict = 'SUPPORTED' | 'CONTRADICTED' | 'UNSUPPORTED' | 'NEEDS_REVIEW';

export type ReviewStatus = 'none' | 'pending' | 'confirmed' | 'overridden';

export type ReviewAction = 'confirm' | 'override' | 'needs_more_evidence';

export interface Evidence {
  doc_id: string;
  page: number;
  bbox: [number, number, number, number] | number[];
  passage_text: string;
}

export interface Passage {
  doc_id: string;
  page: number;
  bbox: [number, number, number, number] | number[];
  text: string;
  score: number;
  section?: string | null;
}

export interface Claim {
  claim_id: string;
  claim_text: string;
  char_start: number;
  char_end: number;
  claim_type: string;
  verdict: Verdict;
  confidence: number; // 0..1 calibrated
  reason: string;
  rule_id: string;
  evidence: Evidence[];
  review_status: ReviewStatus;
}

export interface DocumentUploadResponse {
  job_id: string;
}

export interface ClaimReviewRequest {
  action: ReviewAction;
  new_verdict?: Verdict;
}

export interface AskRequest {
  question: string;
  job_id: string;
}

export interface AskResponse {
  answer_sentences: Claim[];
}
