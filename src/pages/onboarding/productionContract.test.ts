import { describe, expect, it } from 'vitest';
import type { OnboardingState } from 'src/app/services/onboardingApi';
import { buildStepMutation, hydrateProductionState, nextAfterSkip, shouldUseOnboardingV2 } from './productionContract';

describe('production onboarding contract', () => {
  it.each(['master', 'mentor'] as const)('round-trips %s university country', (degree) => {
    const key = degree === 'mentor' ? 'mentor:Country of university' : 'Country of university';
    const endpointScreen = degree === 'mentor' ? 'mentor-academic' : 'm-education';
    expect(buildStepMutation(endpointScreen, degree, { [key]: 'Uzbekistan' }, {}, 'save')?.payload).toMatchObject({ universityCountry: 'Uzbekistan' });
    const state: OnboardingState = { path: degree, currentStep: endpointScreen, revision: 1, onboardingVersion: 2, telegramConnected: false,
      student: { universityCountry: 'Uzbekistan' }, mentor: { universityCountry: 'Uzbekistan' } };
    expect(hydrateProductionState(state).values[key]).toBe('Uzbekistan');
  });
  it('serializes bachelor choices with stable machine keys', () => {
    expect(buildStepMutation('b-support', 'bachelor', {}, {
      'b-support': ['Choose a university', 'SAT / ACT preparation', 'Join the community'],
    }, 'continue')).toEqual({
      endpoint: 'student-support',
      payload: { supportReasons: ['university_selection', 'sat_act_prep', 'community'] },
    });
  });

  it('serializes master education with the frozen flat wire shape', () => {
    expect(buildStepMutation('m-education', 'master', {
      'Bachelor’s status': 'Graduated',
      'Graduation year': '2024',
      University: 'University of Manchester',
      'Bachelor’s qualification': 'BSc',
      'Field of study': 'Data Science',
    }, {}, 'continue')).toEqual({
      endpoint: 'student-education',
      payload: {
        bachelorsStatus: 'graduated',
        universityCountry: null,
        graduationYear: 2024,
        university: 'University of Manchester',
        bachelorsQualification: 'BSc',
        priorFieldOfStudy: 'Data Science',
      },
    });
  });

  it('separates destination countries, regions and explicit unsure state', () => {
    expect(buildStepMutation('m-direction', 'master', {
      'm:targetField': 'Artificial Intelligence',
      'Preferred destinations · optional': 'United Kingdom, Europe',
      'Intended start · optional': 'Spring 2027',
    }, {}, 'continue')).toEqual({
      endpoint: 'student-direction',
      payload: {
        intendedMajor: 'Artificial Intelligence',
        intendedMajorUnsure: false,
        targetCountries: ['gb'],
        destinationRegions: ['europe'],
        destinationUnsure: false,
        intakeTerm: 'spring',
        intakeYear: 2027,
        intakeUnsure: false,
      },
    });
    expect(buildStepMutation('b-direction', 'bachelor', {
      'b:targetField': 'Not sure yet',
      'Preferred destinations · optional': 'Not sure yet',
      'Intended start · optional': 'Not sure yet',
    }, {}, 'continue')?.payload).toMatchObject({ intendedMajor: null, intendedMajorUnsure: true, destinationUnsure: true, intakeUnsure: true });
  });

  it('clears skipped support and records a skipped referral explicitly', () => {
    expect(buildStepMutation('b-support', 'bachelor', {}, { 'b-support': ['Find a mentor'] }, 'skip')?.payload).toEqual({ supportReasons: [] });
    expect(buildStepMutation('m-referral', 'master', {}, { referral: ['Instagram'] }, 'skip')?.payload).toEqual({
      hearAboutSource: 'prefer_not_to_say', hearAboutOther: null,
    });
    expect(nextAfterSkip('m-telegram-code')).toBe('m-review');
  });

  it('normalizes mentor dates to YYYY-MM', () => {
    expect(buildStepMutation('mentor-academic', 'mentor', {
      'mentor:Languages you can mentor in': 'English, Русский',
      'mentor:University': 'MIT',
      'mentor:Field of study': 'Computer Science',
      'mentor:Start date · optional': 'September 2021',
      'mentor:End date · optional': '2025-06-15',
    }, {}, 'continue')?.payload).toMatchObject({ languages: ['en', 'ru'], startDate: '2021-09', endDate: '2025-06' });
  });

  it('hydrates a resumable master draft from the server response', () => {
    const state: OnboardingState = {
      path: 'master', currentStep: 'm-direction', revision: 7, onboardingVersion: 2,
      telegramConnected: true, hearAboutSource: 'friend', hearAboutOther: null,
      student: {
        firstName: 'Amina', lastName: 'Karimova', preferredLanguage: 'uz', bachelorsStatus: 'graduated',
        graduationYear: 2024, intendedMajor: 'Economics', targetCountries: ['gb'], destinationRegions: ['europe'],
        intakeTerm: 'autumn', intakeYear: 2027, supportReasons: ['mentor_matching'],
      },
    };
    const restored = hydrateProductionState(state);
    expect(restored.screen).toBe('m-direction');
    expect(restored.values).toMatchObject({ 'First name': 'Amina', 'Last name': 'Karimova', 'Preferred language': 'O‘zbek', 'm:targetField': 'Economics' });
    expect(restored.choices).toMatchObject({ 'm-support': ['Find a mentor'], referral: ['A friend'] });
    expect(restored.telegram).toBe(true);
  });

  it('restores an explicit undecided major separately from an unanswered major', () => {
    const base: OnboardingState = { path: 'bachelor', currentStep: 'b-direction', revision: 2, onboardingVersion: 2, telegramConnected: false };
    expect(hydrateProductionState({ ...base, student: { intendedMajor: null, intendedMajorUnsure: true } }).values['b:targetField']).toBe('Not sure yet');
    expect(hydrateProductionState({ ...base, student: { intendedMajor: null, intendedMajorUnsure: false } }).values['b:targetField']).toBe('');
  });

  it('keeps enrolled v2 users on v2 when new enrollment is disabled', () => {
    expect(shouldUseOnboardingV2(2, false)).toBe(true);
    expect(shouldUseOnboardingV2(1, false)).toBe(false);
    expect(shouldUseOnboardingV2(1, true)).toBe(true);
  });
});
