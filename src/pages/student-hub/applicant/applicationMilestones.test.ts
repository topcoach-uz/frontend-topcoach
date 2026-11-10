import { describe, expect, it } from "vitest";
import { buildApplicationMilestones } from "./applicationMilestones";

describe("application deadline timeline", () => {
  it("excludes completed and cancelled tasks and opens the exact personal task", () => {
    const result = buildApplicationMilestones(
      [],
      [
        { id: "open", title: "Open", status: "pending", dueDate: "2026-11-01" },
        {
          id: "done",
          title: "Done",
          status: "completed",
          dueDate: "2026-11-01",
        },
        {
          id: "cancelled",
          title: "Cancelled",
          status: "cancelled",
          dueDate: "2026-11-01",
        },
      ] as any,
      [],
      [],
      [],
    );
    expect(result.map((row) => row.id)).toEqual(["task-open"]);
    expect(result[0].path).toContain("task=open");
  });
  it("uses canonical application deadlines and does not duplicate earlier mentor plans", () => {
    const result = buildApplicationMilestones(
      [{id:"a",status:"applying",deadline:"2026-11-02",universityName:"University"}] as any,
      [],
      [
        {
          id: "s",
          scholarshipName: "Award",
          organization: "Foundation",
          status: "applying",
          applicationDeadline: "2026-11-03",
        },
      ] as any,
      [
        {
          id: "t",
          task: "Homework",
          status: "assigned",
          deadline: "2026-11-01",
        },
      ] as any,
      [
        {
          id: "p",
          program: "Plan",
          stage: "essay",
          status: "in progress",
          deadline: "2026-11-02",
        },
      ] as any,
    );
    expect(result.map((row) => row.id)).toEqual([
      "mentor-task-t",
      "application-a",
      "scholarship-s",
    ]);
    expect(result[0].path).toContain("mentorTask=t");
  });
  it("omits missing or invalid dates and finished mentor work", () => {
    const result = buildApplicationMilestones(
      [{ id: "a", status: "applying", deadline: "invalid" }] as any,
      [],
      [],
      [
        {
          id: "done",
          task: "Done",
          status: "approved",
          deadline: "2026-11-01",
        },
      ] as any,
      [
        { id: "p", program: "Plan", status: "in progress", deadline: null },
      ] as any,
    );
    expect(result).toEqual([]);
  });
});
