import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useGetLatestMm3ReportQuery, useGetMajorMatchStatusQuery } from "src/app/services/student-hub/majorMatchApi";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import { useGetStudentEssaysQuery } from "src/app/services/student-hub/essayManagementApi";
import { useGetDocumentsQuery } from "src/app/services/student-hub/documentManagementApi";
import { useContext } from "react";
import { ApplicantOverviewContext, type OverviewQuery } from "./ApplicantOverviewContext";
import { applicantDegree } from "./applicantOverviewModel";
import { selectNextStep, type NextStepKey } from "./nextStep";

/**
 * One quiet suggestion for what to do next in the application journey. Renders nothing on the page that
 * already is that step, while data is loading, or once every step has been started.
 */
export function NextStepCard({ current }: { current?: NextStepKey }) {
  // Pages like Major Match are also rendered outside the applicant shell (counselor view): show nothing there.
  const overview = useContext(ApplicantOverviewContext);
  return overview ? <NextStepCardContent current={current} overview={overview} /> : null;
}

function NextStepCardContent({ current, overview }: { current?: NextStepKey; overview: OverviewQuery }) {
  const profileId = overview.currentData?.profile?.id ?? "";
  const degree = applicantDegree(overview.currentData?.profile?.targetDegree);
  const needsMatch = degree === "bachelor" && !!profileId;
  const status = useGetMajorMatchStatusQuery(profileId, { skip: !needsMatch });
  const report = useGetLatestMm3ReportQuery(profileId, { skip: !needsMatch });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const essays = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const documents = useGetDocumentsQuery({ page: 1, limit: 100 });
  const completed = !!(report.currentData || status.currentData?.hasCompletedMm3 || status.currentData?.hasCompletedV2 || status.currentData?.hasCompletedLegacy);
  // Only report "no Major Match" once both queries have answered.
  const hasMajorMatch = !needsMatch || completed ? true : status.currentData && report.currentData !== undefined ? false : undefined;
  const next = overview.currentData ? selectNextStep({
    degree,
    hasMajorMatch,
    collegeListCount: applications.data?.data?.length,
    essayCount: essays.data?.data?.length,
    documentCount: documents.data?.data?.length,
  }) : null;
  if (!next || next.key === current) return null;
  return <aside className="applicant-next-step" aria-label="Suggested next step">
    <div>
      <span className="applicant-next-step__eyebrow">Step {next.step} of {next.total}</span>
      <strong>{next.title}</strong>
      <p>{next.body}</p>
    </div>
    <Link className="applicant-next-step__cta" to={next.to}>{next.cta} <ArrowRight size={16} aria-hidden="true" /></Link>
  </aside>;
}
