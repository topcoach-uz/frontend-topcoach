import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PREVIEW_STORAGE_KEY,
  initialValues,
  nextScreen,
  readDraft,
  safeDraft,
  screenByKey,
  screens,
  validateScreen,
  type Values,
} from './model';

const screen = (key: string) => {
  const result = screenByKey[key];
  if (!result) throw new Error(`Missing fixture screen: ${key}`);
  return result;
};

describe('onboarding preview screen registry', () => {
  it('contains 41 unique, addressable screen routes', () => {
    const keys = screens.map(({ key }) => key);

    expect(keys).toHaveLength(41);
    expect(new Set(keys).size).toBe(41);
    expect(Object.keys(screenByKey).sort()).toEqual([...keys].sort());
  });

  it('only links to valid screen routes', () => {
    for (const current of screens) {
      const targets = [
        current.next,
        current.back,
        current.secondaryTo,
        ...Object.values(current.optionLinks ?? {}),
      ].filter((target): target is string => Boolean(target));

      for (const target of targets) {
        expect(screenByKey[target], `${current.key} links to ${target}`).toBeDefined();
      }
    }
  });

  it.each([
    ['bachelor', 'b-basics'],
    ['master', 'm-basics'],
    ['mentor', 'mentor-profile'],
  ] as const)('branches the goal route for %s applicants', (degree, expected) => {
    expect(nextScreen(screen('goal'), degree)).toBe(expected);
  });

  it('uses the declared next route outside the goal branch', () => {
    expect(nextScreen(screen('signup'), 'mentor')).toBe('verify');
  });
});

describe('onboarding preview validation', () => {
  it('explains the mentor date format without showing a regular expression', () => {
    const values = { ...initialValues(), 'mentor:Start date · optional': '2021' };
    expect(validateScreen(screen('mentor-academic'), values)['mentor:Start date · optional'])
      .toBe('Enter the start date as Month YYYY, for example September 2021.');
  });
  it.each(['20', '1899', '2101', 'abcd'])('rejects invalid graduation year %s', year => {
    const values = { ...initialValues(), 'validation:Graduation year': year };

    expect(validateScreen(screen('state-validation'), values)['validation:Graduation year'])
      .toBe('Enter a year from 1900 to 2100.');
  });

  it.each(['1900', '2028', '2100'])('accepts graduation year %s', year => {
    const values = {
      ...initialValues(),
      'validation:First name': 'Dilnoza',
      'validation:Country of residence': 'Uzbekistan',
      'validation:Graduation year': year,
    };

    expect(validateScreen(screen('state-validation'), values)).toEqual({});
  });

  it('requires a complex signup password and matching confirmation', () => {
    const values: Values = {
      ...initialValues(),
      'Full name': 'Dilnoza Karimova',
      Email: 'dilnoza@example.com',
      Password: 'weak',
      'Confirm password': 'different',
    };
    const errors = validateScreen(screen('signup'), values);

    expect(errors.Password).toMatch(/uppercase, lowercase, a number and a symbol/i);
    expect(errors['Confirm password']).toBe('Passwords must match.');

    values.Password = 'Strong1!';
    values['Confirm password'] = 'Strong1!';
    expect(validateScreen(screen('signup'), values)).toEqual({});
  });

  it('does not require optional fields', () => {
    const values = {
      ...initialValues(),
      'First name': 'Dilnoza',
      'Last name': 'Karimova',
      'Country of residence': 'Uzbekistan',
      'Preferred language': 'English',
      'Phone number · optional': '',
    };

    expect(validateScreen(screen('b-basics'), values)).toEqual({});
  });
});

describe('safe onboarding preview drafts', () => {
  const unsafeKeys = [
    'Email',
    'Password',
    'Confirm password',
    'Phone number · optional',
    'About you',
    'Why do you want to mentor?',
    'Value you bring',
    'Mentoring experience',
    'Professional background',
    'Connection code',
  ];

  it('keeps allowlisted profile basics while excluding credentials, contact data and free text', () => {
    const input: Values = {
      'First name': 'Dilnoza',
      'Country of residence': 'Uzbekistan',
      University: 'TopCoach University',
      Email: 'private@example.com',
      Password: 'Strong1!',
      'Confirm password': 'Strong1!',
      'Phone number · optional': '+998900000000',
      'About you': 'Private biography',
      'Why do you want to mentor?': 'Private motivation',
      'Value you bring': 'Private answer',
      'Mentoring experience': 'Private answer',
      'Professional background': 'Private answer',
      'Connection code': 'ABC123',
    };

    const draft = safeDraft(input);

    expect(draft).toMatchObject({
      'First name': 'Dilnoza',
      'Country of residence': 'Uzbekistan',
      University: 'TopCoach University',
    });
    expect(unsafeKeys.every(key => !(key in draft))).toBe(true);
  });

  describe('readDraft', () => {
    const storage = new Map<string, string>();
    const sessionStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      key: vi.fn((index: number) => [...storage.keys()][index] ?? null),
      get length() { return storage.size; },
    };

    beforeEach(() => {
      storage.clear();
      vi.stubGlobal('sessionStorage', sessionStorage);
    });

    afterEach(() => vi.unstubAllGlobals());

    it.each([
      ['malformed JSON', '{'],
      ['missing payload', 'null'],
      ['unknown screen', JSON.stringify({ screen: 'missing', degree: 'bachelor', values: {} })],
      ['unknown degree', JSON.stringify({ screen: 'goal', degree: 'doctorate', values: {} })],
      ['non-object values', JSON.stringify({ screen: 'goal', degree: 'bachelor', values: 'nope' })],
      ['array values', JSON.stringify({ screen: 'goal', degree: 'bachelor', values: [] })],
    ])('rejects %s', (_label, stored) => {
      storage.set(PREVIEW_STORAGE_KEY, stored);
      expect(readDraft()).toBeNull();
    });

    it('drops non-string and sensitive values from an otherwise valid draft', () => {
      storage.set(PREVIEW_STORAGE_KEY, JSON.stringify({
        screen: 'm-education',
        degree: 'master',
        values: {
          'First name': 'Dilnoza',
          University: 'TopCoach University',
          'Graduation year': 2028,
          Email: 'private@example.com',
          Password: 'Strong1!',
          'About you': 'Private biography',
          unexpected: 'not allowlisted',
        },
      }));

      expect(readDraft()).toEqual({
        screen: 'm-education',
        degree: 'master',
        values: {
          'First name': 'Dilnoza',
          University: 'TopCoach University',
        },
      });
    });
  });
});
