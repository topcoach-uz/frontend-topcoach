import { applicantLinks } from "src/lib/applicantWorkspace";

export type NextStepKey = "major-match" | "universities" | "essays" | "documents";

export type NextStepInput = {
  degree: "bachelor" | "master";
  /** undefined while loading or on error: no suggestion is made until the answer is known. */
  hasMajorMatch?: boolean;
  collegeListCount?: number;
  essayCount?: number;
  documentCount?: number;
};

export type NextStep = {
  key: NextStepKey;
  step: number;
  total: number;
  title: string;
  body: string;
  cta: string;
  to: string;
};

/** Returns the single next step in the application journey, or null when everything is started or data is unknown. */
export function selectNextStep(input: NextStepInput): NextStep | null {
  const steps: Array<{ key: NextStepKey; done: boolean | undefined; title: string; body: string; cta: string; to: string }> = [];
  if (input.degree === "bachelor") {
    steps.push({ key: "major-match", done: input.hasMajorMatch, title: "Find majors that fit you", body: "Take AI Major Match to get a ranked list of majors and universities.", cta: "Take Major Match", to: applicantLinks.majorMatch });
  }
  steps.push(
    { key: "universities", done: input.collegeListCount === undefined ? undefined : input.collegeListCount > 0, title: "Build your College List", body: "Find universities and add a few to your list.", cta: "Find universities", to: applicantLinks.universities },
    { key: "essays", done: input.essayCount === undefined ? undefined : input.essayCount > 0, title: "Start your first essay", body: "A rough first draft is enough to begin.", cta: "Start an essay", to: `${applicantLinks.essays}?action=new` },
    { key: "documents", done: input.documentCount === undefined ? undefined : input.documentCount > 0, title: "Upload your documents", body: "Keep your transcript and test scores in one place.", cta: "Add documents", to: applicantLinks.documents },
  );
  const index = steps.findIndex((step) => step.done !== true);
  // An unknown earlier answer blocks the suggestion: never point at a later step on guesswork.
  if (index === -1 || steps[index].done === undefined) return null;
  const { done: _done, ...step } = steps[index];
  return { ...step, step: index + 1, total: steps.length };
}
