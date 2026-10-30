import type { SessionLogDto, TaskDto } from "src/app/services/fullSupportApi";

export function plannedMinutes(duration: string): number {
  const value = Number.parseFloat(duration);
  return Number.isFinite(value)
    ? Math.max(
        0,
        Math.round(value * (/m(?:in)?$/i.test(duration.trim()) ? 1 : 60)),
      )
    : 0;
}
export function lessonEnd(lesson: SessionLogDto): number {
  return Date.parse(lesson.dateTime) + plannedMinutes(lesson.duration) * 60000;
}
export function lessonLabel(lesson: SessionLogDto, now = Date.now()): string {
  if (lesson.outcome === "scheduled") {
    if (lessonEnd(lesson) < now) return "Awaiting mentor record";
    return Date.parse(lesson.dateTime) <= now ? "In progress" : "Upcoming";
  }
  const labels: Record<string, string> = {
    held: "Held",
    cancelled: "Cancelled",
    student_no_show: "Student absent",
    mentor_no_show: "Mentor absent",
    rescheduled: "Rescheduled",
  };
  return labels[lesson.outcome] ?? "Not recorded";
}
export function nextLesson(
  sessions: SessionLogDto[],
  now = Date.now(),
): SessionLogDto | undefined {
  return sessions
    .filter((s) => s.outcome === "scheduled" && lessonEnd(s) >= now)
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime))[0];
}
export function nextTasks(tasks: TaskDto[]): TaskDto[] {
  const rank = {
    revision_requested: 0,
    assigned: 1,
    submitted: 2,
    approved: 3,
  };
  return tasks
    .filter((t) => t.status !== "approved")
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        (Date.parse(a.deadline) || Infinity) -
          (Date.parse(b.deadline) || Infinity),
    )
    .slice(0, 3);
}
export function mentorTaskLink(id: string): string {
  return `/student-hub/tasks?mentorTask=${encodeURIComponent(id)}&source=assigned`;
}
