import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface ListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /**
   * Trailing content (a pill, a date, a chevron). When `to` or `onClick` is set
   * the whole row is interactive, so `trailing` must not contain buttons or links.
   */
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}

/** A list row: leading icon/avatar, title and meta, trailing info. A link, a button or static. */
export function ListRow({ leading, title, meta, trailing, to, onClick, className }: ListRowProps) {
  const cls = ['tc-row', leading ? null : 'tc-row--no-leading', className].filter(Boolean).join(' ');
  const content = (
    <>
      {leading && <span className="tc-row__leading">{leading}</span>}
      <span className="tc-row__titles">
        <span className="tc-row__title">{title}</span>
        {meta && <span className="tc-row__meta">{meta}</span>}
      </span>
      {trailing && <span className="tc-row__trailing">{trailing}</span>}
    </>
  );
  if (to) {
    return (
      <Link className={cls} to={to}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}
