import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import "./applicantPages.scss";

/** Shared plain-text trail: My journey / Section / Page. */
export function Breadcrumb({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="applicant-breadcrumb" aria-label="Breadcrumb">
        <Link to="/student-hub/overview">My journey</Link>
        <span>/</span>
        {children}
      </nav>
      <ApplicantMobileTrail>{children}</ApplicantMobileTrail>
    </>
  );
}
