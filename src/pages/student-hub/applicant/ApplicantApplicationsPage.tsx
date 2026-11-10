import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { useGetUndergraduateDegreesQuery } from 'src/app/services/undergraduateDegreesApi';
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Select, Tooltip, message } from "antd";
import { Archive, ArrowRight, ArrowUpRight, Plus, ClipboardList, Building2, FileText, ListChecks, ExternalLink } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  useGetArchivedCollegeApplicationsQuery,
  useArchiveCollegeApplicationMutation,
  useRestoreCollegeApplicationMutation,
  useGetCollegeApplicationsQuery,
  useGetCollegeApplicationQuery,
  useGetApplicationTasksQuery,
  useGetScholarshipApplicationsQuery,
  useUpdateCollegeApplicationMutation,
} from "src/app/services/student-hub/applicationTrackingApi";
import { useGetMenteeTasksQuery, useGetMenteePipelineQuery } from 'src/app/services/fullSupportApi';
import { buildApplicationMilestones } from './applicationMilestones';
import { getMentorFeedbackText } from './essayFeedbackModel';
import { useGetStudentEssaysQuery } from "src/app/services/student-hub/essayManagementApi";
import type { CollegeApplication } from "src/app/services/student-hub/types";
import { useGetGraduateProgramQuery, type GraduateProgramFact } from "src/app/services/graduateProgramsApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  UniversityIdentity,
  displayDate,
  applicationStatusLabels,
  applicationTitle,
} from "./ApplicantPage";
import ScholarshipManagement from "./ScholarshipManagement";
import ApplicationRequirements from './ApplicationRequirements';
import ApplicationMentor from './ApplicationMentor';
import ApplicationTimeline from "../applications/components/ApplicationTimeline";
import { useApplicantOverview } from "./ApplicantOverviewContext";

export default function ApplicantApplicationsPage() {
  const [listParams, setListParams] = useSearchParams();
  const showArchived = listParams.get("view") === "archived";
  const archived = useGetArchivedCollegeApplicationsQuery(undefined, { skip: !showArchived });
  const [archive, archiveState] = useArchiveCollegeApplicationMutation();
  const [restore, restoreState] = useRestoreCollegeApplicationMutation();
  const page = Math.max(1, Number(listParams.get("page")) || 1);
  const query = useGetCollegeApplicationsQuery({ page, limit: 100 }, {pollingInterval:10000,refetchOnMountOrArgChange:true,refetchOnFocus:true});
  // Comparison uses a stable query independent of the list URL's page parameter.
  // The current backend returns all applications for the signed-in profile.
  const allApplicationsQuery = useGetCollegeApplicationsQuery({ page: 1, limit: 100 }, {pollingInterval:10000,refetchOnFocus:true});
  const tasks = useGetApplicationTasksQuery({ page: 1, limit: 100 }, { pollingInterval: 10000 });
  const navigate = useNavigate();
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const applications = query.data?.data ?? [];
  const active = applications.filter((app) => app.status !== "researching");
  const saved = applications.filter((app) => app.status === "researching");
  const showTimeline = listParams.get("tab") === "timeline";
  const showScholarships = listParams.get("tab") === "scholarships";
  const scholarships = useGetScholarshipApplicationsQuery({ page: 1, limit: 100 }, { skip: !showTimeline && !showScholarships, pollingInterval: 10000 });
  const assignedTasks = useGetMenteeTasksQuery(undefined, { skip: !showTimeline, pollingInterval: 10000 });
  const mentorPlans = useGetMenteePipelineQuery(undefined, { pollingInterval: 10000 });
  const comparedIds = (listParams.get("compare") ?? "")
    .split(",")
    .filter(Boolean);
  const comparedPrograms = (allApplicationsQuery.data?.data ?? []).filter((app) =>
    comparedIds.includes(app.id),
  );
  const compareMode = listParams.get("view") === "compare";
  const shortlistMode = isMasters && listParams.get("view") === "shortlist";
  const toggleComparison = (id: string, checked: boolean) => {
    const next = new URLSearchParams(listParams);
    const ids = checked
      ? [...new Set([...comparedIds, id])]
      : comparedIds.filter((item) => item !== id);
    ids.length ? next.set("compare", ids.join(",")) : next.delete("compare");
    setListParams(next);
  };
  const milestones = buildApplicationMilestones(applications, tasks.data?.data ?? [], scholarships.data?.data ?? [], assignedTasks.data?.data ?? [], mentorPlans.data?.data ?? []);
  const selectedMilestone = milestones.find(item => item.id === listParams.get('milestone'));
  const row = (app: CollegeApplication) => {
    const nextTask = tasks.data?.data
      .filter(
        (task) =>
          task.collegeApplicationId === app.id && !["completed", "cancelled"].includes(task.status),
      )
      .sort((a, b) =>
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
      )[0];
    return (
      <div className="applicant-list__row" key={app.id}>
        <UniversityIdentity
          id={app.universityId}
          name={isMasters ? app.major || app.universityName : app.universityName}
          preferName={isMasters}
          subtitle={(isMasters
            ? [app.universityName, "Master’s"]
            : [
                app.major,
                app.degreeLevel === "master"
                  ? "Master’s"
                  : app.degreeLevel === "bachelor"
                    ? "Bachelor’s"
                    : undefined,
              ])
            .filter(Boolean)
            .join(" · ")}
        />
        <div className="applicant-list__cell">
          <span className={`applicant-list__status applicant-list__status--${app.status}`}>
            {applicationStatusLabels[app.status] ?? app.status}
          </span>
          <small>Planning deadline · {displayDate(app.deadline)}</small>
        </div>
        <div className="applicant-list__cell">
          {tasks.isError ? (
            <small>Tasks unavailable</small>
          ) : nextTask ? (
            <>
              <span>{nextTask.title}</span>
              <small>
                {nextTask.dueDate
                  ? `Planned for ${displayDate(nextTask.dueDate)}`
                  : "No planned date"}
              </small>
            </>
          ) : (
            <small>
              {tasks.isLoading ? "Loading tasks…" : "No planned task"}
            </small>
          )}
        </div>
        <div className="applicant-list__actions">
          {isMasters && app.status === "researching" && (
            <Checkbox
              checked={comparedIds.includes(app.id)}
              onChange={(event) => toggleComparison(app.id, event.target.checked)}
            >
              Compare
            </Checkbox>
          )}
          <Tooltip title="Archive">
            <Button
              className="applicant-list__icon-btn"
              shape="circle"
              aria-label={`Archive ${applicationTitle(app)}`}
              icon={<Archive size={16} />}
              loading={archiveState.isLoading && archiveState.originalArgs === app.id}
              onClick={() => Modal.confirm({
                title: 'Archive this application?',
                content: 'The application and its linked planning tasks will leave active lists and the timeline. Writing and documents stay saved. You can restore it from Archived applications.',
                okText: 'Archive application',
                onOk: async () => { try { await archive(app.id).unwrap(); message.success('Application archived.'); } catch { message.error('Could not archive this application.'); throw new Error('Archive failed'); } },
              })}
            />
          </Tooltip>
          <Tooltip title="Open workspace">
            <Button
              className="applicant-list__icon-btn"
              shape="circle"
              type={app.status === "researching" ? "default" : "primary"}
              aria-label={`Open workspace for ${applicationTitle(app)}`}
              icon={<ArrowUpRight size={17} />}
              onClick={() =>
                navigate(`/student-hub/applications/${encodeURIComponent(app.id)}`)
              }
            />
          </Tooltip>
        </div>
      </div>
    );
  };
  if (showScholarships) return <ScholarshipManagement />;
  if (showArchived) return <ApplicantPage title="Archived applications" subtitle="Restore an application to resume planning. Writing and documents are retained." actions={<Button onClick={() => navigate('/student-hub/applications')}>View active applications</Button>}>
    <QueryState loading={archived.isLoading} error={archived.isError} retry={archived.refetch}>
      {!archived.data?.data.length ? <p>No archived applications.</p> : archived.data.data.map(app => <div className="applicant-panel" key={app.id}>
        <UniversityIdentity id={app.universityId} name={app.universityName} subtitle={app.major} />
        <p>{applicationStatusLabels[app.status] ?? app.status}</p>
        <Button loading={restoreState.isLoading} onClick={async () => {
          try { await restore(app.id).unwrap(); message.success('Application restored with its planning tasks.'); }
          catch { message.error('Could not restore this application. Please try again.'); }
        }}>Restore application</Button>
      </div>)}
    </QueryState>
  </ApplicantPage>;
  if (showTimeline) {
    return (
      <ApplicantPage
        title="Deadline timeline"
        subtitle="Application deadlines and planned tasks, ordered by date."
        actions={<Button onClick={() => navigate("/student-hub/applications")}>View applications</Button>}
      >
        <Breadcrumb>Timeline</Breadcrumb>
        <QueryState
          loading={query.isLoading || tasks.isLoading || scholarships.isLoading || assignedTasks.isLoading || mentorPlans.isLoading}
          error={query.isError || tasks.isError || scholarships.isError || assignedTasks.isError || mentorPlans.isError}
          retry={() => { query.refetch(); tasks.refetch(); scholarships.refetch(); assignedTasks.refetch(); mentorPlans.refetch(); }}
        >
          {milestones.length ? (
            <div className="applicant-panel">
              {milestones.map((milestone) => (
                <div key={milestone.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, borderBottom: "1px solid #e7e2dc", padding: "12px 0" }}>
                  <strong style={{ minWidth: 120 }}>{displayDate(milestone.date)}</strong>
                  <div style={{ flex: "1 1 220px" }}><strong>{milestone.title}</strong><small style={{ display: "block" }}>{milestone.detail}</small></div>
                  <Link to={milestone.path}>View details →</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="applicant-panel applicant-empty">
              <ClipboardList size={36} />
              <h2>No deadlines yet.</h2>
              <p>Add an application deadline or a dated task to see it here.</p>
              <Button onClick={() => navigate("/student-hub/applications/new")}>Add application</Button>
            </div>
          )}
        </QueryState>
        <Modal title={selectedMilestone?.title} open={!!selectedMilestone} footer={null} onCancel={() => { const next = new URLSearchParams(listParams); next.delete('milestone'); setListParams(next); }}>
          <p>{selectedMilestone?.detail}</p><p>Deadline: {displayDate(selectedMilestone?.date)}</p>
          {selectedMilestone?.notes && <p>{selectedMilestone.notes}</p>}
        </Modal>
      </ApplicantPage>
    );
  }
  if (isMasters && compareMode) {
    return (
      <ApplicantPage
        title="Compare graduate programs"
        subtitle="Compare the details you have saved. Institution facts are clearly separated from program-specific information."
        actions={<Button onClick={() => { const next = new URLSearchParams(listParams); next.delete("view"); setListParams(next); }}>Back to program list</Button>}
      >
        <Breadcrumb>Programs <span>/</span> Compare</Breadcrumb>
        {!comparedPrograms.length ? (
          <div className="applicant-panel applicant-empty">
            <ClipboardList size={36} />
            <h2>No saved programs selected.</h2>
            <p>Select two or more programs from your saved list to compare them.</p>
            <Button onClick={() => { const next = new URLSearchParams(listParams); next.delete("view"); setListParams(next); }}>View saved programs</Button>
          </div>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              message="Comparison uses verified program records and your saved details"
              description="A field marked “Verification needed” is absent from the program record. Use the official source before applying."
            />
            <div className="applicant-stack" style={{ marginTop: 16 }}>
              {comparedPrograms.map((app) => <GraduateComparisonCard key={app.id} app={app} onOpen={() => navigate(`/student-hub/applications/${encodeURIComponent(app.id)}`)} onRemove={() => toggleComparison(app.id, false)} />)}
            </div>
          </>
        )}
      </ApplicantPage>
    );
  }
  if (shortlistMode) {
    return (
      <ApplicantPage
        title="Your shortlist"
        subtitle="Programs you have saved to consider. Open a workspace when you are ready to plan an application."
        actions={<Button onClick={() => navigate("/student-hub/applications")}>View applications</Button>}
      >
        <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}>
          {saved.length ? (
            <div className="applicant-panel applicant-list">{saved.map(row)}</div>
          ) : (
            <div className="applicant-panel applicant-empty">
              <Building2 size={36} />
              <h2>Your shortlist is empty.</h2>
              <p>Explore programs and save the ones you want to revisit.</p>
              <Button type="primary" onClick={() => navigate("/student-hub/universities")}>Explore programs <ArrowRight size={16} /></Button>
            </div>
          )}
        </QueryState>
      </ApplicantPage>
    );
  }
  return (
    <ApplicantPage
      title={isMasters ? "Your graduate programs" : "Your applications"}
      subtitle={isMasters ? "Track each program’s requirements, deadlines and materials in one place." : "Keep your next steps, materials and progress in one place."}
      actions={isMasters && !applications.length ? (
        <Button onClick={() => navigate("/student-hub/applications?view=shortlist")}>View shortlist <ArrowRight size={16} /></Button>
      ) : applications.length > 0 ? (
        <Button
          onClick={() => navigate("/student-hub/applications/new")}
          icon={<Plus size={16} />}
        >
          Add application
        </Button>
      ) : undefined}
    >
      <div className="applicant-actions"><Link to="/student-hub/applications?tab=timeline">View deadlines →</Link><Button onClick={() => navigate("/student-hub/applications?view=archived")}>Archived applications</Button><Link to="/student-hub/applications?tab=scholarships">Manage scholarships</Link></div>
      {mentorPlans.isError && <Alert type="warning" message="Mentor plans are temporarily unavailable." action={<Button onClick={() => void mentorPlans.refetch()}>Retry</Button>} />}
      {!!mentorPlans.data?.data.length && <details className="applicant-panel" aria-label="Earlier mentor notes">
        <summary>Earlier mentor notes</summary><p>These older notes are awaiting review by your application mentor. Once converted, they appear in your application list.</p>
        {mentorPlans.data.data.map(plan => <div key={plan.id} className="applicant-list__row"><strong>{plan.program}</strong><span>{plan.stage} · {plan.status}</span><span>{displayDate(plan.deadline)}</span></div>)}
      </details>}
      {!isMasters && <Breadcrumb>College List</Breadcrumb>}
      <QueryState
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!applications.length && isMasters ? (
          <MasterApplicationsEmpty />
        ) : !applications.length ? (
          <div className="applicant-panel applicant-empty">
            <ClipboardList size={36} />
            <h2>{isMasters ? "Your graduate program list starts here." : "Your applications start here."}</h2>
            <p>
              {isMasters
                ? "Find a graduate program and track its requirements, deadlines and tasks here."
                : "Explore your options and add your first university. Track deadlines, writing and tasks in one place."}
            </p>
            <div className="applicant-actions">
              <Button
                type="primary"
                onClick={() => navigate("/student-hub/universities")}
              >
                {isMasters ? "Find programs" : "Find universities"} <ArrowRight size={16} />
              </Button>
              <Button onClick={() => navigate("/student-hub/applications/new")}>
                Add an application
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="applicant-page__heading">
              <h3>{active.length} {isMasters ? "program applications" : "applications"} in preparation on this page</h3>
              <Link to="/student-hub/applications?tab=scholarships">Scholarships →</Link>

            </div>
            {!!active.length && (
              <div className="applicant-panel applicant-list">
                <div className="applicant-list__head">
                  <span>{isMasters ? "PROGRAM & UNIVERSITY" : "UNIVERSITY & PROGRAM"}</span>
                  <span>STATUS</span>
                  <span>NEXT TASK</span>
                  <span>ACTION</span>
                </div>
                {active.map(row)}
              </div>
            )}
            {!!saved.length && (
              <>
                <div className="applicant-page__heading">
                  <h2>Saved {isMasters ? "programs" : "universities"} · {saved.length}</h2>
                  {isMasters && comparedIds.length >= 2 && (
                    <Button type="primary" onClick={() => { const next = new URLSearchParams(listParams); next.set("view", "compare"); setListParams(next); }}>
                      Compare selected ({comparedIds.length})
                    </Button>
                  )}
                </div>
                <div className="applicant-panel applicant-list">
                  {saved.map(row)}
                </div>
              </>
            )}
            {(query.data?.totalPages ?? 1) > 1 && (
              <div className="applicant-actions applicant-actions--end">
                <Button
                  disabled={page <= 1}
                  onClick={() => {
                    const next = new URLSearchParams(listParams);
                    next.set("page", String(page - 1));
                    setListParams(next);
                  }}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {query.data?.totalPages}
                </span>
                <Button
                  disabled={page >= (query.data?.totalPages ?? 1)}
                  onClick={() => {
                    const next = new URLSearchParams(listParams);
                    next.set("page", String(page + 1));
                    setListParams(next);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
            <p>
              Submit through the university’s official platform. Manage your
              preparation here.
            </p>
          </>
        )}
      </QueryState>
    </ApplicantPage>
  );
}

function MasterApplicationsEmpty() {
  return (
    <div className="applicant-master-empty">
      <section className="applicant-master-empty__hero" aria-labelledby="applications-empty-title">
        <div className="applicant-master-empty__hero-copy">
          <span className="applicant-master-empty__eyebrow">Your application workspace</span>
          <h2 id="applications-empty-title">No applications yet</h2>
          <p>Choose a university to create your first workspace.<br />Add your program and plan what comes next.</p>
          <div className="applicant-master-empty__actions">
            <Link className="applicant-master-empty__primary" to="/student-hub/applications/new">Start an application <ArrowRight size={17} /></Link>
            <Link className="applicant-master-empty__secondary" to="/student-hub/universities">Explore programs <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="applicant-master-empty__illustration" aria-hidden="true">
          <span className="applicant-master-empty__illustration-halo" />
          <span className="applicant-master-empty__sheet applicant-master-empty__sheet--back"><span /><span /><span /></span>
          <span className="applicant-master-empty__sheet applicant-master-empty__sheet--front"><span /><span /><span /></span>
          <span className="applicant-master-empty__folder"><FileText size={24} /><span><i /><i /></span></span>
          <span className="applicant-master-empty__plus"><Plus size={27} strokeWidth={1.8} /></span>
          <small>A workspace for every application</small>
        </div>
      </section>
      <section className="applicant-master-empty__steps" aria-labelledby="applications-steps-title">
        <h2 id="applications-steps-title">From your first choice to your next step</h2>
        <div className="applicant-master-empty__step-grid">
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta"><span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--choice"><Building2 size={18} /></span>01 · Choose</span>
            <h3>Choose your university</h3>
            <p>Start a workspace for the university and program you want to apply to.</p>
          </article>
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta"><span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--prepare"><FileText size={18} /></span>02 · Prepare</span>
            <h3>Prepare your materials</h3>
            <p>Keep your drafts, documents and application tasks together.</p>
          </article>
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta"><span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--track"><ListChecks size={18} /></span>03 · Track</span>
            <h3>Track your next steps</h3>
            <p>Record deadlines and update your application status as you go.</p>
          </article>
        </div>
      </section>
      <aside className="applicant-master-empty__notice">
        <span className="applicant-master-empty__notice-icon"><ExternalLink size={19} /></span>
        <span><strong>Prepare here. Submit through the university.</strong><small>Creating a workspace does not send an application. Use the university’s official platform to submit.</small></span>
      </aside>
    </div>
  );
}

const programFact = (fact: GraduateProgramFact | undefined) => !fact || !Object.keys(fact).length
  ? "Verification needed"
  : Object.entries(fact).map(([key, value]) => `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join(" · ");

function GraduateComparisonCard({ app, onOpen, onRemove }: { app: CollegeApplication; onOpen: () => void; onRemove: () => void }) {
  const program = useGetGraduateProgramQuery(app.programId ?? "", { skip: !app.programId });
  const verified = program.data;
  return <div className="applicant-panel applicant-program-comparison">
    <UniversityIdentity id={app.universityId} name={verified?.programName || app.major || app.universityName} preferName subtitle={verified?.university.name ? getTranslation(verified.university.name) : app.universityName} />
    {program.isError && <Alert type="warning" message="Verified program facts are temporarily unavailable." />}
    <dl className="applicant-facts">
      <dt>Intake</dt><dd>{verified?.intake || app.intake || "Verification needed"}</dd>
      <dt>Deadline</dt><dd>{verified?.deadline ? displayDate(verified.deadline) : displayDate(app.deadline)}</dd>
      <dt>Eligibility</dt><dd>{programFact(verified?.eligibility)}</dd>
      <dt>Language evidence</dt><dd>{programFact(verified?.languageEvidence)}</dd>
      <dt>Funding</dt><dd>{programFact(verified?.funding)}</dd>
      <dt>Platform</dt><dd>{app.applicationType || "Not set"}</dd>
      <dt>Your fit notes</dt><dd>{app.whyThisSchool || "Not added"}</dd>
    </dl>
    <div className="applicant-actions"><Button onClick={onOpen}>Open workspace</Button><Button onClick={onRemove}>Remove</Button></div>
  </div>;
}

export function ApplicantApplicationPage() {
  const { applicationId = "" } = useParams();
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const query = useGetCollegeApplicationQuery(applicationId, {
    skip: !applicationId,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const tasks = useGetApplicationTasksQuery({ page: 1, limit: 100 });
  const essays = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const [update, { isLoading: saving }] = useUpdateCollegeApplicationMutation();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<CollegeApplication["status"]>();
  const [notes, setNotes] = useState("");
  const [statusSnapshot,setStatusSnapshot]=useState<CollegeApplication|null>(null);
  const navigate = useNavigate();
  const app = query.data?.data;
  const action = params.get("action");
  useEffect(() => {
    if (action === "status" && app) {
      setStatusSnapshot(app);
      setStatus(app.status);
      setNotes("");
    }
  }, [action, app?.id]);
  const nextTask = tasks.data?.data
    .filter(
      (task) =>
        task.collegeApplicationId === applicationId &&
        !["completed", "cancelled"].includes(task.status),
    )
    .sort((a, b) =>
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
    )[0];
  const essay = essays.data?.data.find(
    (item) => item.collegeApplicationId === applicationId,
  );
  const hasMentorFeedback = Boolean(getMentorFeedbackText(essay?.mentorFeedback));
  const closeStatus = () => {
    const next = new URLSearchParams(params);
    next.delete("action");
    setParams(next);
  };
  const saveStatus = async () => {
    if (!app || !status || !statusSnapshot) return;
    try {
      await update({
        id: app.id,
        data: {
          status,
          expectedUpdatedAt:statusSnapshot.updatedAt,
          ...(status === "submitted"
            ? { submittedAt: app.submittedAt || new Date().toISOString() }
            : {}),
          ...(notes.trim()
            ? { notes: [statusSnapshot.notes, notes.trim()].filter(Boolean).join("\n") }
            : {}),
        },
      }).unwrap();
      message.success("Application status updated.");
      closeStatus();
    } catch(error:any) {
      message.error(error?.data?.message || "Could not update the status. Your changes are still here.");
    }
  };
  return (
    <ApplicantPage title="Application workspace">
      <Breadcrumb>
        <Link to="/student-hub/applications">{isMasters ? "Programs" : "College List"}</Link>
        <span>/</span>Application
      </Breadcrumb>
      <QueryState
        loading={query.isLoading}
        error={query.isError || (!query.isLoading && !app)}
        retry={query.refetch}
      >
        {app && (
          <>
            <UniversityIdentity
              id={app.universityId}
              name={isMasters ? app.major || app.universityName : app.universityName}
              subtitle={(isMasters
                ? [app.universityName, "Master’s"]
                : [
                    app.major,
                    app.degreeLevel === "master"
                      ? "Master’s"
                      : app.degreeLevel === "bachelor"
                        ? "Bachelor’s"
                        : undefined,
                  ])
                .filter(Boolean)
                .join(" · ")}
            />
            <div className="applicant-panel">
              <span className="applicant-kicker">Next planned task</span>
              <div className="applicant-page__heading">
                <div>
                  <h2>
                    {tasks.isError
                      ? "Tasks are temporarily unavailable"
                      : nextTask?.title || "Plan your next step"}
                  </h2>
                  <p>
                    {nextTask?.dueDate
                      ? `Planned for ${displayDate(nextTask.dueDate)}`
                      : "Your reminders help you keep preparation on track."}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    navigate(
                      `/student-hub/tasks?application=${encodeURIComponent(app.id)}`,
                    )
                  }
                >
                  View all tasks <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            <div className="applicant-two-columns">
              <div className="applicant-stack">
                <div className="applicant-panel">
                  <h2>Writing & feedback</h2>
                  {essays.isError ? (
                    <Alert
                      type="warning"
                      message="Writing could not be loaded."
                      action={
                        <Button onClick={() => essays.refetch()}>Retry</Button>
                      }
                    />
                  ) : (
                    <>
                      <h3>{essay?.title || "Personal statement"}</h3>
                      <p>
                        {essay
                          ? `${essay.status} · ${essay.wordCount ?? 0} words`
                          : "Start a draft and keep your application writing together."}
                      </p>
                      <div className="applicant-actions">
                        <Button
                          type="primary"
                          onClick={() =>
                            navigate(
                              essay
                                ? `/student-hub/essays/${essay.id}${hasMentorFeedback ? "?feedback=mentor" : ""}`
                                : `/student-hub/essays/new?application=${app.id}`,
                            )
                          }
                        >
                          {hasMentorFeedback
                            ? "Review mentor feedback"
                            : essay
                              ? "Continue writing"
                              : "Start writing"}{" "}
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="applicant-panel">
                  <h2>Requirements & documents</h2>
                  <ApplicationRequirements key={app.id} requirements={app.requirements} updatedAt={app.updatedAt} onSave={(requirements, expectedUpdatedAt) => update({ id: app.id, data: { requirements, expectedUpdatedAt } }).unwrap()} />
                  <div className="applicant-form-grid">
                    <div>
                      <p>Check the university’s current requirements.</p>
                      <ApplicationSourceLink app={app} />
                    </div>
                    <div>
                      <p>Files shared across applications.</p>
                      <Link to="/student-hub/documents">
                        Open document library →
                      </Link>
                    </div>
                  </div>
                </div>
                <section className="applicant-panel"><h2>Shared application notes</h2><p style={{whiteSpace:"pre-wrap"}}>{app.sharedNotes || "No shared notes yet. Your application mentor can add notes here."}</p></section>
                {!!app.notes && (
                  <div className="applicant-panel">
                    <h2>Private notes</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>{app.notes}</p>
                  </div>
                )}
              </div>
              <aside className="applicant-stack">
                <ApplicationMentor key={app.id} application={app} />
                <div className="applicant-panel">
                  <div className="applicant-page__heading">
                    <h3>Your application plan</h3>
                    <Link to={`/student-hub/applications/${app.id}/edit`}>
                      {app.deadline || app.applicationType ? "Edit plan →" : "Add planning details →"}
                    </Link>
                  </div>
                  <div className="applicant-page__heading">
                    <span className="applicant-status">
                      {applicationStatusLabels[app.status]}
                    </span>
                    <Button
                      type="link"
                      onClick={() => {
                        setStatusSnapshot(app);
      setStatus(app.status);
                        setNotes("");
                        const next = new URLSearchParams(params);
                        next.set("action", "status");
                        setParams(next);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                  <dl className="applicant-facts">
                    <dt>My planning deadline</dt>
                    <dd>{displayDate(app.deadline)}</dd>
                    <dt>Intake</dt>
                    <dd>{app.intake || "Not set"}</dd>
                    <dt>Platform</dt>
                    <dd>
                      {app.applicationType?.replaceAll("_", " ") ||
                        "Not selected"}
                    </dd>
                  </dl>
                </div>
                <div className="applicant-panel">
                  <h3>Activity</h3>
                  <ApplicationTimeline
                    createdAt={app.createdAt}
                    activity={app.activity}
                  />
                </div>
              </aside>
            </div>
            <p>
              Manage your preparation here. Submit through the university’s
              official platform.
            </p>
            <Modal
              rootClassName="applicant-modal"
              title="Update application status"
              open={params.get("action") === "status"}
              onCancel={closeStatus}
              onOk={saveStatus}
              confirmLoading={saving}
              okText="Save status"
              okButtonProps={{ disabled: !status || status === app.status }}
            >
              <Form layout="vertical">
                <Form.Item label="Status" htmlFor="application-status">
                  <Select
                    id="application-status"
                    aria-label="Status"
                    value={status ?? app.status}
                    onChange={setStatus}
                    options={Object.entries(applicationStatusLabels).map(
                      ([value, label]) => ({ value, label }),
                    )}
                  />
                </Form.Item>
                <Form.Item
                  label="Private note (optional)"
                  htmlFor="application-status-notes"
                >
                  <Input.TextArea
                    id="application-status-notes"
                    aria-label="Private note (optional)"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </Form.Item>
              </Form>
              <p>
                This updates your tracker. It does not submit an application.
              </p>
            </Modal>
          </>
        )}
      </QueryState>
    </ApplicantPage>
  );
}

function ApplicationSourceLink({ app }: { app: CollegeApplication }) {
  const degrees = useGetUndergraduateDegreesQuery(app.universityId ?? '', { skip: !app.universityId || !app.undergraduateDegreeId });
  const university = useGetUniversityDetailQuery(app.universityId ?? '', { skip: !app.universityId || app.degreeLevel !== 'bachelor' || !!app.undergraduateDegreeId || !app.major });
  const degree = degrees.data?.find(item => item.id === app.undergraduateDegreeId);
  const major = university.data?.majors?.find(item => item.type === 'undergraduate' && getTranslation(item.name).trim().toLowerCase() === app.major?.trim().toLowerCase());
  const href = degree ? `/student-hub/universities/${app.universityId}/degrees/${degree.slug}`
    : major ? `/student-hub/universities/${app.universityId}/study-areas/${major.id}`
    : app.universityId ? `/student-hub/universities/${app.universityId}` : `/student-hub/applications/${app.id}/edit`;
  return <Link to={href}>Review application details →</Link>;
}
