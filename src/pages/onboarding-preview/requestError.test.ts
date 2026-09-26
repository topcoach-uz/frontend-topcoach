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
});
