import { useCallback, useEffect, useRef, useState } from 'react';

interface UseApiReturn<T> {
  response: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  shouldFetch: boolean = true // Add a flag to control fetching
): UseApiReturn<T> {
  const [res, setRes] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiFnRef = useRef(apiFunction);
  apiFnRef.current = apiFunction;

  const fetchData = useCallback(async () => {
    if (!shouldFetch) return; // Skip fetching if the flag is false
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setRes(null);

    try {
      const response = await apiFunction();
      setRes(response);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, shouldFetch]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { response: res, isLoading, isError, error, refetch: fetchData };
}

export default useApi;
