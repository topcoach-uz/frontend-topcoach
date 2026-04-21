import { useEffect, useState } from 'react';

/**
 * Returns a polling interval that pauses while the tab is hidden.
 *
 * Why: every `pollingInterval` in RTK Query keeps firing even when the user
 * has the tab in the background. With half a dozen pollers across the app
 * (chat, sessions, learning progress, mentor stats, SAT course progress) this
 * meant 5–8 background network requests per minute per idle tab. When the
 * user came back the responses all landed at once, triggering a wave of
 * re-renders that felt like a jank spike.
 *
 * Usage:
 *   const interval = useSmartPolling(60_000);
 *   useGetFooQuery(undefined, { pollingInterval: interval, refetchOnFocus: true });
 *
 * `refetchOnFocus: true` makes sure that when the tab regains focus, the
 * query fires once immediately — so the user still gets fresh data without
 * paying for background polling they never saw.
 */
export function useSmartPolling(activeIntervalMs: number): number {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible ? activeIntervalMs : 0;
}
