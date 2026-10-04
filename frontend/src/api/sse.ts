import { Claim } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function connectClaimStream(
  jobId: string,
  onClaim: (claim: Claim) => void,
  onDone: (summary: any) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE_URL}/jobs/${jobId}/stream`);

  eventSource.addEventListener('claim', (event) => {
    try {
      const data = JSON.parse(event.data);
      onClaim(data);
    } catch (err) {
      console.error('Failed to parse claim event:', err);
    }
  });

  eventSource.addEventListener('done', (event) => {
    try {
      const data = JSON.parse(event.data);
      onDone(data);
    } catch (err) {
      console.error('Failed to parse done event:', err);
    } finally {
      eventSource.close();
    }
  });

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
