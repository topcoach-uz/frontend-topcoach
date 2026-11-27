import type { CollegeApplication } from "src/app/services/student-hub/types";
import type { ApplicationMilestone } from "./applicationMilestones";
import { parseApplicantDate } from "./applicantDate";

export const applicationGroups = {
  preparing: ["applying"],
  submitted: ["submitted", "under_review"],
  decisions: ["accepted", "rejected", "waitlisted", "deferred"],
  saved: ["researching"],
};
export function filterApplications(
  applications: CollegeApplication[],
  search: string,
  status: string,
  sort: string,
) {
  const term = search.trim().toLocaleLowerCase();
  return applications
    .filter(
      (app) =>
        (!term ||
          [
            app.universityName,
            app.major,
            app.intake,
            ...(typeof app.university?.name === "object"
              ? Object.values(app.university.name)
              : [app.university?.name]),
          ].some((value) => value?.toLocaleLowerCase().includes(term))) &&
        (status === "all" ||
          (
            applicationGroups[status as keyof typeof applicationGroups] ?? [
              status,
            ]
          ).includes(app.status)),
    )
    .sort((a, b) => {
      if (sort === "name")
        return (a.universityName || a.major || "").localeCompare(
          b.universityName || b.major || "",
        );
      const time = (value?: string | null) =>
        value && Number.isFinite(parseApplicantDate(value).getTime())
          ? parseApplicantDate(value).getTime()
          : Infinity;
      return (
        time(a.deadline) - time(b.deadline) ||
        (a.universityName || a.major || "").localeCompare(
          b.universityName || b.major || "",
        )
      );
    });
}
export function milestoneType(id: string) {
  return id.startsWith("application-")
    ? "Application"
    : id.startsWith("scholarship-")
      ? "Scholarship"
      : id.startsWith("task-")
        ? "Personal task"
        : "Mentor work";
}
export function groupMilestones(
  entries: ApplicationMilestone[],
  now = new Date(),
) {
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).getTime();
  const groups: Record<string, ApplicationMilestone[]> = {
    Overdue: [],
    Today: [],
    Upcoming: [],
    Past: [],
  };
  for (const entry of entries) {
    const date = parseApplicantDate(entry.date).getTime();
    const key =
      date < today
        ? entry.actionable === false
          ? "Past"
          : "Overdue"
        : date < tomorrow
          ? "Today"
          : "Upcoming";
    groups[key].push(entry);
  }
  groups.Past.reverse();
  return groups;
}
