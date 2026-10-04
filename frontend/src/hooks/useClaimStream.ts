import { useState, useEffect } from 'react';
import { Claim } from '../api/types';
import { connectClaimStream } from '../api/sse';

export function useClaimStream(jobId?: string) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!jobId) return;
    setClaims([]);
    setIsDone(false);
    setError(null);

    const close = connectClaimStream(
      jobId,
      (newClaim) => {
        setClaims((prev) => [...prev, newClaim]);
      },
      () => {
        setIsDone(true);
      },
      (err) => {
        setError(err);
      }
    );

    return () => {
      close();
    };
  }, [jobId]);

  return { claims, isDone, error };
}
