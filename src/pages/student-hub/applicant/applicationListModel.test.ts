import { describe, expect, it } from "vitest";
import {
  applicationGroups,
  filterApplications,
  groupMilestones,
} from "./applicationListModel";
import { buildApplicationMilestones } from "./applicationMilestones";
import type { CollegeApplication } from "src/app/services/student-hub/types";
const apps = [
  {
    id: "accepted",
    universityName: "Oxford",
    status: "accepted",
    deadline: "2027-01-01",
  },
  {
    id: "preparing",
    universityName: "Cambridge",
    major: "Computer Science",
    intake: "Autumn 2027",
    status: "applying",
    deadline: "2026-12-01",
  },
  { id: "saved", universityName: "Harvard", status: "researching" },
  {
    id: "submitted",
    universityName: "Stanford",
    status: "submitted",
    deadline: "2026-11-01",
  },
] as CollegeApplication[];

describe("application list filters", () => {
  it("separates preparation, submissions and decisions", () => {
    expect(
      filterApplications(apps, "", "preparing", "deadline").map(
        (app) => app.id,
      ),
    ).toEqual(["preparing"]);
    expect(
      filterApplications(apps, "", "submitted", "deadline").map(
        (app) => app.id,
      ),
    ).toEqual(["submitted"]);
    expect(applicationGroups.decisions).toContain("waitlisted");
    expect(
      filterApplications(apps, "", "decisions", "deadline").map(
        (app) => app.id,
      ),
    ).toEqual(["accepted"]);
  });
  it("searches program and intake, ignores case and combines status filters", () => {
    expect(
      filterApplications(apps, "  COMPUTER ", "all", "name").map(
        (app) => app.id,
      ),
    ).toEqual(["preparing"]);
    expect(filterApplications(apps, "2027", "preparing", "name")).toHaveLength(
      1,
    );
    expect(
      filterApplications(apps, "Oxford", "preparing", "name"),
    ).toHaveLength(0);
  });
  it("sorts missing or invalid deadlines last without mutating query data", () => {
    const entries = [
      ...apps,
      {
        id: "invalid",
        universityName: "Yale",
        deadline: "invalid",
        status: "applying",
      } as CollegeApplication,
    ];
    expect(
      filterApplications(entries, "", "all", "deadline").map((app) => app.id),
    ).toEqual(["submitted", "preparing", "accepted", "saved", "invalid"]);
    expect(entries[0].id).toBe("accepted");
    expect(filterApplications(apps, "", "all", "name")[0].universityName).toBe(
      "Cambridge",
    );
  });
});
describe("deadline grouping", () => {
  it("keeps actionable past dates overdue and submitted dates in history", () => {
    const entries = buildApplicationMilestones(apps, [], [], [], []);
    const grouped = groupMilestones(entries, new Date(2026, 11, 2));
    expect(grouped.Overdue.map((item) => item.id)).toEqual([
      "application-preparing",
    ]);
    expect(grouped.Past.map((item) => item.id)).toEqual([
      "application-submitted",
    ]);
  });
  it("uses local calendar boundaries for today and tomorrow", () => {
    const grouped = groupMilestones(
      [
        {
          id: "task-today",
          date: "2026-11-24",
          title: "Today",
          detail: "",
          path: "",
        },
        {
          id: "task-tomorrow",
          date: "2026-11-25",
          title: "Tomorrow",
          detail: "",
          path: "",
        },
        {
          id: "task-overdue",
          date: "2026-11-23",
          title: "Late",
          detail: "",
          path: "",
        },
      ],
      new Date(2026, 10, 24, 23, 59),
    );
    expect(grouped.Today.map((item) => item.id)).toEqual(["task-today"]);
    expect(grouped.Upcoming.map((item) => item.id)).toEqual(["task-tomorrow"]);
    expect(grouped.Overdue.map((item) => item.id)).toEqual(["task-overdue"]);
  });
});
