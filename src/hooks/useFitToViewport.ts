import { useCallback, useLayoutEffect, useState } from 'react';

const inFlow = (style: CSSStyleDeclaration) =>
  style.position !== 'absolute' && style.position !== 'fixed' && style.display !== 'none';

/**
 * What really sits under the element down to the end of the page: each
 * ancestor's bottom padding/border, every bottom margin, and any siblings that
 * stack after it. (Not "document height minus element bottom" — a
 * min-height:100vh shell would count its own empty space and stop the element
 * from ever growing.)
 */
function spaceBelow(el: HTMLElement): number {
  let total = 0;
  let current: HTMLElement | null = el;
  while (current && current.parentElement && current !== document.body) {
    const parent: HTMLElement = current.parentElement;
    const parentStyle = getComputedStyle(parent);
    total += parseFloat(getComputedStyle(current).marginBottom) || 0;
    // Siblings in a flex row sit beside us, not below.
    const stacks = !(parentStyle.display.includes('flex') && !parentStyle.flexDirection.startsWith('column'));
    if (stacks) {
      for (let sib = current.nextElementSibling as HTMLElement | null; sib; sib = sib.nextElementSibling as HTMLElement | null) {
        const style = getComputedStyle(sib);
        if (inFlow(style))
          total += sib.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
      }
    }
    if (parent !== document.body)
      total += (parseFloat(parentStyle.paddingBottom) || 0) + (parseFloat(parentStyle.borderBottomWidth) || 0);
    current = parent;
  }
  return total;
}

/**
 * Sizes an element to exactly the vertical space left in the window, so a
 * full-height surface (e.g. a messenger) never makes the page scroll.
 *
 * Re-measures on window resize and whenever the surrounding layout changes
 * size (e.g. the section panel opening or closing, a heading wrapping).
 */
export function useFitToViewport<T extends HTMLElement>(minHeight = 320) {
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((el: T | null) => setNode(el), []);

  useLayoutEffect(() => {
    if (!node) return;
    // Measured synchronously: ResizeObserver already batches to once per
    // frame, and writing only when the value changes can't loop.
    const fit = () => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      const available = Math.floor(window.innerHeight - top - spaceBelow(node));
      const next = `${Math.max(minHeight, available)}px`;
      if (node.style.height !== next) {
        node.style.minHeight = `${minHeight}px`;
        node.style.height = next;
        node.style.maxHeight = next;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    const observer = new ResizeObserver(fit);
    if (node.parentElement) observer.observe(node.parentElement);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('resize', fit);
      observer.disconnect();
    };
  }, [node, minHeight]);

  return ref;
}
