import { Claim, ClaimReviewRequest, DocumentUploadResponse, AskRequest, AskResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function uploadDocuments(formData: FormData): Promise<DocumentUploadResponse> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  return response.json();
}

export async function reviewClaim(claimId: string, req: ClaimReviewRequest): Promise<Claim> {
  const response = await fetch(`${API_BASE_URL}/claims/${claimId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    throw new Error(`Review update failed: ${response.statusText}`);
  }
  return response.json();
}

export async function askQuestion(req: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    throw new Error(`Ask query failed: ${response.statusText}`);
  }
  return response.json();
}
