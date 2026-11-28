import type {
  ApplicationTask,
  CollegeApplication,
  ScholarshipApplication,
} from "src/app/services/student-hub/types";
import type { PipelineDto, TaskDto } from "src/app/services/fullSupportApi";
import { parseApplicantDate } from "./applicantDate";

export type ApplicationMilestone = {
  id: string;
  date: string;
  title: string;
  detail: string;
  path: string;
  notes?: string;
  actionable?: boolean;
};
export function buildApplicationMilestones(
  applications: CollegeApplication[],
  tasks: ApplicationTask[],
  scholarships: ScholarshipApplication[],
  assigned: TaskDto[],
  pipeline: PipelineDto[],
): ApplicationMilestone[] {
  const entries: Array<
    Omit<ApplicationMilestone, "date"> & { date?: string | null }
  > = [
    ...applications
      .filter(
        (app) => !["accepted", "rejected", "deferred"].includes(app.status),
      )
      .map((app) => ({
        id: `application-${app.id}`,
        date: app.deadline,
        actionable: !["submitted", "under_review"].includes(app.status),
        title: `${app.major || app.universityName || "Application"} planning date`,
        detail: app.universityName || "University application",
        path: `/student-hub/applications/${encodeURIComponent(app.id)}`,
      })),
    ...tasks
      .filter((task) => !["completed", "cancelled"].includes(task.status))
      .map((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate,
        title: task.title,
        detail: "Personal task due",
        path: `/student-hub/tasks?status=all&action=edit&task=${encodeURIComponent(task.id)}`,
      })),
    ...scholarships
      .filter((s) => !["awarded", "rejected", "expired"].includes(s.status))
      .map((s) => ({
        id: `scholarship-${s.id}`,
        date: s.applicationDeadline,
        actionable: !["submitted", "under_review"].includes(s.status),
        title: s.scholarshipName || "Scholarship",
        detail: `Scholarship · ${s.organization || "Organization not set"}`,
        path: `/student-hub/applications?tab=timeline&milestone=scholarship-${encodeURIComponent(s.id)}`,
        notes: s.notes,
      })),
    ...assigned
      .filter((task) => task.status !== "approved")
      .map((task) => ({
        id: `mentor-task-${task.id}`,
        date: task.deadline,
        title: task.task,
        detail: `Assigned task · ${task.mentorName || "Advisor"}`,
        path: `/student-hub/tasks?mentorTask=${encodeURIComponent(task.id)}`,
      })),
    ...pipeline
      .filter(
        (row) =>
          !["completed", "cancelled", "rejected", "accepted"].includes(
            row.status.toLowerCase(),
          ),
      )
      .map((row) => ({
        id: `pipeline-${row.id}`,
        date: row.deadline,
        title: row.program,
        detail: `Mentor plan · ${row.stage} · ${row.status}`,
        path: `/student-hub/applications?tab=timeline&milestone=pipeline-${encodeURIComponent(row.id)}`,
      })),
  ];
  return entries
    .filter(
      (entry): entry is ApplicationMilestone =>
        Boolean(entry.date) &&
        Number.isFinite(parseApplicantDate(entry.date!).getTime()),
    )
    .sort(
      (a, b) =>
        parseApplicantDate(a.date).getTime() -
          parseApplicantDate(b.date).getTime() || a.id.localeCompare(b.id),
    );
}
