import { describe, expect, it } from 'vitest';
import { onboardingRequestError } from './requestError';

describe('onboardingRequestError', () => {
  it('turns backend validation objects into displayable text', () => {
    expect(onboardingRequestError({ status: 400, data: { message: [
      { property: 'linkedin', constraints: { matches: 'linkedin must be an official LinkedIn URL' }, children: [] },
    ] } })).toEqual({ conflict: false, message: 'linkedin must be an official LinkedIn URL' });
  });

  it('uses a safe message if the response contains no text', () => {
    expect(onboardingRequestError({ status: 500, data: { message: [{ property: 'field' }] } }).message)
      .toBe('We could not save this step. Your answers are still here; please retry.');
  });

  it('hides the backend regular expression for invalid mentor dates', () => {
    expect(onboardingRequestError({ status: 400, data: { message: [
      { property: 'startDate', constraints: { matches: 'startDate must match /\\d{4}-(?:0[1-9]|1[0-2])$/ regular expression' } },
    ] } }).message).toBe('Enter the start date as Month YYYY, for example September 2021.');
  });

  it('shows a phone-specific message without treating the response as a revision conflict', () => {
    expect(onboardingRequestError({
      status: 409,
      data: {
        code: 'PHONE_NUMBER_IN_USE',
        message: 'This phone number is already linked to another account.',
      },
    })).toEqual({
      conflict: false,
      message: 'This phone number is already linked to another account. Use a different number to continue.',
    });
  });
});
