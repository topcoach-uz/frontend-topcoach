import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import styles from '../PlacementTest.module.scss';

type Props = {
  /** Total seconds to count down from. Stable between renders for a given attempt. */
  totalSeconds: number;
  /** Called once when the timer hits zero. */
  onExpire: () => void;
  /** Below this many seconds remaining, the timer renders in warn colors. */
  warnAt?: number;
};

/**
 * Editorial countdown chip. Renders mm:ss, ticks once per second, calls
 * `onExpire` exactly once at zero. We intentionally use a ref for the
 * expire callback so updating it across renders doesn't restart the
 * interval.
 */
export function Timer({ totalSeconds, onExpire, warnAt = 60 }: Props) {
  const [remaining, setRemaining] = useState<number>(totalSeconds);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(totalSeconds);
    firedRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          if (!firedRef.current) {
            firedRef.current = true;
            // Defer so we don't fire onExpire mid-render.
            window.setTimeout(() => onExpireRef.current(), 0);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(1, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');

  return (
    <span
      className={`${styles.timer} ${
        remaining <= warnAt ? styles.timerLow : ''
      }`}
      aria-live="polite"
      aria-label={`Time remaining: ${mm} minutes ${ss} seconds`}
    >
      <Clock size={13} />
      {mm}:{ss}
    </span>
  );
}
