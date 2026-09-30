type ValidationError = {
  property?: unknown;
  constraints?: unknown;
  children?: unknown;
};

function readableValidationMessage(property: unknown, message: string): string {
  if (!/regular expression|must match\s*\//i.test(message)) return message;
  if (property === 'startDate') return 'Enter the start date as Month YYYY, for example September 2021.';
  if (property === 'endDate') return 'Enter the end date as Month YYYY, for example June 2025.';
  if (property === 'linkedin') return 'Enter a full LinkedIn profile URL beginning with https://linkedin.com/.';
  return 'Check the format of this field and try again.';
}

function validationMessages(value: unknown): string[] {
  if (typeof value === 'string') return [readableValidationMessage(undefined, value)];
  if (Array.isArray(value)) return value.flatMap(validationMessages);
  if (!value || typeof value !== 'object') return [];

  const error = value as ValidationError;
  const constraints = error.constraints && typeof error.constraints === 'object'
    ? Object.values(error.constraints).filter((message): message is string => typeof message === 'string')
      .map(message => readableValidationMessage(error.property, message))
    : [];
  return [...constraints, ...validationMessages(error.children)];
}

export function onboardingRequestError(error: unknown): { conflict: boolean; message: string } {
  const problem = error as { status?: number | string; data?: { code?: unknown; message?: unknown } } | null;
  if (problem?.data?.code === 'PHONE_NUMBER_IN_USE') return {
    conflict: false,
    message: 'This phone number is already linked to another account. Use a different number to continue.',
  };
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
