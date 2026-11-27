import { useCallback, useLayoutEffect, useState, type CSSProperties, type DependencyList } from 'react';

/**
 * iOS-style segmented control "thumb": measures the active segment inside a
 * container and returns the style for a glass lens that slides between
 * segments. The lens is placed instantly on first paint and animated after.
 *
 * Usage: pass `ref` to the container (position: relative) and render
 * `<span className="…lens" style={lensStyle} aria-hidden />` as its first child.
 * A callback ref is used so a container that mounts late (after a loading
 * state) is still measured.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function useSegmentLens<T extends HTMLElement>(activeSelector: string, deps: DependencyList) {
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((el: T | null) => setNode(el), []);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => {
      const active = node.querySelector<HTMLElement>(activeSelector);
      if (!active || active.offsetWidth === 0) {
        setRect(null);
        return;
      }
      setRect({ x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight });
    };
    measure();
    // Enable the slide only after the first placement has painted. A timer
    // backs up rAF, which browsers pause for background tabs.
    const frame = requestAnimationFrame(() => setReady(true));
    const timer = window.setTimeout(() => setReady(true), 80);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, activeSelector, ...deps]);

  const lensStyle: CSSProperties = rect
    ? {
        width: rect.w,
        height: rect.h,
        transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
        transition:
          ready && !prefersReducedMotion() ? `transform 460ms ${EASE}, width 460ms ${EASE}` : 'none',
      }
    : { opacity: 0 };

  return { ref, lensStyle };
}
