import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSegmentLens } from 'src/hooks/useSegmentLens';

export interface ViewTab {
  key: string;
  label: ReactNode;
  /** A route: the tab is a link (views of one place). Without it, a button (in-page filter). */
  to?: string;
  count?: number;
}

export interface ViewTabsProps {
  items: ViewTab[];
  value: string;
  onChange?: (key: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * The workspace segmented switcher: frosted pill track with a white glass thumb
 * that slides to the active view (useSegmentLens). Links when items have `to`,
 * buttons otherwise.
 */
export function ViewTabs({ items, value, onChange, ariaLabel, className }: ViewTabsProps) {
  const lens = useSegmentLens<HTMLElement>('[aria-current="page"], [aria-pressed="true"]', [value, items.length]);
  return (
    <nav
      ref={lens.ref}
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
