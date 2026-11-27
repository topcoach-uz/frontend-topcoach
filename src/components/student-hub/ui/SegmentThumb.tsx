import type { CSSProperties } from 'react';
import { useSegmentLens } from 'src/hooks/useSegmentLens';

/** What marks the selected segment, across the student switchers. */
export const SEGMENT_SELECTED = '[aria-selected="true"], [aria-pressed="true"], [aria-current="page"], .is-active';

/**
 * Sliding glass thumb for a segmented row that renders its own buttons
 * (tablists, filter rows). Same motion as ViewTabs and the Settings switcher.
 *
 *   const seg = useSegmentThumb<HTMLDivElement>(activeKey);
 *   <div ref={seg.ref} data-lens={seg.lens} …>
 *     <SegmentThumb style={seg.style} />
 *     …buttons
 *   </div>
 *
 * The thumb only paints inside the student workspace (liquidGlassWorkspace.scss);
 * elsewhere (e.g. counselor views sharing a page) it stays hidden.
 */
export function useSegmentThumb<T extends HTMLElement>(activeKey: unknown) {
  const lens = useSegmentLens<T>(SEGMENT_SELECTED, [activeKey]);
  return {
    ref: lens.ref,
    // Until measured, the selected segment paints its own highlight.
    lens: lens.lensStyle.width != null ? ('on' as const) : undefined,
    style: lens.lensStyle,
  };
}

// Out of the row's flow everywhere, so an unstyled thumb (outside the student
// workspace) can't take up space between segments.
const BASE: CSSProperties = { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' };

export function SegmentThumb({ style }: { style: CSSProperties }) {
  return <span className="tc-seg-thumb" style={{ ...BASE, ...style }} aria-hidden />;
}
