import type {
  MentorAcademicRequest, MentorExpertiseRequest, MentorOfferRequest, MentorProfileRequest, MentorStoryRequest,
  OnboardingAction, OnboardingMutationMeta, OnboardingPath, OnboardingState, PathRequest, ProgressRequest,
  ReferralRequest, StudentBasicsRequest, StudentDirectionRequest, StudentEducationRequest, StudentSupportRequest,
} from 'src/app/services/onboardingApi';
import type { Degree, Values } from 'src/pages/onboarding-preview/model';

export type ChoiceState = Record<string, string[]>;

type Fields<T> = Omit<T, keyof OnboardingMutationMeta>;
export type PersistableStep =
  | { endpoint: 'path'; payload: Fields<PathRequest> }
  | { endpoint: 'student-basics'; payload: Fields<StudentBasicsRequest> }
  | { endpoint: 'student-education'; payload: Fields<StudentEducationRequest> }
  | { endpoint: 'student-direction'; payload: Fields<StudentDirectionRequest> }
  | { endpoint: 'student-support'; payload: Fields<StudentSupportRequest> }
  | { endpoint: 'referral'; payload: Fields<ReferralRequest> }
  | { endpoint: 'mentor-profile'; payload: Fields<MentorProfileRequest> }
  | { endpoint: 'mentor-academic'; payload: Fields<MentorAcademicRequest> }
  | { endpoint: 'mentor-story'; payload: Fields<MentorStoryRequest> }
  | { endpoint: 'mentor-offer'; payload: Fields<MentorOfferRequest> }
  | { endpoint: 'mentor-expertise'; payload: Fields<MentorExpertiseRequest> }
  | { endpoint: 'progress'; payload: Omit<Fields<ProgressRequest>, 'step'> };

const LANGUAGE_TO_KEY: Record<string, string> = {
  English: 'en',
  'O‘zbek': 'uz',
  'Русский': 'ru',
  Qoraqalpoq: 'kk',
};
const KEY_TO_LANGUAGE = Object.fromEntries(Object.entries(LANGUAGE_TO_KEY).map(([label, key]) => [key, label]));

const STAGE_TO_KEY: Record<string, string> = {
  'Grade 9': 'grade_9',
  'Grade 10': 'grade_10',
  'Grade 11': 'grade_11',
  'Grade 12': 'grade_12',
  'Gap year': 'gap_year',
  'Already graduated': 'graduated',
};
const KEY_TO_STAGE = Object.fromEntries(Object.entries(STAGE_TO_KEY).map(([label, key]) => [key, label]));

const SUPPORT_TO_KEY: Record<string, string> = {
  'Choose a university': 'university_selection',
  'SAT / ACT preparation': 'sat_act_prep',
  'Find a mentor': 'mentor_matching',
  'Application essays': 'application_essays',
  'Personal statement': 'personal_statement',
  'Application planning': 'application_planning',
  'Join the community': 'community',
  'Something else': 'other',
};
const KEY_TO_SUPPORT = Object.fromEntries(Object.entries(SUPPORT_TO_KEY).map(([label, key]) => [key, label]));

const REFERRAL_TO_KEY: Record<string, string> = {
  Instagram: 'instagram',
  Telegram: 'telegram',
  'A friend': 'friend',
  School: 'school',
  Other: 'other',
};
const KEY_TO_REFERRAL = Object.fromEntries(Object.entries(REFERRAL_TO_KEY).map(([label, key]) => [key, label]));

const EXPERTISE_TO_KEY: Record<string, string> = {
  'Bachelor’s admissions': 'bachelors_admissions',
  'Master’s admissions': 'masters_admissions',
  'Personal statements': 'personal_statements',
  'University shortlists': 'university_shortlists',
};
const KEY_TO_EXPERTISE = Object.fromEntries(Object.entries(EXPERTISE_TO_KEY).map(([label, key]) => [key, label]));

const DESTINATION_TO_KEY: Record<string, { kind: 'country' | 'region'; key: string }> = {
  'United States': { kind: 'country', key: 'us' },
  'United Kingdom': { kind: 'country', key: 'gb' },
  Canada: { kind: 'country', key: 'ca' },
  Germany: { kind: 'country', key: 'de' },
  Australia: { kind: 'country', key: 'au' },
  Europe: { kind: 'region', key: 'europe' },
  Asia: { kind: 'region', key: 'asia' },
};
const KEY_TO_DESTINATION = Object.fromEntries(Object.entries(DESTINATION_TO_KEY).map(([label, value]) => [value.key, label]));

const INTAKE_TO_VALUE: Record<string, { term: string | null; year: number | null; state: string }> = {
  'Autumn 2026': { term: 'autumn', year: 2026, state: 'answered' },
  'Spring 2027': { term: 'spring', year: 2027, state: 'answered' },
  'Autumn 2027': { term: 'autumn', year: 2027, state: 'answered' },
  '2028 or later': { term: null, year: 2028, state: 'answered' },
  'Not sure yet': { term: null, year: null, state: 'unsure' },
};

export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `onboarding-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const nullable = (value: string | undefined) => value?.trim() || null;
const list = (value: string | undefined) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
const normalizeMonth = (value: string | undefined) => {
  const cleaned = value?.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d{4})-(0[1-9]|1[0-2])/);
  if (match) return `${match[1]}-${match[2]}`;
  const named = cleaned.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
  if (!named) return cleaned;
  const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(named[1].toLowerCase()) + 1;
  return `${named[2]}-${String(month).padStart(2, '0')}`;
};

function directionPayload(values: Values, degree: Degree) {
  const prefix = degree === 'bachelor' ? 'b' : 'm';
  const targetField = nullable(values[`${prefix}:targetField`]);
  const destinationLabels = list(values['Preferred destinations · optional']);
  const unsureDestinations = destinationLabels.includes('Not sure yet');
  const destinations = destinationLabels.reduce<{ countries: string[]; regions: string[] }>((result, label) => {
    const mapped = DESTINATION_TO_KEY[label];
    if (mapped) result[mapped.kind === 'country' ? 'countries' : 'regions'].push(mapped.key);
    return result;
  }, { countries: [], regions: [] });
  const intake = INTAKE_TO_VALUE[values['Intended start · optional']] ?? { term: null, year: null, state: 'unanswered' };
  return {
    intendedMajor: targetField === 'Not sure yet' ? null : targetField,
    intendedMajorUnsure: targetField === 'Not sure yet',
    targetCountries: destinations.countries,
    destinationRegions: destinations.regions,
    destinationUnsure: unsureDestinations,
    intakeTerm: intake.term,
    intakeYear: intake.year,
    intakeUnsure: intake.state === 'unsure',
  };
}

export function buildStepMutation(screen: string, degree: Degree, values: Values, choices: ChoiceState, action: OnboardingAction): PersistableStep | null {
  if (screen === 'goal') return { endpoint: 'path', payload: { path: degree } };
  if (screen === 'b-basics' || screen === 'm-basics') return { endpoint: 'student-basics', payload: {
    firstName: nullable(values['First name']), lastName: nullable(values['Last name']), country: nullable(values['Country of residence']),
    preferredLanguage: LANGUAGE_TO_KEY[values['Preferred language']] ?? nullable(values['Preferred language']), phoneNumber: nullable(values['Phone number · optional']),
  } };
  if (screen === 'b-education') return { endpoint: 'student-education', payload: {
    educationStage: STAGE_TO_KEY[values['Current education stage']] ?? nullable(values['Current education stage']), currentSchool: nullable(values['School · optional']),
  } };
  if (screen === 'm-education') return { endpoint: 'student-education', payload: {
    universityCountry: nullable(values['Country of university']),
    bachelorsStatus: values['Bachelor’s status'] === 'Currently studying' ? 'studying' : values['Bachelor’s status'] === 'Graduated' ? 'graduated' : null,
    graduationYear: values['Graduation year'] ? Number(values['Graduation year']) : null, university: nullable(values.University),
    bachelorsQualification: nullable(values['Bachelor’s qualification']), priorFieldOfStudy: nullable(values['Field of study']),
  } };
  if (screen === 'b-direction' || screen === 'm-direction') return { endpoint: 'student-direction', payload: directionPayload(values, degree) };
  if (screen === 'b-support' || screen === 'm-support') return { endpoint: 'student-support', payload: { supportReasons: action === 'skip' ? [] : (choices[screen] || []).map(label => SUPPORT_TO_KEY[label]).filter(Boolean) } };
  if (screen === 'b-referral' || screen === 'm-referral') {
    const selected = choices.referral?.[0];
    return { endpoint: 'referral', payload: { hearAboutSource: action === 'skip' ? 'prefer_not_to_say' : selected ? REFERRAL_TO_KEY[selected] : null, hearAboutOther: selected === 'Other' ? nullable(values['If other · optional']) : null } };
  }
  if (screen === 'mentor-profile') return { endpoint: 'mentor-profile', payload: {
    fullName: nullable(values['mentor:Full name']), linkedin: nullable(values['mentor:LinkedIn profile']), photoMediaId: nullable(values['mentor:Photo media ID']),
  } };
  if (screen === 'mentor-academic') return { endpoint: 'mentor-academic', payload: {
    universityCountry: nullable(values['mentor:Country of university']),
    languages: list(values['mentor:Languages you can mentor in']).map(value => LANGUAGE_TO_KEY[value] ?? value), university: nullable(values['mentor:University']),
    major: nullable(values['mentor:Field of study']), startDate: normalizeMonth(values['mentor:Start date · optional']), endDate: normalizeMonth(values['mentor:End date · optional']),
  } };
  if (screen === 'mentor-story') return { endpoint: 'mentor-story', payload: { summary: nullable(values['mentor:About you']), motivation: nullable(values['mentor:Why do you want to mentor?']) } };
  if (screen === 'mentor-offer') return { endpoint: 'mentor-offer', payload: { mentorshipValue: nullable(values['mentor:Value you bring']), mentoringExperience: nullable(values['mentor:Mentoring experience']) } };
  if (screen === 'mentor-background') return { endpoint: 'mentor-expertise', payload: {
    expertise: (choices['mentor-background'] || []).map(label => EXPERTISE_TO_KEY[label]).filter(Boolean),
    specializations: nullable(values['mentor:Specializations']), professionalBackground: nullable(values['mentor:Professional background']),
  } };
  if (/intro|telegram|connected/.test(screen)) return { endpoint: 'progress', payload: {} };
  return null;
}

export function hydrateProductionState(state: OnboardingState): { degree: Degree; screen: string; values: Values; choices: ChoiceState; photo: boolean; telegram: boolean } {
  const degree = (state.path || 'bachelor') as Degree;
  const student = state.student || {};
  const mentor = state.mentor || {};
  const destinationLabels = [
    ...(student.targetCountries || []).map(key => KEY_TO_DESTINATION[key] || key),
    ...(student.destinationRegions || []).map(key => KEY_TO_DESTINATION[key] || key),
    ...(student.destinationUnsure ? ['Not sure yet'] : []),
  ];
  const intakeLabel = student.intakeUnsure ? 'Not sure yet' : student.intakeYear === 2028 && !student.intakeTerm ? '2028 or later'
    : student.intakeTerm && student.intakeYear ? `${student.intakeTerm === 'autumn' ? 'Autumn' : 'Spring'} ${student.intakeYear}` : '';
  const values: Values = {
    'Country of university': student.universityCountry || '',
    'mentor:Country of university': mentor.universityCountry || '',
    'First name': student.firstName || '', 'Last name': student.lastName || '', 'Country of residence': student.country || '',
    'Preferred language': KEY_TO_LANGUAGE[student.preferredLanguage || ''] || student.preferredLanguage || '', 'Phone number · optional': student.phoneNumber || '',
    'Current education stage': KEY_TO_STAGE[student.educationStage || ''] || student.educationStage || '', 'School · optional': student.currentSchool || '',
    'Bachelor’s status': student.bachelorsStatus === 'studying' ? 'Currently studying' : student.bachelorsStatus === 'graduated' ? 'Graduated' : '',
    'Graduation year': student.graduationYear ? String(student.graduationYear) : '', University: student.university || '',
    'Bachelor’s qualification': student.bachelorsQualification || '', 'Field of study': student.priorFieldOfStudy || '',
    [`${degree === 'bachelor' ? 'b' : 'm'}:targetField`]: student.intendedMajorUnsure ? 'Not sure yet' : student.intendedMajor || '',
    'Preferred destinations · optional': destinationLabels.join(', '), 'Intended start · optional': intakeLabel,
    'mentor:Full name': mentor.fullName || '', 'mentor:LinkedIn profile': mentor.linkedin || '',
    'mentor:Languages you can mentor in': (mentor.languages || []).map(key => KEY_TO_LANGUAGE[key] || key).join(', '),
    'mentor:University': mentor.university || '', 'mentor:Field of study': mentor.major || '', 'mentor:Start date · optional': mentor.startDate || '',
    'mentor:End date · optional': mentor.endDate || '', 'mentor:About you': mentor.summary || '', 'mentor:Why do you want to mentor?': mentor.motivation || '',
    'mentor:Value you bring': mentor.mentorshipValue || '', 'mentor:Mentoring experience': mentor.mentoringExperience || '',
    'mentor:Specializations': mentor.specializations || '', 'mentor:Professional background': mentor.professionalBackground || '',
    'If other · optional': state.hearAboutOther || '',
  };
  const choices: ChoiceState = {
    [`${degree === 'master' ? 'm' : 'b'}-support`]: (student.supportReasons || []).map(key => KEY_TO_SUPPORT[key] || key),
    referral: state.hearAboutSource && state.hearAboutSource !== 'prefer_not_to_say' ? [KEY_TO_REFERRAL[state.hearAboutSource] || state.hearAboutSource] : [],
    'mentor-background': (mentor.expertise || []).map(key => KEY_TO_EXPERTISE[key] || key),
  };
  return { degree, screen: state.currentStep || 'goal', values, choices, photo: Boolean(mentor.profileImageUrl), telegram: state.telegramConnected };
}

export function isProductionScreen(screen: string, degree: Degree): boolean {
  if (screen === 'goal' || screen === 'resume') return true;
  if (screen.startsWith('state-')) return ['state-university', 'state-field', 'state-manual', 'state-telegram-error'].includes(screen);
  return screen.startsWith(degree === 'mentor' ? 'mentor-' : degree === 'master' ? 'm-' : 'b-');
}

export function nextAfterSkip(screen: string): string | undefined {
  return screen === 'b-support' ? 'b-referral' : screen === 'm-support' ? 'm-referral'
    : screen === 'b-referral' ? 'b-intro' : screen === 'm-referral' ? 'm-intro'
      : screen.startsWith('b-telegram') ? 'b-review' : screen.startsWith('m-telegram') ? 'm-review' : undefined;
}

export function mutationEnvelope(revision: number, action: OnboardingAction) {
  return { expectedRevision: revision, requestId: createRequestId(), action };
}

export function pathFromDegree(degree: Degree): OnboardingPath { return degree; }
