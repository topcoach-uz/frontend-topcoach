import { useEffect, useLayoutEffect, useRef, type DependencyList } from 'react';

// Layout effect in the browser; plain effect when rendered on a server or in
// tests (where useLayoutEffect only logs a warning and does nothing).
const useIsoLayoutEffect =
  typeof window !== 'undefined' && typeof window.document !== 'undefined' ? useLayoutEffect : useEffect;

// Gap between a filled card and the window bottom: the side rail's own margin.
const EDGE = 12;

/**
 * Grow an element so the page ends exactly at the bottom of the window:
 * no gap under it and no page scrollbar. Used by full-width gate cards in the
 * student workspace (Full Support, Study buddies).
 *
 * When it's the last thing on the page it ends on the side rail's bottom line
 * and absorbs the page's trailing padding; when content follows it, it ends
 * where the page padding begins. Either way it works whatever wrappers
 * surround the element. Only applies above `minWidth`; below that the
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

    // Visible content after the box (inside .applicant-content) that the card
    // must stay above. Empty or zero-height siblings don't count.
    const hasContentBelow = () => {
      for (let node: HTMLElement | null = box; node && node !== content; node = node.parentElement) {
        for (let sib = node.nextElementSibling as HTMLElement | null; sib; sib = sib.nextElementSibling as HTMLElement | null) {
          if (sib.getBoundingClientRect().height > 0) return true;
        }
      }
      return false;
    };

    const fit = () => {
      el.style.minHeight = '';
      el.style.marginBottom = '';
      if (window.innerWidth <= minWidth) return;
      const top = box.getBoundingClientRect().top + window.scrollY;
      if (hasContentBelow()) {
        // Something follows the card: end where the page's own padding begins.
        const below = content.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
        const target = Math.floor(window.innerHeight - top - below);
        if (target > el.offsetHeight) el.style.minHeight = `${target}px`;
        return;
      }
      // Last thing on the page: end on the same line as the side rail, EDGE
      // above the window bottom, then take back whatever trailing padding/gap
      // would now push the page past the window (no scrollbar).
      const target = Math.floor(window.innerHeight - EDGE - top);
      if (target <= el.offsetHeight) return;
      el.style.minHeight = `${target}px`;
      const overflow = document.documentElement.scrollHeight - window.innerHeight;
      if (overflow > 0) el.style.marginBottom = `-${overflow}px`;
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
      el.style.marginBottom = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
