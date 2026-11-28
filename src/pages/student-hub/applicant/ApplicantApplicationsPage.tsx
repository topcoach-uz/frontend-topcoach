import { useSegmentLens } from "src/hooks/useSegmentLens";
import dayjs, { type Dayjs } from "dayjs";
import { submissionDateFields } from "./applicationPlanning";
import {
  applicationListReturnTo,
  updateApplicationListParams,
} from "./applicationNavigation";
import ApplicationSummaryCard from "./ApplicationSummaryCard";
import { useGetUniversityDetailQuery } from "src/app/services/universities";
import { useGetUndergraduateDegreesQuery } from "src/app/services/undergraduateDegreesApi";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Tag,
  Tabs,
  message,
} from "antd";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  MoreHorizontal,
  SlidersHorizontal,
  ClipboardList,
  Building2,
  FileText,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useLocation,
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
import {
  useGetMenteeTasksQuery,
  useGetMenteePipelineQuery,
} from "src/app/services/fullSupportApi";
import {
  filterApplications,
  groupMilestones,
  milestoneType,
} from "./applicationListModel";
import { buildApplicationMilestones } from "./applicationMilestones";
import { getMentorFeedbackText } from "./essayFeedbackModel";
import { useGetStudentEssaysQuery } from "src/app/services/student-hub/essayManagementApi";
import type { CollegeApplication } from "src/app/services/student-hub/types";
import {
  useGetGraduateProgramQuery,
  type GraduateProgramFact,
} from "src/app/services/graduateProgramsApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  UniversityIdentity,
  displayDate,
  applicationStatusLabels,
} from "./ApplicantPage";
import ScholarshipManagement from "./ScholarshipManagement";
import ApplicationRequirements from "./ApplicationRequirements";
import ApplicationMentor from "./ApplicationMentor";
import ApplicationTimeline from "../applications/components/ApplicationTimeline";
import { NextStepCard } from "./NextStepCard";
import { useApplicantOverview } from "./ApplicantOverviewContext";

export default function ApplicantApplicationsPage() {
  const [listParams, setListParams] = useSearchParams();
  const location = useLocation();
  const currentListPath = `${location.pathname}${location.search}`;
  const returnState = { applicationListReturnTo: currentListPath };
  const updateFilters = (values: Record<string, string>, replace = true) =>
    setListParams((previous) => updateApplicationListParams(previous, values), {
      replace,
    });
  const showArchived = listParams.get("view") === "archived";
  const archived = useGetArchivedCollegeApplicationsQuery(undefined, {
    skip: !showArchived,
  });
  const [archive, archiveState] = useArchiveCollegeApplicationMutation();
  const [restore, restoreState] = useRestoreCollegeApplicationMutation();
  const page = Math.max(1, Number(listParams.get("page")) || 1);
  const query = useGetCollegeApplicationsQuery(
    { page, limit: 100 },
    {
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  // Comparison uses a stable query independent of the list URL's page parameter.
  // The current backend returns all applications for the signed-in profile.
  const allApplicationsQuery = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 },
    { pollingInterval: 10000, refetchOnFocus: true },
  );
  const tasks = useGetApplicationTasksQuery(
    { page: 1, limit: 100 },
    { pollingInterval: 10000 },
  );
  const navigate = useNavigate();
  const isMasters =
    useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const shortlistMode = isMasters && listParams.get("view") === "shortlist";
  const applications = query.data?.data ?? [];
  const collection =
    listParams.get("collection") === "saved" ? "saved" : "active";
  const collectionLens = useSegmentLens<HTMLElement>(".is-active", [
    collection,
    applications.length,
  ]);
  const search = listParams.get("q") || "";
  const statusFilter = listParams.get("status") || "all";
  const sort = listParams.get("sort") === "name" ? "name" : "deadline";
  const setCollection = (value: string) =>
    updateFilters({ collection: value, status: "all" }, false);
  const setSearch = (value: string) => updateFilters({ q: value });
  const setStatusFilter = (value: string) => updateFilters({ status: value });
  const setSort = (value: string) => updateFilters({ sort: value });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const filtered = filterApplications(applications, search, statusFilter, sort);
  const active = filtered.filter((app) => app.status !== "researching");
  const saved = (shortlistMode ? applications : filtered).filter(
    (app) => app.status === "researching",
  );
  const showTimeline = listParams.get("tab") === "timeline";
  const showScholarships = listParams.get("tab") === "scholarships";
  const scholarships = useGetScholarshipApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: !showTimeline && !showScholarships, pollingInterval: 10000 },
  );
  const assignedTasks = useGetMenteeTasksQuery(undefined, {
    skip: !showTimeline,
    pollingInterval: 10000,
  });
  const mentorPlans = useGetMenteePipelineQuery(undefined, {
    pollingInterval: 10000,
  });
  const comparedIds = (listParams.get("compare") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 4);
  const comparedPrograms = (allApplicationsQuery.data?.data ?? []).filter(
    (app) => comparedIds.includes(app.id),
  );
  const compareMode = listParams.get("view") === "compare";
  const toggleComparison = (id: string, checked: boolean) => {
    const next = new URLSearchParams(listParams);
    const ids = checked
      ? [...new Set([...comparedIds, id])]
      : comparedIds.filter((item) => item !== id);
    ids.length ? next.set("compare", ids.join(",")) : next.delete("compare");
    setListParams(next);
  };
  const milestones = buildApplicationMilestones(
    applications,
    tasks.data?.data ?? [],
    scholarships.data?.data ?? [],
    assignedTasks.data?.data ?? [],
    mentorPlans.data?.data ?? [],
  );
  const milestoneGroups = groupMilestones(
    milestones.filter(
      (item) =>
        timelineFilter === "all" || milestoneType(item.id) === timelineFilter,
    ),
  );
  const timelineSources = [
    query,
    tasks,
    scholarships,
    assignedTasks,
    mentorPlans,
  ];
  const timelineErrors = timelineSources.filter((source) => source.isError);
  const selectedMilestone = milestones.find(
    (item) => item.id === listParams.get("milestone"),
  );
  const row = (app: CollegeApplication) => {
    const nextTask = tasks.data?.data
      .filter(
        (task) =>
          task.collegeApplicationId === app.id &&
          !["completed", "cancelled"].includes(task.status),
      )
      .sort((a, b) =>
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
      )[0];
    return (
      <ApplicationSummaryCard
        key={app.id}
        application={app}
        returnTo={currentListPath}
        task={nextTask}
        tasksLoading={tasks.isLoading}
        tasksError={tasks.isError}
        compared={comparedIds.includes(app.id)}
        comparisonDisabled={
          comparedIds.length >= 4 && !comparedIds.includes(app.id)
        }
        onCompare={
          isMasters ? (checked) => toggleComparison(app.id, checked) : undefined
        }
        archiving={archiveState.isLoading}
        onArchive={() =>
          Modal.confirm({
            title: "Archive this application?",
            content:
              "The application and its planning tasks leave active lists. Writing and documents stay saved. You can restore it from Archived applications.",
            okText: "Archive application",
            onOk: async () => {
              try {
                await archive(app.id).unwrap();
                message.success("Application archived.");
              } catch {
                message.error("Could not archive this application.");
                throw new Error("Archive failed");
              }
            },
          })
        }
      />
    );
  };
  const visibleApplications = collection === "saved" ? saved : active;
  if (showScholarships) return <ScholarshipManagement />;
  if (showArchived)
    return (
      <ApplicantPage
        title="Archived applications"
        subtitle="Restore an application to resume planning. Writing and documents are retained."
        actions={
          <Button onClick={() => navigate("/student-hub/applications")}>
            View active applications
          </Button>
        }
      >
        <Breadcrumb>
          <Link to="/student-hub/applications">Applications</Link>
          <span>/</span>Archived
        </Breadcrumb>
        <QueryState
          hasData={archived.data !== undefined}
          loading={archived.isLoading}
          error={archived.isError}
          retry={archived.refetch}
        >
          {!archived.data?.data.length ? (
            <div className="applicant-panel applicant-empty">
              <ClipboardList size={36} />
              <h2>No archived applications</h2>
              <p>
                Applications you archive will appear here. You can restore them
                along with their planning tasks.
              </p>
              <Button onClick={() => navigate("/student-hub/applications")}>
                View applications
              </Button>
            </div>
          ) : (
            archived.data.data.map((app) => (
              <div className="applicant-panel" key={app.id}>
                <UniversityIdentity
                  id={app.universityId}
                  name={app.universityName}
                  subtitle={app.major}
                />
                <div className="applicant-actions">
                  <Tag>{applicationStatusLabels[app.status] ?? app.status}</Tag>
                  <span>Planning deadline: {displayDate(app.deadline)}</span>
                  <span>{app.intake || "Intake not set"}</span>
                  {app.activity?.slice(-1)[0]?.type ===
                    "application_archived" && (
                    <span>
                      Archived: {displayDate(app.activity.slice(-1)[0].at)}
                    </span>
                  )}
                </div>
                <Button
                  loading={restoreState.isLoading}
                  onClick={async () => {
                    try {
                      await restore(app.id).unwrap();
                      message.success(
                        "Application restored with its planning tasks.",
                      );
                    } catch {
                      message.error(
                        "Could not restore this application. Please try again.",
                      );
                    }
                  }}
                >
                  Restore application
                </Button>
              </div>
            ))
          )}
        </QueryState>
      </ApplicantPage>
    );
  if (showTimeline) {
    return (
      <ApplicantPage
        title="Deadline timeline"
        subtitle="Application deadlines and planned tasks, ordered by date."
        actions={
          <Button onClick={() => navigate("/student-hub/applications")}>
            View applications
          </Button>
        }
      >
        <Breadcrumb>
          <Link to="/student-hub/applications">Applications</Link>
          <span>/</span>Deadlines
        </Breadcrumb>
        <Select
          className="application-timeline-filter"
          aria-label="Filter deadline types"
          value={timelineFilter}
          onChange={setTimelineFilter}
          options={[
            "all",
            "Application",
            "Personal task",
            "Scholarship",
            "Mentor work",
          ].map((value) => ({
            value,
            label: value === "all" ? "All deadline types" : value,
          }))}
        />
        {!!timelineErrors.length && (
          <Alert
            type="warning"
            showIcon
            message="Some deadlines could not be loaded"
            description="Available deadlines are shown below. Retry to load the remaining sources."
            action={
              <Button
                onClick={() =>
                  timelineErrors.forEach((source) => source.refetch())
                }
              >
                Retry missing sources
              </Button>
            }
          />
        )}
        {timelineSources.some((source) => source.isLoading) && (
          <Skeleton active title={false} paragraph={{ rows: 1 }} />
        )}
        {Object.entries(milestoneGroups).map(
          ([group, entries]) =>
            entries.length > 0 && (
              <section
                key={group}
                className="applicant-panel application-deadline-group"
                aria-label={group}
              >
                {group === "Past" ? (
                  <details>
                    <summary>Past dates · {entries.length}</summary>
                    <div className="application-deadline-list">
                      {entries.map((milestone) => (
                        <DeadlineRow key={milestone.id} milestone={milestone} />
                      ))}
                    </div>
                  </details>
                ) : (
                  <>
                    <h2>
                      {group}{" "}
                      <span className="application-count">
                        {entries.length}
                      </span>
                    </h2>
                    <div className="application-deadline-list">
                      {entries.map((milestone) => (
                        <DeadlineRow key={milestone.id} milestone={milestone} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            ),
        )}
        {!milestones.length &&
          !timelineSources.some((source) => source.isLoading) && (
            <div className="applicant-panel applicant-empty">
              <ClipboardList size={36} />
              <h2>
                {timelineErrors.length
                  ? "No dates available yet"
                  : "No deadlines yet"}
              </h2>
              <p>
                {timelineErrors.length
                  ? "Retry the unavailable sources to see your saved dates."
                  : "Add an application deadline or a dated task to see it here."}
              </p>
              <Button
                onClick={() =>
                  navigate("/student-hub/applications/new", {
                    state: returnState,
                  })
                }
              >
                Add application
              </Button>
            </div>
          )}
        {!!milestones.length &&
          !Object.values(milestoneGroups).some((entries) => entries.length) && (
            <div className="applicant-panel applicant-empty">
              <p>No dates match this filter.</p>
              <Button onClick={() => setTimelineFilter("all")}>
                Show all types
              </Button>
            </div>
          )}
        <Modal
          title={selectedMilestone?.title}
          open={!!selectedMilestone}
          footer={null}
          onCancel={() => {
            const next = new URLSearchParams(listParams);
            next.delete("milestone");
            setListParams(next);
          }}
        >
          <p>{selectedMilestone?.detail}</p>
          <p>Deadline: {displayDate(selectedMilestone?.date)}</p>
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
        actions={
          <Button
            onClick={() => {
              const next = new URLSearchParams(listParams);
              next.delete("view");
              setListParams(next);
            }}
          >
            Back to program list
          </Button>
        }
      >
        <Breadcrumb>
          <Link to="/student-hub/applications">Applications</Link>
          <span>/</span>
          <Link to="/student-hub/applications?view=shortlist">Shortlist</Link>
          <span>/</span>Compare
        </Breadcrumb>
        <QueryState
          hasData={allApplicationsQuery.data !== undefined}
          loading={allApplicationsQuery.isLoading}
          error={allApplicationsQuery.isError}
          retry={allApplicationsQuery.refetch}
        >
          {!comparedPrograms.length ? (
            <div className="applicant-panel applicant-empty">
              <ClipboardList size={36} />
              <h2>No saved programs selected.</h2>
              <p>
                Select two or more programs from your saved list to compare
                them.
              </p>
              <Button
                onClick={() => {
                  const next = new URLSearchParams(listParams);
                  next.delete("view");
                  setListParams(next);
                }}
              >
                View saved programs
              </Button>
            </div>
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                message="Comparison uses verified program records and your saved details"
                description="A field marked “Verification needed” is absent from the program record. Use the official source before applying."
              />
              <div
                className="application-comparison-grid"
                style={
                  {
                    "--comparison-count": comparedPrograms.length,
                  } as React.CSSProperties
                }
              >
                {comparedPrograms.map((app) => (
                  <GraduateComparisonCard
                    key={app.id}
                    app={app}
                    onOpen={() =>
                      navigate(
                        `/student-hub/applications/${encodeURIComponent(app.id)}`,
                        { state: returnState },
                      )
                    }
                    onRemove={() => toggleComparison(app.id, false)}
                  />
                ))}
              </div>
            </>
          )}
        </QueryState>
      </ApplicantPage>
    );
  }
  if (shortlistMode) {
    return (
      <ApplicantPage
        title="Your shortlist"
        subtitle="Programs you have saved to consider. Open a workspace when you are ready to plan an application."
        actions={
          <div className="applicant-actions">
            <Button onClick={() => navigate("/student-hub/applications")}>
              View applications
            </Button>
            <Button
              type="primary"
              disabled={comparedIds.length < 2}
              onClick={() => {
                const next = new URLSearchParams(listParams);
                next.set("view", "compare");
                setListParams(next);
              }}
            >
              Compare selected ({comparedIds.length}/4)
            </Button>
          </div>
        }
      >
        <Breadcrumb>
          <Link to="/student-hub/applications">Applications</Link>
          <span>/</span>Shortlist
        </Breadcrumb>
        <p>Select two to four saved programs to compare their details.</p>
        <QueryState
          hasData={query.data !== undefined}
          loading={query.isLoading}
          error={query.isError}
          retry={query.refetch}
        >
          {saved.length ? (
            <div className="application-card-grid">{saved.map(row)}</div>
          ) : (
            <div className="applicant-panel applicant-empty">
              <Building2 size={36} />
              <h2>Your shortlist is empty.</h2>
              <p>Explore programs and save the ones you want to revisit.</p>
              <Button
                type="primary"
                onClick={() => navigate("/student-hub/universities")}
              >
                Explore programs <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </QueryState>
      </ApplicantPage>
    );
  }
  return (
    <ApplicantPage
      className="application-dashboard"
      title="Applications"
      actions={
        <>
          {applications.length > 0 ? (
            <Button
              type="primary"
              onClick={() =>
                navigate("/student-hub/applications/new", {
                  state: returnState,
                })
              }
              icon={<Plus size={16} />}
            >
              <span className="application-add-full">Add application</span>
              <span className="application-add-short">Add</span>
            </Button>
          ) : null}
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "/student-hub/applications?view=archived",
                  label: "Archived",
                },
                {
                  key: "/student-hub/applications?tab=timeline",
                  label: "Deadlines",
                },
                {
                  key: "/student-hub/applications?tab=scholarships",
                  label: "Scholarships",
                },
              ],
              onClick: ({ key }) => navigate(key),
            }}
          >
            <Button
              type="text"
              icon={<MoreHorizontal size={20} />}
              aria-label="More application tools"
            />
          </Dropdown>
        </>
      }
    >
      <NextStepCard />
      <section
        className="application-list-controls"
        aria-label="Application list controls"
      >
        <div className="application-dashboard-navigation">
          <nav
            ref={collectionLens.ref}
            className="applicant-view-tabs application-view-switcher"
            data-lens={
              collectionLens.lensStyle.width != null ? "on" : undefined
            }
            aria-label="Application views"
          >
            <span
              className="applicant-view-tabs__lens"
              style={collectionLens.lensStyle}
              aria-hidden
            />
            <button
              type="button"
              className={collection === "active" ? "is-active" : undefined}
              aria-pressed={collection === "active"}
              onClick={() => {
                setCollection("active");
              }}
            >
              Applications{" "}
              <span className="application-collection-count">
                {
                  applications.filter((app) => app.status !== "researching")
                    .length
                }
              </span>
            </button>
            <button
              type="button"
              className={collection === "saved" ? "is-active" : undefined}
              aria-pressed={collection === "saved"}
              onClick={() => {
                setCollection("saved");
              }}
            >
              Saved{" "}
              <span className="application-collection-count">
                {
                  applications.filter((app) => app.status === "researching")
                    .length
                }
              </span>
            </button>
          </nav>
          {applications.length > 0 && (
            <span
              className="application-controls-result"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {visibleApplications.length}{" "}
              {search || statusFilter !== "all"
                ? "matching"
                : collection === "saved"
                  ? "saved"
                  : "active"}{" "}
              {visibleApplications.length === 1
                ? "application"
                : "applications"}
            </span>
          )}
        </div>
        {applications.length > 0 && (
          <div
            className="application-toolbar"
            role="search"
            aria-label="Filter applications"
          >
            <Input
              className="application-search"
              prefix={<Search size={18} aria-hidden="true" />}
              aria-label="Search applications"
              placeholder="Search applications"
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button
              className="application-filter-toggle"
              icon={<SlidersHorizontal size={16} />}
              aria-expanded={filtersExpanded}
              aria-controls="application-list-filter-fields"
              onClick={() => setFiltersExpanded((value) => !value)}
            >
              Filters
              {statusFilter !== "all" || sort !== "deadline" ? " · On" : ""}
            </Button>
            <div
              id="application-list-filter-fields"
              className="application-filter-fields"
              data-open={filtersExpanded}
            >
              {collection === "active" && (
                <>
                  <Select
                    aria-label="Application status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "preparing", label: "Preparing" },
                      { value: "submitted", label: "Submitted / under review" },
                      { value: "decisions", label: "Decisions" },
                    ]}
                  />
                </>
              )}
              <Select
                aria-label="Sort applications"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "deadline", label: "Planning date" },
                  { value: "name", label: "University name" },
                ]}
              />
            </div>
            {isMasters && collection === "saved" && (
              <Button
                disabled={comparedIds.length < 2}
                onClick={() => {
                  const next = new URLSearchParams(listParams);
                  next.set("view", "compare");
                  setListParams(next);
                }}
              >
                Compare selected ({comparedIds.length}/4)
              </Button>
            )}
          </div>
        )}
      </section>

      <QueryState
        hasData={query.data !== undefined}
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!applications.length && isMasters ? (
          <MasterApplicationsEmpty />
        ) : !applications.length ? (
          <div className="applicant-panel applicant-empty">
            <ClipboardList size={36} />
            <h2>
              {isMasters
                ? "Your graduate program list starts here."
                : "Your applications start here."}
            </h2>
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
                {isMasters ? "Find programs" : "Find universities"}{" "}
                <ArrowRight size={16} />
              </Button>
              <Button
                onClick={() =>
                  navigate("/student-hub/applications/new", {
                    state: returnState,
                  })
                }
              >
                Add an application
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!visibleApplications.length ? (
              <div className="applicant-panel applicant-empty">
                <h2>
                  {search || statusFilter !== "all"
                    ? "No matching applications"
                    : collection === "saved"
                      ? "No saved choices yet"
                      : "Ready to start preparing?"}
                </h2>
                <p>
                  {search || statusFilter !== "all"
                    ? "Try another university, program or intake, or clear your filters."
                    : collection === "saved"
                      ? "Explore programs and save the ones you want to consider."
                      : "Open a saved choice to plan your application."}
                </p>
                <Button
                  onClick={() => {
                    if (search || statusFilter !== "all") {
                      updateFilters({ q: "", status: "all" });
                    } else if (collection === "active") setCollection("saved");
                    else navigate("/student-hub/universities");
                  }}
                >
                  {search || statusFilter !== "all"
                    ? "Clear filters"
                    : collection === "active"
                      ? "View saved choices"
                      : "Explore programs"}
                </Button>
              </div>
            ) : (
              <div className="application-card-grid">
                {visibleApplications.map(row)}
              </div>
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
          </>
        )}
      </QueryState>
      {mentorPlans.isError && (
        <Alert
          type="warning"
          message="Mentor plans are temporarily unavailable."
          action={
            <Button onClick={() => void mentorPlans.refetch()}>Retry</Button>
          }
        />
      )}
      {!!mentorPlans.data?.data.length && (
        <details className="applicant-panel application-details">
          <summary>
            Mentor application plans · {mentorPlans.data.data.length}
          </summary>
          {mentorPlans.data.data.map((plan) => (
            <div key={plan.id} className="application-deadline-row">
              <strong>{plan.program}</strong>
              <span>
                {plan.stage} · {plan.status}
              </span>
              <span>{displayDate(plan.deadline)}</span>
            </div>
          ))}
        </details>
      )}
    </ApplicantPage>
  );
}

function DeadlineRow({
  milestone,
}: {
  milestone: ReturnType<typeof buildApplicationMilestones>[number];
}) {
  return (
    <div className="application-deadline-row">
      <strong>{displayDate(milestone.date)}</strong>
      <div>
        <Tag>{milestoneType(milestone.id)}</Tag>
        <strong>{milestone.title}</strong>
        <small>{milestone.detail}</small>
      </div>
      <Link to={milestone.path}>View details →</Link>
    </div>
  );
}

function MasterApplicationsEmpty() {
  return (
    <div className="applicant-master-empty">
      <section
        className="applicant-master-empty__hero"
        aria-labelledby="applications-empty-title"
      >
        <div className="applicant-master-empty__hero-copy">
          <span className="applicant-master-empty__eyebrow">
            Your application workspace
          </span>
          <h2 id="applications-empty-title">No applications yet</h2>
          <p>
            Choose a university to create your first workspace.
            <br />
            Add your program and plan what comes next.
          </p>
          <div className="applicant-master-empty__actions">
            <Link
              className="applicant-master-empty__primary"
              to="/student-hub/applications/new"
            >
              Start an application <ArrowRight size={17} />
            </Link>
            <Link
              className="applicant-master-empty__secondary"
              to="/student-hub/universities"
            >
              Explore programs <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div
          className="applicant-master-empty__illustration"
          aria-hidden="true"
        >
          <span className="applicant-master-empty__illustration-halo" />
          <span className="applicant-master-empty__sheet applicant-master-empty__sheet--back">
            <span />
            <span />
            <span />
          </span>
          <span className="applicant-master-empty__sheet applicant-master-empty__sheet--front">
            <span />
            <span />
            <span />
          </span>
          <span className="applicant-master-empty__folder">
            <FileText size={24} />
            <span>
              <i />
              <i />
            </span>
          </span>
          <span className="applicant-master-empty__plus">
            <Plus size={27} strokeWidth={1.8} />
          </span>
          <small>A workspace for every application</small>
        </div>
      </section>
      <section
        className="applicant-master-empty__steps"
        aria-labelledby="applications-steps-title"
      >
        <h2 id="applications-steps-title">
          From your first choice to your next step
        </h2>
        <div className="applicant-master-empty__step-grid">
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta">
              <span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--choice">
                <Building2 size={18} />
              </span>
              01 · Choose
            </span>
            <h3>Choose your university</h3>
            <p>
              Start a workspace for the university and program you want to apply
              to.
            </p>
          </article>
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta">
              <span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--prepare">
                <FileText size={18} />
              </span>
              02 · Prepare
            </span>
            <h3>Prepare your materials</h3>
            <p>Keep your drafts, documents and application tasks together.</p>
          </article>
          <article className="applicant-master-empty__step-card">
            <span className="applicant-master-empty__step-meta">
              <span className="applicant-master-empty__step-icon applicant-master-empty__step-icon--track">
                <ListChecks size={18} />
              </span>
              03 · Track
            </span>
            <h3>Track your next steps</h3>
            <p>
              Record deadlines and update your application status as you go.
            </p>
          </article>
        </div>
      </section>
      <aside className="applicant-master-empty__notice">
        <span className="applicant-master-empty__notice-icon">
          <ExternalLink size={19} />
        </span>
        <span>
          <strong>Prepare here. Submit through the university.</strong>
          <small>
            Creating a workspace does not send an application. Use the
            university’s official platform to submit.
          </small>
        </span>
      </aside>
    </div>
  );
}

const programFact = (fact: GraduateProgramFact | undefined) =>
  !fact || !Object.keys(fact).length
    ? "Verification needed"
    : Object.entries(fact)
        .map(
          ([key, value]) =>
            `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(value) ? value.join(", ") : String(value)}`,
        )
        .join(" · ");

function GraduateComparisonCard({
  app,
  onOpen,
  onRemove,
}: {
  app: CollegeApplication;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const program = useGetGraduateProgramQuery(app.programId ?? "", {
    skip: !app.programId,
  });
  const verified = program.data;
  const fields = [
    ["Intake", verified?.intake || app.intake || "Verification needed"],
    [
      verified?.deadline ? "Official deadline" : "My planning deadline",
      verified?.deadline
        ? displayDate(verified.deadline)
        : displayDate(app.deadline),
    ],
    ["Eligibility", programFact(verified?.eligibility)],
    ["Language evidence", programFact(verified?.languageEvidence)],
    ["Funding", programFact(verified?.funding)],
    [
      "Platform",
      app.applicationType?.replaceAll("-", " ").replaceAll("_", " ") ||
        "Not set",
    ],
    ["Your fit notes", app.whyThisSchool || "Not added"],
  ];
  return (
    <section
      className="applicant-panel applicant-program-comparison"
      aria-label={app.major || app.universityName || "Program"}
    >
      <div>
        <UniversityIdentity
          id={app.universityId}
          name={verified?.programName || app.major || app.universityName}
          preferName
          subtitle={
            verified?.university.name
              ? getTranslation(verified.university.name)
              : app.universityName
          }
        />
        {program.isError && (
          <Alert
            type="warning"
            message="Verified facts unavailable."
            action={<Button onClick={() => program.refetch()}>Retry</Button>}
          />
        )}
      </div>
      {fields.map(([label, value]) => (
        <div className="application-comparison-field" key={label}>
          <strong>{label}</strong>
          {program.isLoading ? (
            <Skeleton active paragraph={false} />
          ) : (
            <p>{value}</p>
          )}
        </div>
      ))}
      <div className="applicant-actions">
        <Button type="primary" onClick={onOpen}>
          Open workspace
        </Button>
        <Button onClick={onRemove}>Remove</Button>
      </div>
    </section>
  );
}

export function ApplicantApplicationPage() {
  const location = useLocation();
  const returnTo = applicationListReturnTo(location.state);
  const returnState = { applicationListReturnTo: returnTo };
  const { applicationId = "" } = useParams();
  const query = useGetCollegeApplicationQuery(applicationId, {
    skip: !applicationId,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const tasks = useGetApplicationTasksQuery({ page: 1, limit: 100 });
  const essays = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const [update, { isLoading: saving }] = useUpdateCollegeApplicationMutation();
  const [params, setParams] = useSearchParams();
  const isSaved = query.data?.data?.status === "researching";
  const selectedWorkspaceTab = ["checklist", "writing", "details"].includes(
    params.get("tab") || "",
  )
    ? params.get("tab")!
    : isSaved
      ? "details"
      : "checklist";
  const workspaceLens = useSegmentLens<HTMLDivElement>(".is-active", [
    selectedWorkspaceTab,
  ]);
  const changeWorkspaceTab = (key: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true, state: location.state });
  };
  const [status, setStatus] = useState<CollegeApplication["status"]>();
  const [notes, setNotes] = useState("");
  const [submissionDate, setSubmissionDate] = useState<Dayjs | null>(null);
  const [statusSnapshot, setStatusSnapshot] = useState<CollegeApplication>();
  const navigate = useNavigate();
  const app = query.data?.data;
  const startApplication = async () => {
    if (!app || app.status !== "researching" || saving) return;
    try {
      await update({
        id: app.id,
        data: { status: "applying", expectedUpdatedAt: app.updatedAt },
      }).unwrap();
      changeWorkspaceTab("checklist");
      message.success("Application started. Your saved details are ready.");
    } catch {
      message.error("Could not start this application. Please retry.");
    }
  };
  const action = params.get("action");
  useEffect(() => {
    if (action === "status" && app && !statusSnapshot) {
      setStatusSnapshot(app);
      setSubmissionDate(app.submittedAt ? dayjs(app.submittedAt) : null);
      setStatus(app.status);
      setNotes("");
    }
  }, [action, app?.id, app?.status, statusSnapshot]);
  const nextTask = tasks.data?.data
    .filter(
      (task) =>
        task.collegeApplicationId === applicationId &&
        !["completed", "cancelled"].includes(task.status),
    )
    .sort((a, b) =>
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
    )[0];
  const linkedEssays = (essays.data?.data ?? []).filter(
    (item) => item.collegeApplicationId === applicationId,
  );
  const closeStatus = (saved = false) => {
    if (
      !saved &&
      ((status && status !== app?.status) ||
        notes.trim() ||
        (submissionDate?.format("YYYY-MM-DD") ?? "") !==
          (statusSnapshot?.submittedAt ? dayjs(statusSnapshot.submittedAt).format("YYYY-MM-DD") : "")) &&
      !window.confirm("Discard your unsaved status changes?")
    )
      return;
    setStatusSnapshot(undefined);
    const next = new URLSearchParams(params);
    next.delete("action");
    setParams(next, { state: location.state });
  };
  const saveStatus = async () => {
    if (!app || !status) return;
    try {
      await update({
        id: app.id,
        data: {
          status,
          expectedUpdatedAt: statusSnapshot?.updatedAt,
          ...submissionDateFields(
            status,
            submissionDate?.format("YYYY-MM-DD"),
            statusSnapshot?.submittedAt,
          ),
          ...(notes.trim()
            ? {
                notes: [statusSnapshot?.notes, notes.trim()]
                  .filter(Boolean)
                  .join("\n"),
              }
            : {}),
        },
      }).unwrap();
      message.success("Application status updated.");
      closeStatus(true);
    } catch {
      message.error(
        "Could not update the status. Your changes are still here.",
      );
    }
  };
  return (
    <ApplicantPage
      className={`application-workspace${isSaved ? " application-workspace--saved" : ""}`}
    >
      <Link className="application-workspace-back" to={returnTo}>
        <ArrowLeft size={16} aria-hidden="true" /> Applications
      </Link>
      <QueryState
        hasData={!!app}
        loading={query.isLoading}
        error={query.isError || (!query.isLoading && !app)}
        retry={query.refetch}
      >
        {app && (
          <>
            <header className="application-workspace-header">
              <div>
                <h1>{app.universityName || app.major || "Application"}</h1>
                <p>
                  {[
                    app.major || (isSaved ? "Program not chosen" : undefined),
                    app.degreeLevel === "master"
                      ? "Master’s"
                      : app.degreeLevel === "bachelor"
                        ? "Bachelor’s"
                        : undefined,
                    isSaved ? app.intake : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="application-workspace-actions">
                <span
                  className={`application-workspace-status application-workspace-status--${app.status}`}
                >
                  {applicationStatusLabels[app.status] ?? app.status}
                </span>
                {isSaved && (
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={startApplication}
                  >
                    Start application
                  </Button>
                )}
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      ...(!isSaved
                        ? [{ key: "status", label: "Update status" }]
                        : []),
                      {
                        key: "edit",
                        label: isSaved ? "Edit details" : "Edit application",
                      },
                    ],
                    onClick: ({ key }) => {
                      if (key === "edit")
                        navigate(`/student-hub/applications/${app.id}/edit`, {
                          state: returnState,
                        });
                      else {
                        const next = new URLSearchParams(params);
                        next.set("action", "status");
                        setParams(next, { state: location.state });
                      }
                    },
                  }}
                >
                  <Button
                    type="text"
                    aria-label="Application options"
                    icon={<MoreHorizontal size={20} />}
                  />
                </Dropdown>
              </div>
            </header>
            {!isSaved &&
              (app.intake ||
                app.submittedAt ||
                (app.deadline && app.status === "applying")) && (
                <div className="application-workspace-meta">
                  {app.intake && <span>{app.intake}</span>}
                  {app.deadline &&
                    ["researching", "applying"].includes(app.status) && (
                      <span>
                        Planning date{" "}
                        <strong>{displayDate(app.deadline)}</strong>
                      </span>
                    )}
                  {app.submittedAt && (
                    <span>
                      Submitted <strong>{displayDate(app.submittedAt)}</strong>
                    </span>
                  )}
                </div>
              )}
            {!["researching", "applying"].includes(app.status) && (
              <section
                className="application-workspace-outcome"
                aria-label="Application outcome tracking"
              >
                <div>
                  <h2>
                    {["submitted", "under_review"].includes(app.status)
                      ? "Track your outcome"
                      : `Decision: ${applicationStatusLabels[app.status] ?? app.status}`}
                  </h2>
                  <p>
                    {["submitted", "under_review"].includes(app.status)
                      ? "Record updates from the university as they arrive."
                      : "Keep your decision and next steps up to date."}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("action", "status");
                    setParams(next, { state: location.state });
                  }}
                >
                  Update status
                </Button>
              </section>
            )}
            <Tabs
              className="application-workspace-tabs"
              activeKey={selectedWorkspaceTab}
              onChange={changeWorkspaceTab}
              renderTabBar={() => (
                <div
                  ref={workspaceLens.ref}
                  className="applicant-view-tabs application-workspace-switcher"
                  data-lens={
                    workspaceLens.lensStyle.width != null ? "on" : undefined
                  }
                  role="group"
                  aria-label="Application sections"
                >
                  <span
                    className="applicant-view-tabs__lens"
                    style={workspaceLens.lensStyle}
                    aria-hidden
                  />
                  {[
                    ["checklist", "Checklist"],
                    ["writing", "Writing"],
                    ["details", "Details"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={
                        selectedWorkspaceTab === key ? "is-active" : undefined
                      }
                      aria-pressed={selectedWorkspaceTab === key}
                      onClick={() => changeWorkspaceTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              items={[
                {
                  key: "checklist",
                  label: "Checklist",
                  forceRender: true,
                  children: (
                    <section
                      className="applicant-panel application-workspace-checklist"
                      aria-label="Application checklist"
                    >
                      <ApplicationRequirements
                        compact
                        heading="Requirements"
                        setup={
                          app.status === "applying"
                            ? {
                                programName:
                                  app.major ||
                                  (app.programId || app.undergraduateDegreeId
                                    ? "Linked program"
                                    : undefined),
                                renderProgramLink: (children) => (
                                  <Link
                                    className="application-checklist-step"
                                    aria-label={
                                      app.major ||
                                      app.programId ||
                                      app.undergraduateDegreeId
                                        ? "Edit program"
                                        : "Choose a program"
                                    }
                                    to={`/student-hub/applications/${app.id}/edit#major`}
                                    state={returnState}
                                  >
                                    {children}
                                  </Link>
                                ),
                              }
                            : undefined
                        }
                        actions={
                          <Link to="/student-hub/documents">Documents</Link>
                        }
                        key={app.id}
                        requirements={app.requirements}
                        updatedAt={app.updatedAt}
                        onSave={(requirements, expectedUpdatedAt) =>
                          update({
                            id: app.id,
                            data: { requirements, expectedUpdatedAt },
                          }).unwrap()
                        }
                      />
                    </section>
                  ),
                },
                {
                  key: "writing",
                  label: "Writing",
                  forceRender: true,
                  children: (
                    <section
                      className="applicant-panel application-workspace-writing"
                      aria-label="Application writing"
                    >
                      <div className="application-workspace-section-heading">
                        <h2>Drafts</h2>
                        <Link
                          className="application-workspace-new-draft"
                          to={`/student-hub/essays/new?application=${app.id}`}
                        >
                          <Plus size={15} aria-hidden="true" /> New draft
                        </Link>
                      </div>
                      {essays.isLoading ? (
                        <Skeleton active paragraph={{ rows: 2 }} />
                      ) : essays.isError ? (
                        <Alert
                          type="warning"
                          message="Writing could not be loaded."
                          action={
                            <Button onClick={() => essays.refetch()}>
                              Retry
                            </Button>
                          }
                        />
                      ) : linkedEssays.length ? (
                        linkedEssays.map((essay) => {
                          const feedback = Boolean(
                            getMentorFeedbackText(essay.mentorFeedback),
                          );
                          return (
                            <Link
                              className="application-workspace-draft"
                              key={essay.id}
                              to={`/student-hub/essays/${essay.id}${feedback ? "?feedback=mentor" : ""}`}
                            >
                              <strong title={essay.title || "Untitled draft"}>
                                {essay.title || "Untitled draft"}
                              </strong>
                              <span className="application-workspace-draft-meta">
                                <span
                                  className={
                                    feedback
                                      ? "application-workspace-feedback"
                                      : undefined
                                  }
                                >
                                  {feedback
                                    ? "Feedback"
                                    : essay.status.replaceAll("_", " ")}
                                </span>
                                <span>{essay.wordCount ?? 0} words</span>
                              </span>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="application-workspace-empty">
                          No drafts yet.
                        </p>
                      )}
                    </section>
                  ),
                },
                {
                  key: "details",
                  label: "Details",
                  forceRender: true,
                  children: (
                    <section
                      className="applicant-panel application-workspace-support"
                      aria-label="Application notes, mentor and activity"
                    >
                      <div className="application-workspace-plan-details">
                        <div className="application-workspace-section-heading">
                          <h2>
                            {isSaved ? "Your plan" : "Application details"}
                          </h2>
                          {!isSaved && (
                            <Link
                              to={`/student-hub/applications/${app.id}/edit`}
                              state={returnState}
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                        <dl>
                          <div>
                            <dt>Intake</dt>
                            <dd>
                              {app.intake ||
                                (isSaved ? (
                                  <Link
                                    to={`/student-hub/applications/${app.id}/edit#intake`}
                                    state={returnState}
                                  >
                                    Choose intake
                                  </Link>
                                ) : (
                                  "Not set"
                                ))}
                            </dd>
                          </div>
                          <div>
                            <dt>Personal planning date</dt>
                            <dd>
                              {app.deadline ? (
                                displayDate(app.deadline)
                              ) : isSaved ? (
                                <Link
                                  to={`/student-hub/applications/${app.id}/edit#deadline`}
                                  state={returnState}
                                >
                                  Set planning date
                                </Link>
                              ) : (
                                "Not set"
                              )}
                            </dd>
                          </div>
                          {!["researching", "applying"].includes(
                            app.status,
                          ) && (
                            <div>
                              <dt>Submitted</dt>
                              <dd>
                                {app.submittedAt
                                  ? displayDate(app.submittedAt)
                                  : "Not recorded"}
                              </dd>
                            </div>
                          )}
                        </dl>
                        {!isSaved && (
                          <Link
                            to={`/student-hub/tasks?application=${encodeURIComponent(app.id)}`}
                          >
                            Tasks{nextTask ? ` · ${nextTask.title}` : ""}{" "}
                            <ArrowRight size={15} aria-hidden="true" />
                          </Link>
                        )}
                        {!isSaved && tasks.isError && (
                          <Alert
                            type="warning"
                            message="Tasks could not be loaded."
                            action={
                              <Button onClick={() => tasks.refetch()}>
                                Retry
                              </Button>
                            }
                          />
                        )}
                        {app.universityId && (
                          <ApplicationSourceLink app={app} />
                        )}
                      </div>
                      {isSaved ? (
                        <>
                          <section
                            className="application-workspace-saved-notes"
                            aria-label="Application notes"
                          >
                            <div className="application-workspace-section-heading">
                              <h2>Notes</h2>
                              <Link
                                to={`/student-hub/applications/${app.id}/edit#application-shared-notes`}
                                state={returnState}
                              >
                                {app.sharedNotes ||
                                app.notes ||
                                app.whyThisSchool
                                  ? "Edit notes"
                                  : "Add note"}
                              </Link>
                            </div>
                            {app.whyThisSchool && (
                              <>
                                <h3>Why this program?</h3>
                                <p className="application-workspace-note">
                                  {app.whyThisSchool}
                                </p>
                              </>
                            )}
                            {app.sharedNotes && (
                              <>
                                <h3>Shared with mentors</h3>
                                <p className="application-workspace-note">
                                  {app.sharedNotes}
                                </p>
                              </>
                            )}
                            {app.notes && (
                              <>
                                <h3>Private notes</h3>
                                <p className="application-workspace-note">
                                  {app.notes}
                                </p>
                              </>
                            )}
                            {!app.sharedNotes &&
                              !app.notes &&
                              !app.whyThisSchool && (
                                <p className="application-workspace-empty">
                                  Keep your reasons for applying and questions
                                  here.
                                </p>
                              )}
                          </section>
                          <section
                            className="application-workspace-saved-mentor"
                            aria-label="Mentor support"
                          >
                            <h2>Mentor</h2>
                            <ApplicationMentor key={app.id} application={app} />
                          </section>
                        </>
                      ) : (
                        <>
                          <details className="application-workspace-details">
                            <summary>Notes</summary>
                            <div className="application-workspace-section-heading">
                              <h3>Shared notes</h3>
                              <Link
                                to={`/student-hub/applications/${app.id}/edit#application-shared-notes`}
                                state={returnState}
                              >
                                Edit
                              </Link>
                            </div>
                            <p className="application-workspace-note">
                              {app.sharedNotes || "No shared notes."}
                            </p>
                            {!!app.notes && (
                              <>
                                <h3>Private notes</h3>
                                <p className="application-workspace-note">
                                  {app.notes}
                                </p>
                              </>
                            )}
                          </details>
                          <details className="application-workspace-details application-workspace-mentor">
                            <summary>Mentor</summary>
                            <ApplicationMentor key={app.id} application={app} />
                          </details>
                        </>
                      )}
                      <details className="application-workspace-details">
                        <summary>Activity</summary>
                        <ApplicationTimeline
                          createdAt={app.createdAt}
                          activity={app.activity}
                        />
                      </details>
                    </section>
                  ),
                },
              ]}
            />
            {app.status === "applying" && (
              <p className="application-workspace-footnote">
                Submit through the university’s official platform.
              </p>
            )}
            <Modal
              rootClassName="applicant-modal"
              title="Update application status"
              open={params.get("action") === "status"}
              onCancel={() => closeStatus()}
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
                {(status === "submitted" || status === "under_review") && (
                  <Form.Item
                    label="Submission date (optional)"
                    extra="Leave blank if the date is unknown."
                  >
                    <DatePicker
                      value={submissionDate}
                      onChange={setSubmissionDate}
                      disabledDate={(date) => date.isAfter(dayjs(), "day")}
                    />
                  </Form.Item>
                )}
                <Form.Item
                  label="Notes (optional)"
                  htmlFor="application-status-notes"
                >
                  <Input.TextArea
                    id="application-status-notes"
                    aria-label="Notes (optional)"
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
  const degrees = useGetUndergraduateDegreesQuery(app.universityId ?? "", {
    skip: !app.universityId || !app.undergraduateDegreeId,
  });
  const university = useGetUniversityDetailQuery(app.universityId ?? "", {
    skip:
      !app.universityId ||
      app.degreeLevel !== "bachelor" ||
      !!app.undergraduateDegreeId ||
      !app.major,
  });
  const degree = degrees.data?.find(
    (item) => item.id === app.undergraduateDegreeId,
  );
  const major = university.data?.majors?.find(
    (item) =>
      item.type === "undergraduate" &&
      getTranslation(item.name).trim().toLowerCase() ===
        app.major?.trim().toLowerCase(),
  );
  const href = degree
    ? `/student-hub/universities/${app.universityId}/degrees/${degree.slug}`
    : major
      ? `/student-hub/universities/${app.universityId}/study-areas/${major.id}`
      : app.universityId
        ? `/student-hub/universities/${app.universityId}`
        : `/student-hub/applications/${app.id}/edit`;
  return (
    <Link to={href}>
      {degree || major || app.programId ? "Program details" : "View university"}
    </Link>
  );
}
