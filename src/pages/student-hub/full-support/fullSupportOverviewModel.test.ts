import { describe, expect, it } from "vitest";
import type { SessionLogDto, TaskDto } from "src/app/services/fullSupportApi";
import {
  plannedMinutes,
  nextLesson,
  lessonLabel,
  nextTasks,
  mentorTaskLink,
} from "./fullSupportOverviewModel";
const now = Date.parse("2026-10-30T10:00:00Z");
const lesson = (
  id: string,
  dateTime: string,
  changes: Partial<SessionLogDto> = {},
): SessionLogDto => ({
  id,
  dateTime,
  duration: "60m",
  description: "Review",
  done: false,
  outcome: "scheduled",
  attendance: "unknown",
  actualDurationMinutes: null,
  sharedNotes: "",
  homework: [],
  ...changes,
});
const task = (
  id: string,
  status: TaskDto["status"],
  deadline = "2026-11-03",
): TaskDto => ({
  id,
  status,
  deadline,
  task: id,
  studentUserId: "student",
  reviewHistory: [],
  hasFeedback: false,
});
describe("Full Support overview", () => {
  it("keeps an ongoing lesson as next and ignores cancelled or ended bookings", () => {
    const ongoing = lesson("ongoing", "2026-10-30T09:30:00Z");
    expect(
      nextLesson(
        [
          lesson("old", "2026-10-29T10:00:00Z"),
          lesson("cancelled", "2026-10-30T10:15:00Z", { outcome: "cancelled" }),
          lesson("future", "2026-10-31T10:00:00Z"),
          ongoing,
        ],
        now,
      )?.id,
    ).toBe("ongoing");
    expect(lessonLabel(ongoing, now)).toBe("In progress");
    expect(lessonLabel(lesson("ended", "2026-10-30T08:00:00Z"), now)).toBe(
      "Awaiting mentor record",
    );
  });
  it("uses duration units consistently and does not turn unrecorded bookings into attendance", () => {
    expect(plannedMinutes("1h")).toBe(60);
    expect(plannedMinutes("60m")).toBe(60);
    expect(plannedMinutes("1.5")).toBe(90);
    expect(plannedMinutes("45min")).toBe(45);
    expect(
      lessonLabel(
        lesson("held", "2026-10-29T08:00:00Z", {
          outcome: "held",
          attendance: "unknown",
        }),
        now,
      ),
    ).toBe("Held");
    expect(
      nextLesson(
        [
          lesson("no-show", "2026-10-31T10:00:00Z", {
            outcome: "student_no_show",
          }),
        ],
        now,
      ),
    ).toBeUndefined();
  });
  it("prioritizes revision work, limits previews and leaves approved work in the canonical task screen", () => {
    const tasks = [
      task("approved", "approved"),
      task("submitted", "submitted"),
      task("later", "assigned", "2026-11-06"),
      task("revision", "revision_requested"),
      task("earlier", "assigned", "2026-11-01"),
    ];
    expect(nextTasks(tasks).map((t) => t.id)).toEqual([
      "revision",
      "earlier",
      "later",
    ]);
    expect(tasks).toHaveLength(5);
    expect(mentorTaskLink("task / 1")).toBe(
      "/student-hub/tasks?mentorTask=task%20%2F%201&source=assigned",
    );
  });
});
