import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { useGetUniversityDetailQuery } from "src/app/services/universities";
import type { CollegeApplication } from "src/app/services/student-hub/types";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { displayApplicantDate } from "./applicantDate";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import "./applicantPages.scss";
import { Breadcrumb } from "./Breadcrumb";
import { ViewTabs } from "src/components/student-hub/ui";

/**
 * The student page shell: page trail, title row and content.
 *
 * - `breadcrumb`: the trail (same children as <Breadcrumb>); rendered above the title.
 * - `eyebrow`: a short label above the title (e.g. "Week 3 of 8").
 * - `titleAddon`: next to the title (e.g. a StatusPill).
 * - `meta`: right side of the heading (e.g. a ProgressBar), before `actions`.
 * Without these props the markup is exactly what it always was.
 */
export function ApplicantPage({
  title,
  subtitle,
  actions,
  eyebrow,
  breadcrumb,
  titleAddon,
  meta,
  children,
  className,
}: {
  className?: string;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumb?: ReactNode;
  titleAddon?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const hasHeading = Boolean(title || subtitle || actions || eyebrow || meta || titleAddon);
  return (
    <section
      className={["applicant-page", className].filter(Boolean).join(" ")}
    >
      {breadcrumb && <Breadcrumb>{breadcrumb}</Breadcrumb>}
      {hasHeading && (
        <header className="applicant-page__heading">
          <div>
            {eyebrow && <span className="applicant-page__eyebrow">{eyebrow}</span>}
            {titleAddon ? (
              <div className="applicant-page__title-row">
                {title && <h1>{title}</h1>}
                {titleAddon}
              </div>
            ) : (
              title && <h1>{title}</h1>
            )}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {meta && <div className="applicant-page__meta">{meta}</div>}
          {actions && <div className="applicant-page__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
export { QueryState } from "./ApplicationQueryState";
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
  const label =
    (preferName ? name : data && getTranslation(data.name)) ||
    name ||
    (data && getTranslation(data.name)) ||
    "University";
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
export function RelatedApplicationLabel({
  application,
}: {
  application: CollegeApplication;
}) {
  const university = useGetUniversityDetailQuery(
    application.universityId ?? "",
    {
      skip: !application.universityId,
    },
  );
  const universityName =
    application.universityName ||
    (university.data ? getTranslation(university.data.name) : undefined);
  const isGraduate = application.degreeLevel === "master";
  const name = isGraduate
    ? application.major || universityName
    : universityName;
  const detail =
    isGraduate && application.major ? universityName : application.major;
  return (
    <span>
      {name || "University"}
      {detail && detail !== name ? ` · ${detail}` : ""}
    </span>
  );
}
export type CollegeListView =
  | "applications"
  | "deadlines"
  | "scholarships"
  | "archived";

/** One switcher for every College List view, so they read as one place. */
export function CollegeListTabs({
  current,
  masters = false,
}: {
  current: CollegeListView;
  masters?: boolean;
}) {
  const views: { key: CollegeListView; label: string; to: string }[] = [
    {
      key: "applications",
      label: masters ? "Programs" : "Applications",
      to: "/student-hub/applications",
    },
    {
      key: "deadlines",
      label: "Deadlines",
      to: "/student-hub/applications?tab=timeline",
    },
    {
      key: "scholarships",
      label: "Scholarships",
      to: "/student-hub/applications?tab=scholarships",
    },
    {
      key: "archived",
      label: "Archived",
      to: "/student-hub/applications?view=archived",
    },
  ];
  return <ViewTabs items={views} value={current} ariaLabel="College List views" />;
}

export { Breadcrumb };
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
