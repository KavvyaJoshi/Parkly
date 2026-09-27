import { useCallback, useEffect, useEffectEvent, useState } from 'react';

/**
 * Fetch data for a `key` (e.g. a query string) and refetch whenever it changes.
 * Responses for outdated keys are ignored, and the previous data stays available
 * while the next request loads (`isLoading` tells you it's stale).
 */
export function useApiQuery(key, fetcher) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, attempt: -1, data: null, error: null });

  const runFetch = useEffectEvent(() => fetcher());

  useEffect(() => {
    let cancelled = false;
    runFetch()
      .then((data) => {
        if (!cancelled) setResult({ key, attempt, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult((prev) => ({ key, attempt, data: prev.data, error }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const isCurrent = result.key === key && result.attempt === attempt;

  return {
    data: result.data,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
    retry,
  };
}
