import type { ReactNode } from 'react';

export type AcPillVariant =
  | 'mint'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'cyan'
  | 'purple'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'blue';

type Props = {
  variant: AcPillVariant;
  children: ReactNode;
  className?: string;
  /** Renders as a button (e.g. dashboard shortcuts). */
  interactive?: boolean;
  onClick?: () => void;
};

/**
 * Outline “pill” label — matches admin reference (thin border + tinted text, not heavy solid fills).
 */
export function AcPill({ variant, children, className = '', interactive, onClick }: Props) {
  const cls = ['ac-pill', `ac-pill--${variant}`, interactive ? 'ac-pill--interactive' : '', className]
    .filter(Boolean)
    .join(' ');

  if (interactive) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <span className={cls}>{children}</span>;
}
