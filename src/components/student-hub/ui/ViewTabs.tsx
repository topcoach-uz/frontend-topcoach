import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSegmentLens } from 'src/hooks/useSegmentLens';

export interface ViewTab {
  key: string;
  label: ReactNode;
  /** A route: the tab is a link (views of one place). Without it, a button (in-page filter). */
  to?: string;
  count?: number;
}

const ACTIVE = '[aria-current="page"], [aria-pressed="true"]';

export interface ViewTabsProps {
  items: ViewTab[];
  value: string;
  onChange?: (key: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Changes whenever something that moves the active item changes: the active
 * view, the number of items, or a count appearing on an earlier tab. Used as
 * the thumb's re-measure key.
 */
export function viewTabsSignature(items: ViewTab[], value: string) {
  return `${value}|${items.map((i) => `${i.key}:${i.count ?? ''}`).join(',')}`;
}

/**
 * The workspace segmented switcher: frosted pill track with a white glass thumb
 * that slides to the active view (useSegmentLens). Links when items have `to`,
 * buttons otherwise.
 */
export function ViewTabs({ items, value, onChange, ariaLabel, className }: ViewTabsProps) {
  const signature = viewTabsSignature(items, value);
  const lens = useSegmentLens<HTMLElement>(ACTIVE, [signature]);
  const [track, setTrack] = useState<HTMLElement | null>(null);
  const lensRef = lens.ref;
  const ref = useCallback(
    (el: HTMLElement | null) => {
      lensRef(el);
      setTrack(el);
    },
    [lensRef],
  );

  // A long row scrolls inside its track: keep the active item in view by
  // adjusting only the track's own scroll (never the page).
  useEffect(() => {
    const active = track?.querySelector<HTMLElement>(ACTIVE);
    if (!track || !active) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < track.scrollLeft) track.scrollLeft = left - 8;
    else if (right > track.scrollLeft + track.clientWidth) track.scrollLeft = right - track.clientWidth + 8;
  }, [track, signature]);

  return (
    <nav
      ref={ref}
      className={['applicant-view-tabs', className].filter(Boolean).join(' ')}
      // Until the thumb is measured, the active item paints its own highlight.
      data-lens={lens.lensStyle.width != null ? 'on' : undefined}
      aria-label={ariaLabel}
    >
      <span className="applicant-view-tabs__lens" style={lens.lensStyle} aria-hidden />
      {items.map((item) => {
        const active = item.key === value;
        const label = (
          <>
            {item.label}
            {item.count != null && <span className="tc-tab-count">{item.count}</span>}
          </>
        );
        return item.to ? (
          <Link
            key={item.key}
            to={item.to}
            className={active ? 'is-active' : undefined}
            aria-current={active ? 'page' : undefined}
            onClick={onChange ? () => onChange(item.key) : undefined}
          >
            {label}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            className={active ? 'is-active' : undefined}
            aria-pressed={active}
            onClick={() => onChange?.(item.key)}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
