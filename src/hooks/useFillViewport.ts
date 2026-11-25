import { useEffect, useLayoutEffect, useRef, type DependencyList } from 'react';

// Layout effect in the browser; plain effect when rendered on a server or in
// tests (where useLayoutEffect only logs a warning and does nothing).
const useIsoLayoutEffect =
  typeof window !== 'undefined' && typeof window.document !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Grow an element so the page ends exactly at the bottom of the window:
 * no gap under it and no page scrollbar. Used by full-width gate cards in the
 * student workspace (Full Support, Study buddies).
 *
 * It measures its own position (top of the element, plus whatever padding or
 * wrappers sit below it inside `.applicant-content`), so it works whatever
 * wrappers surround the element. Only applies above `minWidth`; below that the
 * element keeps its natural height. Pass `deps` that change the element's
 * content so it re-fits after loading states.
 */
export function useFillViewport<T extends HTMLElement>(deps: DependencyList, minWidth = 900) {
  const ref = useRef<T>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    // The parent box has the same bounds but is never scaled by an entrance animation.
    const box = el?.parentElement;
    const content = el?.closest<HTMLElement>('.applicant-content');
    if (!el || !box || !content) return;

    const fit = () => {
      el.style.minHeight = '';
      if (window.innerWidth <= minWidth) return;
      const top = box.getBoundingClientRect().top + window.scrollY;
      const below = content.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
      const target = Math.floor(window.innerHeight - top - below);
      if (target > el.offsetHeight) el.style.minHeight = `${target}px`;
    };

    fit();
    // Window height changes, plus width changes such as folding the side panel.
    const observer = new ResizeObserver(fit);
    observer.observe(content);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
      el.style.minHeight = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
