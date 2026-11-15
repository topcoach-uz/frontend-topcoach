import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const ApplicantTopBarContext = createContext<HTMLElement | null>(null);

/** Render the current page trail beside the compact My Journey menu. */
export function ApplicantMobileTrail({ children }: { children: ReactNode }) {
  const target = useContext(ApplicantTopBarContext);

  return target
    ? createPortal(
        <nav className="applicant-mobile-trail" aria-label="Breadcrumb">
          <span className="applicant-mobile-trail__page">{children}</span>
        </nav>,
        target,
      )
    : null;
}
