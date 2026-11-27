import type { ReactNode } from 'react';
import { useFillViewport } from 'src/hooks/useFillViewport';

export interface GateCardProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Actions, a checkbox, a form: anything under the description. */
  children?: ReactNode;
  /** The blush right column (what's included, the rules, the benefits). */
  aside?: ReactNode;
  asideTitle?: ReactNode;
  /** Grow to fill the window under the header (default). */
  fill?: boolean;
  ariaLabel?: string;
}

/**
 * Full-width two-column card for locked or not-yet-started areas (Full Support,
 * Study Buddies, previews). Stacks when the card is narrower than 820px.
 */
export function GateCard({ eyebrow, title, description, children, aside, asideTitle, fill = true, ariaLabel }: GateCardProps) {
  const ref = useFillViewport<HTMLElement>([fill, Boolean(aside)]);
  return (
    <section ref={fill ? ref : undefined} className="tc-gate" aria-label={ariaLabel}>
      <div className="tc-gate__grid">
        <div className="tc-gate__main">
          {eyebrow && <span className="tc-gate__eyebrow">{eyebrow}</span>}
          <h1 className="tc-gate__title">{title}</h1>
          {description && <p className="tc-gate__description">{description}</p>}
          {children && <div className="tc-gate__body">{children}</div>}
        </div>
        {aside && (
          <aside className="tc-gate__aside">
            {asideTitle && <p className="tc-gate__aside-title">{asideTitle}</p>}
            {aside}
          </aside>
        )}
      </div>
    </section>
  );
}
