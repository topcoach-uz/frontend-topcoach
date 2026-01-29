import { useState, useEffect } from 'react';
import { api } from 'src/app/api';

export function useCounselorStatus(skip?: boolean): { isCounselor: boolean; isLoading: boolean } {
  const [isCounselor, setIsCounselor] = useState(false);
  const [isLoading, setIsLoading] = useState(!skip);

  useEffect(() => {
    if (skip) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    api
      .request({ path: '/organizations/my-organizations', method: 'GET', secure: true })
      .then((res: any) => {
        if (!cancelled) {
          setIsCounselor(Array.isArray(res?.data) && res.data.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setIsCounselor(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skip]);

  return { isCounselor, isLoading };
}
