import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  tab: "lessons",
  enrollment: { data: undefined, isLoading: false, isError: false } as {
    data?: { isEnrolled: boolean; canAccessLearning: boolean };
    isLoading: boolean;
    isError: boolean;
  },
  structure: vi.fn(() => ({ data: [] })),
  progress: vi.fn(() => ({ data: undefined })),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams({ tab: state.tab }), vi.fn()],
}));
vi.mock("src/app/services/courses", () => ({
  useGetEnrollmentStatusQuery: () => ({
    ...state.enrollment,
    refetch: vi.fn(),
  }),
  useGetCourseStructureQuery: state.structure,
  useGetUserProgressQuery: state.progress,
}));
vi.mock("src/app/services/sat-prep", () => ({
  useSatSkillCountsQuery: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock("src/app/services/sat-prep/library", () => ({
  useGetMarkedQuestionsQuery: () => ({ data: [] }),
  useGetVocabularyQuery: () => ({ data: [] }),
  useClearVocabularyMutation: () => [vi.fn(), {}],
  useRemoveVocabularyMutation: () => [vi.fn(), {}],
  useUnmarkQuestionMutation: () => [vi.fn(), {}],
}));
import SatLibraryPage from "./SatLibraryPage";

describe("SAT Library lesson access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.tab = "lessons";
    state.enrollment = { isLoading: false, isError: false };
  });
  const render = () => renderToStaticMarkup(<SatLibraryPage />);
  const expectSkipped = (skip: boolean) => {
    expect(state.structure).toHaveBeenCalledWith("sat", { skip });
    expect(state.progress).toHaveBeenCalledWith("sat", { skip });
  };
  it("waits for enrollment before requesting protected lesson data", () => {
    state.enrollment.isLoading = true;
    expect(render()).toContain("Loading lessons");
    expectSkipped(true);
  });
  it("offers practice without requesting lessons for unenrolled users", () => {
    state.enrollment.data = { isEnrolled: false, canAccessLearning: false };
    expect(render()).toContain("SAT lessons require course enrollment");
    expectSkipped(true);
  });
  it("shows pending access without requesting protected content", () => {
    state.enrollment.data = { isEnrolled: true, canAccessLearning: false };
    expect(render()).toContain("SAT lesson access is pending");
    expectSkipped(true);
  });
  it("loads lessons and progress for an approved course enrollment", () => {
    state.enrollment.data = { isEnrolled: true, canAccessLearning: true };
    render();
    expectSkipped(false);
  });
  it.each(["practice", "marked", "vocabulary"])(
    "does not request course content from the %s tab",
    (tab) => {
      state.tab = tab;
      state.enrollment.data = { isEnrolled: true, canAccessLearning: true };
      render();
      expectSkipped(true);
    },
  );
  it("distinguishes an enrollment check failure from missing enrollment", () => {
    state.enrollment.isError = true;
    expect(render()).toContain("We couldn’t check your lesson access");
    expectSkipped(true);
  });
});
