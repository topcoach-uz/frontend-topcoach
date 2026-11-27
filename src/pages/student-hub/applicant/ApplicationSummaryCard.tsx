import { planningDeadlineState } from "./applicationPlanning";
import { useGetUniversityDetailQuery } from "src/app/services/universities";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { Button, Checkbox, Dropdown, Progress, Tag } from "antd";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  ApplicationTask,
  CollegeApplication,
} from "src/app/services/student-hub/types";
import {
  UniversityIdentity,
  applicationStatusLabels,
  displayDate,
} from "./ApplicantPage";
import { requirementRows } from "./requirementChecklistModel";
import { parseApplicantDate } from "./applicantDate";

export default function ApplicationSummaryCard({
  application: app,
  returnTo,
  task,
  tasksLoading,
  tasksError,
  compared,
  comparisonDisabled,
  onCompare,
  onArchive,
  archiving,
}: {
  application: CollegeApplication;
  returnTo: string;
  task?: ApplicationTask;
  tasksLoading: boolean;
  tasksError: boolean;
  compared: boolean;
  comparisonDisabled: boolean;
  onCompare?: (checked: boolean) => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  const university = useGetUniversityDetailQuery(app.universityId || "", {
    skip: !app.universityId,
  });
  const universityName =
    app.universityName || getTranslation(university.data?.name);
  const applicationLabel =
    [universityName, app.major].filter(Boolean).join(" · ") || "University";
  const workspace = `/student-hub/applications/${encodeURIComponent(app.id)}`;
  const preparing = app.status === "applying";
  const saved = app.status === "researching";
  const submitted = ["submitted", "under_review"].includes(app.status);
  const deadlineState = preparing ? planningDeadlineState(app.deadline) : null;
  const returnState = { applicationListReturnTo: returnTo };
  const rows = requirementRows(app.requirements);
  const completed = rows.filter((row) => row.completed).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue =
    preparing &&
    task?.dueDate &&
    parseApplicantDate(task.dueDate).getTime() < today.getTime();
  const decisionNext: Record<string, [string, string]> = {
    accepted: [
      "Review your offer",
      "Keep offer conditions and your response date in your plan.",
    ],
    rejected: [
      "Plan your next option",
      "Review your remaining choices and discuss next steps with your mentor.",
    ],
    waitlisted: [
      "Check your waitlist instructions",
      "Record any update requests and response dates.",
    ],
    deferred: [
      "Review the next review round",
      "Confirm whether the university needs additional information.",
    ],
  };
  const next = saved
    ? [
        "Explore your fit",
        app.whyThisSchool || "Review the program and add your fit notes.",
      ]
    : submitted
      ? [
          "Waiting for a decision",
          "Record an update when you hear back from the university.",
        ]
      : decisionNext[app.status] || [
          tasksLoading
            ? "Loading your next task…"
            : tasksError
              ? "Tasks temporarily unavailable"
              : task?.title || "Plan your next step",
          task?.dueDate
            ? `${overdue ? "Overdue · planned for" : "Planned for"} ${displayDate(task.dueDate)}`
            : tasksLoading
              ? "Loading the latest task information."
              : tasksError
                ? "Open the workspace to retry loading your tasks."
                : "Add a task to keep your preparation moving.",
        ];
  return (
    <article
      className={`application-summary-card application-summary-card--${app.status}`}
      aria-label={`${applicationLabel} application`}
    >
      <header>
        <div className="application-summary-card__title">
          {app.major && (
            <UniversityIdentity
              id={app.universityId}
              name={
                app.major
                  ? universityName
                  : app.degreeLevel === "master"
                    ? "Graduate application"
                    : "Bachelor’s application"
              }
              preferName={!app.major}
            />
          )}
          <h2>
            <Link
              to={workspace}
              state={returnState}
              aria-label={`Open ${applicationLabel}`}
            >
              {app.major || universityName || "Choose your program"}
            </Link>
          </h2>
        </div>
        {(app.intake || !saved) && (
          <div className="application-summary-card__meta">
            {app.intake && <span>{app.intake}</span>}
            {!saved && (
              <Tag>{applicationStatusLabels[app.status] ?? app.status}</Tag>
            )}
          </div>
        )}
      </header>
      {preparing && (
        <div className="application-summary-card__facts">
          <div>
            <span>Planning date</span>
            <span className="application-summary-card__deadline">
              <strong>{displayDate(app.deadline)}</strong>
              {deadlineState && (
                <small
                  className={`application-deadline-urgency application-deadline-urgency--${deadlineState.tone}`}
                >
                  {deadlineState.label}
                </small>
              )}
            </span>
          </div>
          <div>
            <span>Requirements</span>
            <span>
              {rows.length
                ? `${completed} of ${rows.length} complete`
                : "Not added yet"}
            </span>
          </div>
          {rows.length > 0 && (
            <Progress
              percent={Math.round((completed / rows.length) * 100)}
              showInfo={false}
              strokeColor="#8b0000"
              size="small"
              aria-label={`${completed} of ${rows.length} requirements complete`}
            />
          )}
        </div>
      )}
      {saved && app.deadline && (
        <div className="application-summary-card__facts">
          <div>
            <span>Planning date</span>
            <strong>{displayDate(app.deadline)}</strong>
          </div>
        </div>
      )}
      {submitted && app.submittedAt && (
        <div className="application-summary-card__facts">
          <div>
            <span>Submission date</span>
            <strong>
              {app.submittedAt
                ? displayDate(app.submittedAt)
                : "Date not recorded"}
            </strong>
          </div>
        </div>
      )}
      {((preparing && task) ||
        (saved && app.whyThisSchool) ||
        decisionNext[app.status]) && (
        <div className="application-summary-card__next">
          {saved ? (
            <p>{app.whyThisSchool}</p>
          ) : (
            <>
              <h3>{next[0]}</h3>
              {task?.dueDate && (
                <p className={overdue ? "is-overdue" : undefined}>{next[1]}</p>
              )}
            </>
          )}
        </div>
      )}
      <footer>
        {saved && onCompare ? (
          <Checkbox
            checked={compared}
            disabled={comparisonDisabled}
            onChange={(event) => onCompare(event.target.checked)}
          >
            Compare
          </Checkbox>
        ) : null}
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [{ key: "archive", label: "Archive application" }],
            onClick: onArchive,
          }}
        >
          <Button
            type="text"
            loading={archiving}
            icon={<MoreHorizontal size={19} />}
            aria-label={`More actions for ${applicationLabel}`}
          />
        </Dropdown>
      </footer>
    </article>
  );
}
