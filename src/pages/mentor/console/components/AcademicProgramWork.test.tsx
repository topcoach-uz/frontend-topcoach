import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicProgramWork from "./AcademicProgramWork";
const state = vi.hoisted(() => ({ query: {} as any, isMentor: true }));
vi.mock("src/app/services/mentorProgramsApi", () => ({
  useGetMentorProgramEnrollmentsQuery: () => state.query,
  useRecordMentorProgramWorkMutation: () => [vi.fn(), {}],
}));
vi.mock("../MentorConsoleContext", () => ({
  useMentorConsole: () => ({ id: "mentor", isMentor: state.isMentor }),
}));
beforeEach(() => {
  state.query = { data: { data: [] } };
  state.isMentor = true;
});
describe("Academic program work access and state", () => {
  it("shows the assigned program, real budget and recording action", () => {
    state.query.data.data = [
      {
        id: "program",
        assignmentId: "assignment",
        studentUserId: "student",
        studentName: "QA Student",
        program: "customized",
        role: "individual",
        usedMinutes: 90,
        allocatedMinutes: 300,
        remainingMinutes: 210,
      },
    ];
    const html = renderToStaticMarkup(
      <AcademicProgramWork studentId="student" />,
    );
    expect(html).toContain("Record program work");
    expect(html).toContain("Customized Program");
    expect(html).toContain("1.5h of 5h used");
    expect(html).toContain("3.5h remaining");
    expect(html).not.toContain("Full Support");
  });
  it("does not show another student’s assignments in this workspace", () => {
    state.query.data.data = [
      {
        studentUserId: "other",
        assignmentId: "assignment",
        program: "customized",
      },
    ];
    expect(
      renderToStaticMarkup(<AcademicProgramWork studentId="student" />),
    ).not.toContain("Record program work");
  });
  it("shows a retryable failure rather than treating it as no assignments", () => {
    state.query = { isError: true, refetch: vi.fn() };
    expect(renderToStaticMarkup(<AcademicProgramWork />)).toContain(
      "Could not load program assignments",
    );
  });
  it("does not offer recording to a staff member previewing the mentor console", () => {
    state.isMentor = false;
    expect(renderToStaticMarkup(<AcademicProgramWork />)).toBe("");
  });
});
