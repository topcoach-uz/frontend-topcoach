import { useEffect, useState } from 'react';

export default function useCountdown(initialCount: number) {
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    if (count <= 0) return;

    const timer = setInterval(() => {
      setCount((prevCount) => prevCount - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [count]);

  return { count };
}
