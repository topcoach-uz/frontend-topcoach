import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigation } from 'react-router-dom';
import styles from './NavigationProgressBar.module.scss';

/**
 * Thin top-of-page progress bar shown during route transitions + lazy-chunk
 * loads. Replaces the "full-page spinner → content flash" pattern with the
 * YouTube/GitHub/Vercel-style navigation feedback users expect from modern SaaS.
 *
 * Design notes:
 * - Ticks up to ~90% while loading, then snaps to 100% and fades out on
 *   completion — matches `nprogress` behavior without pulling in the library.
 * - Ignores in-place location changes (search-param tweaks on the same path)
 *   to avoid flashing on simple filter clicks.
 * - `aria-hidden` so it doesn't fight screen readers.
 */
export default function NavigationProgressBar() {
  const location = useLocation();
  // useNavigation may not exist when using legacy <Router> API — guard.
  let navigationState: string | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigationState = useNavigation().state;
  } catch {
    navigationState = null;
  }

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastPathRef = useRef(location.pathname);

  const start = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setProgress(8);
    setVisible(true);

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p; // hold at 90% until complete
        const remaining = 90 - p;
        // Ease-out: larger jumps early, smaller as we approach 90%.
        return Math.min(90, p + Math.max(1, remaining / 8));
      });
    }, 120);
  };

  const complete = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  // React Router 6.4+ navigation state — fires during loader/action transitions.
  useEffect(() => {
    if (navigationState === 'loading' || navigationState === 'submitting') {
      start();
    } else if (navigationState === 'idle') {
      complete();
    }
  }, [navigationState]);

  // Fallback path-based detector (works when RouterProvider isn't used).
  useEffect(() => {
    if (location.pathname !== lastPathRef.current) {
      lastPathRef.current = location.pathname;
      start();
      // Most lazy chunks + cached queries resolve within a frame or two.
      // Give the UI ~350ms to settle, then finish the bar. If an actual
      // loader takes longer, the navigationState effect above keeps it going.
      const t = window.setTimeout(complete, 350);
      return () => window.clearTimeout(t);
    }
  }, [location.pathname]);

  useEffect(
    () => () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    },
    [],
  );

  return (
    <div
      className={`${styles.bar} ${visible ? styles.visible : ''}`}
      aria-hidden="true"
    >
      <div className={styles.fill} style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
