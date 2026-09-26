type ValidationError = {
  property?: unknown;
  constraints?: unknown;
  children?: unknown;
};

function validationMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(validationMessages);
  if (!value || typeof value !== 'object') return [];

  const error = value as ValidationError;
  const constraints = error.constraints && typeof error.constraints === 'object'
    ? Object.values(error.constraints).filter((message): message is string => typeof message === 'string')
    : [];
  return [...constraints, ...validationMessages(error.children)];
}

export function onboardingRequestError(error: unknown): { conflict: boolean; message: string } {
  const problem = error as { status?: number | string; data?: { message?: unknown } } | null;
  if (problem?.status === 409) return {
    conflict: true,
    message: 'This onboarding was updated in another tab. Reload the saved version before continuing.',
  };
  if (problem?.status === 'FETCH_ERROR') return {
    conflict: false,
    message: 'You appear to be offline. Your answers are still here—retry when you are connected.',
  };
  const messages = validationMessages(problem?.data?.message);
  return {
    conflict: false,
    message: messages[0] || 'We could not save this step. Your answers are still here; please retry.',
  };
}
