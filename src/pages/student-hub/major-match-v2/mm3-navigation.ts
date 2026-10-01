import { MM3_QUESTION_ORDER } from './mm3-content';

export type MM3Step = 'intro' | 'questions' | 'review' | 'analyzing' | 'results';

const steps: readonly string[] = ['intro', 'questions', 'review', 'analyzing', 'results'];

/** Keep links and restored drafts within the 30-question assessment. */
export const clampMm3Index = (index: number): number =>
  Number.isFinite(index)
    ? Math.min(Math.max(Math.floor(index), 0), MM3_QUESTION_ORDER.length - 1)
    : 0;

export const readMm3Location = (params: URLSearchParams, resumeIndex = 0) => {
  const requestedStep = params.get('step');
  const rawQuestion = params.get('question');
  const question = rawQuestion ? Number(rawQuestion) : undefined;
  const editPart = Number(params.get('editPart'));
  return {
    step: (requestedStep && steps.includes(requestedStep) ? requestedStep : 'intro') as MM3Step,
    currentIndex: question !== undefined ? clampMm3Index(question - 1) : clampMm3Index(resumeIndex),
    editPart: editPart >= 1 && editPart <= 3 && Number.isInteger(editPart) ? editPart : undefined,
  };
};

/** Preserve the containing workspace's query parameters and browser history. */
export const writeMm3Location = (
  params: URLSearchParams,
  step: MM3Step,
  currentIndex = 0,
  editPart?: number,
): URLSearchParams => {
  const next = new URLSearchParams(params);
  next.set('step', step);
  if (step === 'questions') next.set('question', String(clampMm3Index(currentIndex) + 1));
  else next.delete('question');
  if (step === 'questions' && editPart) next.set('editPart', String(editPart));
  else next.delete('editPart');
  return next;
};
