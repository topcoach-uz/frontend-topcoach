import screenData from './screens.json';

export type Degree = 'bachelor' | 'master' | 'mentor';
export type Values = Record<string, string>;
export type Part = {
  kind: string; label?: string; value?: string; error?: string | boolean;
  title?: string; desc?: string; text?: string; tone?: string; style?: string;
  selected?: boolean; items?: Part[];
};
export type Screen = {
  key: string; group: string; title: string; hero: string; intro: string;
  parts: Part[]; cta: string; step: string; next?: string; back?: string;
  secondary?: string; secondaryTo?: string; optionLinks?: Record<string, string>;
};
export const screens = screenData as Screen[];
export const screenByKey: Record<string, Screen> = Object.assign(Object.create(null), Object.fromEntries(screens.map(screen => [screen.key, screen])));
export const PREVIEW_STORAGE_KEY = 'topcoach:onboarding-design-preview:v1';
export const cleanValue = (value = '') => value.replace(/\s*⌄/g, '').replace(/\n/g, ' ').trim();

export function valueKey(label: string, screen: string): string {
  if (screen === 'state-manual') return `manual:${label}`;
  const prefix = screen.startsWith('mentor-') ? 'mentor:' : '';
  const aliases: Record<string, string> = {
    'University name': 'University', 'Major / field of study': 'Field of study',
  };
  if (label.startsWith('Field for your')) return screen.startsWith('b-') ? 'b:targetField' : 'm:targetField';
  if (screen === 'state-validation') return `validation:${label}`;
  return prefix + (aliases[label] || label);
}

export const fieldsOf = (screen: Screen): Part[] => screen.parts.flatMap(part =>
  part.kind === 'row' ? part.items || [] : part.kind === 'field' ? [part] : [],
);

export function initialValues(): Values {
  const result: Values = {};
  for (const screen of screens.filter(s => !s.key.startsWith('state-'))) {
    for (const part of fieldsOf(screen)) {
      if (!part.label || part.label.includes('EDIT')) continue;
      const key = valueKey(part.label, screen.key);
      if (result[key] !== undefined) continue;
      result[key] = part.label.toLowerCase().includes('password') || part.label.startsWith('If other')
        ? '' : cleanValue(part.value);
    }
  }
  return {
    ...result,
    'validation:First name': '', 'validation:Last name': 'Karimova',
    'validation:Country of residence': '', 'validation:Graduation year': '20',
    'Country of university': 'Uzbekistan',
  };
}

export function validateScreen(screen: Screen, values: Values): Values {
  const errors: Values = {};
  for (const field of fieldsOf(screen)) {
    const label = field.label || '';
    if (label.includes('optional') || label.includes('EDIT')) continue;
    const key = valueKey(label, screen.key);
    const value = (values[key] || '').trim();
    if (!value) errors[key] = `Enter ${label.toLowerCase()}.`;
    else if (label === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[key] = 'Enter a valid email address.';
    else if (label === 'Graduation year' && (!/^\d{4}$/.test(value) || +value < 1900 || +value > 2100)) errors[key] = 'Enter a year from 1900 to 2100.';
    else if (label === 'Password' && screen.key === 'signup' && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value)) errors[key] = 'Use 8+ characters with uppercase, lowercase, a number and a symbol (@$!%*?&).';
    else if (label === 'Confirm password' && value !== values.Password) errors[key] = 'Passwords must match.';
    else if (label === 'Connection code' && !/^[A-Z0-9]{6}$/.test(value)) errors[key] = 'Enter the six-character code.';
  }
  return errors;
}

export function nextScreen(screen: Screen, degree: Degree): string | undefined {
  if (screen.key === 'goal') return degree === 'mentor' ? 'mentor-profile' : degree === 'master' ? 'm-basics' : 'b-basics';
  return screen.next;
}

// Deliberately exclude credentials, email, phone, uploads and open-ended text.
// This stores only a small browser-local preview draft, never a real profile.
export function safeDraft(values: Values): Values {
  const keys = ['First name', 'Last name', 'Country of residence', 'Preferred language',
    'Current education stage', 'University', 'Bachelor’s status', 'Graduation year',
    'Bachelor’s qualification', 'Field of study', 'b:targetField', 'm:targetField',
    'mentor:Full name', 'mentor:University', 'mentor:Field of study', 'mentor:Languages you can mentor in'];
  return Object.fromEntries(keys.filter(key => values[key] !== undefined).map(key => [key, values[key]]));
}

export function readDraft(): { screen: string; degree: Degree; values: Values } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PREVIEW_STORAGE_KEY) || 'null');
    if (!value || !screenByKey[value.screen] || !['bachelor', 'master', 'mentor'].includes(value.degree)) return null;
    if (value.values !== undefined && (!value.values || typeof value.values !== 'object' || Array.isArray(value.values))) return null;
    const values = Object.fromEntries(Object.entries(value.values || {}).filter(([, v]) => typeof v === 'string')) as Values;
    return { screen: value.screen, degree: value.degree, values: safeDraft(values) };
  } catch { return null; }
}
