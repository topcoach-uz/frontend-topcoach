import type { ReactNode } from "react";
import { Alert, Button, Skeleton } from "antd";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useGetUniversityDetailQuery } from "src/app/services/universities";
import type { CollegeApplication } from "src/app/services/student-hub/types";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { displayApplicantDate } from "./applicantDate";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import "./applicantPages.scss";

export function ApplicantPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="applicant-page">
      {(title || subtitle || actions) && (
        <header className="applicant-page__heading">
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="applicant-page__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
export function QueryState({
  loading,
  error,
  retry,
  children,
}: {
  loading?: boolean;
  error?: boolean;
  retry: () => unknown;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="applicant-panel">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message="We couldn’t finish that request."
        description="Your saved information is unchanged. Please try again."
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
  return <>{children}</>;
}
export function UniversityIdentity({
  id,
  name,
  subtitle,
  preferName = false,
}: {
  id?: string;
  name?: string;
  subtitle?: string;
  preferName?: boolean;
}) {
  const { data } = useGetUniversityDetailQuery(id ?? "", { skip: !id });
  const label = (preferName ? name : data && getTranslation(data.name)) || name || (data && getTranslation(data.name)) || "University";
  return (
    <div className="applicant-university">
      <span className="applicant-university__logo">
        {data?.media?.[0]?.url ? (
          <img src={data.media[0].url} alt="" />
        ) : (
          <Building2 size={26} aria-hidden />
        )}
      </span>
      <div>
        <strong>{label}</strong>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
export function RelatedApplicationLabel({ application }: { application: CollegeApplication }) {
  const university = useGetUniversityDetailQuery(application.universityId ?? "", {
    skip: !application.universityId,
  });
  const universityName = application.universityName ||
    (university.data ? getTranslation(university.data.name) : undefined);
  const isGraduate = application.degreeLevel === "master";
  const name = isGraduate ? application.major || universityName : universityName;
  const detail = isGraduate && application.major ? universityName : application.major;
  return <span>{name || "University"}{detail && detail !== name ? ` · ${detail}` : ""}</span>;
}
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
export const displayDate = displayApplicantDate;
export const applicationStatusLabels: Record<string, string> = {
  researching: "Saved for later",
  applying: "Preparing",
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Not accepted",
  waitlisted: "Waitlisted",
  deferred: "Deferred",
};
export function applicationTitle(app: {
  universityName?: string;
  major?: string;
}) {
  return app.universityName || app.major || "Application";
}
