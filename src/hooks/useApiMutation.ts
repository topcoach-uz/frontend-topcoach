import { useState, useCallback } from 'react';

interface UseApiMutationReturn<T> {
  mutate: (data: any) => Promise<T | null>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
}

function useApiMutation<T>(
  apiFunction: (data: any) => Promise<T>,
  onSuccess?: (response: T) => void,
  onError?: (error: string) => void
): UseApiMutationReturn<T> {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (data: any): Promise<T | null> => {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setError(null);

      try {
        const response = await apiFunction(data);
        setIsSuccess(true);
        if (onSuccess) onSuccess(response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setIsError(true);
        setError(errorMessage);
        if (onError) onError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  return { mutate, isLoading, isError, isSuccess, error };
}

export default useApiMutation;
