export const STUDY_BUDDY_INTERESTS_STORAGE_KEY = 'topcoach_study_buddy_interests';

export type StudyBuddyInterestProfile = {
  examPrep: string[];
  applicationGoals: string[];
  intendedMajors: string[];
  focusAreas: string[];
};

type InterestOption = {
  label: string;
  value: string;
};

export const EXAM_PREP_OPTIONS: InterestOption[] = [
  { label: 'SAT', value: 'sat' },
  { label: 'IELTS', value: 'ielts' },
  { label: 'TOEFL', value: 'toefl' },
  { label: 'Duolingo English Test', value: 'duolingo' },
  { label: 'ACT', value: 'act' },
  { label: 'AP Exams', value: 'ap-exams' },
];

export const APPLICATION_GOAL_OPTIONS: InterestOption[] = [
  { label: 'Applying to USA', value: 'apply-usa' },
  { label: 'Applying to UK', value: 'apply-uk' },
  { label: 'Applying to Europe', value: 'apply-europe' },
  { label: 'Applying to Asia', value: 'apply-asia' },
  { label: 'Scholarship-focused applications', value: 'scholarships' },
];

export const INTENDED_MAJOR_OPTIONS: InterestOption[] = [
  { label: 'Law', value: 'major-law' },
  { label: 'Computer Science', value: 'major-cs' },
  { label: 'Medicine / Pre-med', value: 'major-medicine' },
  { label: 'Business / Economics', value: 'major-business' },
  { label: 'Engineering', value: 'major-engineering' },
  { label: 'Social Sciences', value: 'major-social-science' },
  { label: 'Data Science / AI', value: 'major-data-ai' },
  { label: 'Finance / Accounting', value: 'major-finance' },
  { label: 'Architecture', value: 'major-architecture' },
  { label: 'Psychology', value: 'major-psychology' },
  { label: 'Political Science / IR', value: 'major-political-ir' },
  { label: 'Biology / Biotechnology', value: 'major-biology-biotech' },
  { label: 'Chemistry', value: 'major-chemistry' },
  { label: 'Physics', value: 'major-physics' },
  { label: 'Mathematics / Statistics', value: 'major-math-stats' },
  { label: 'Media / Communications', value: 'major-media-comms' },
  { label: 'Design / UX', value: 'major-design-ux' },
  { label: 'Education', value: 'major-education' },
];

export const FOCUS_AREA_OPTIONS: InterestOption[] = [
  { label: 'Essay writing', value: 'focus-essays' },
  { label: 'Research portfolio', value: 'focus-research' },
  { label: 'Interview prep', value: 'focus-interview' },
  { label: 'Extracurricular profile', value: 'focus-activities' },
  { label: 'Application timelines', value: 'focus-deadlines' },
];

export const EMPTY_STUDY_BUDDY_INTEREST_PROFILE: StudyBuddyInterestProfile = {
  examPrep: [],
  applicationGoals: [],
  intendedMajors: [],
  focusAreas: [],
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeStudyBuddyInterestProfile(input: unknown): StudyBuddyInterestProfile {
  const raw = (input as Partial<StudyBuddyInterestProfile>) ?? {};
  return {
    examPrep: unique(Array.isArray(raw.examPrep) ? raw.examPrep : []),
    applicationGoals: unique(Array.isArray(raw.applicationGoals) ? raw.applicationGoals : []),
    intendedMajors: unique(Array.isArray(raw.intendedMajors) ? raw.intendedMajors : []),
    focusAreas: unique(Array.isArray(raw.focusAreas) ? raw.focusAreas : []),
  };
}

export function loadStudyBuddyInterestProfile(): StudyBuddyInterestProfile {
  try {
    const raw = localStorage.getItem(STUDY_BUDDY_INTERESTS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_STUDY_BUDDY_INTEREST_PROFILE };
    return normalizeStudyBuddyInterestProfile(JSON.parse(raw));
  } catch {
    return { ...EMPTY_STUDY_BUDDY_INTEREST_PROFILE };
  }
}

export function saveStudyBuddyInterestProfile(profile: StudyBuddyInterestProfile): void {
  localStorage.setItem(
    STUDY_BUDDY_INTERESTS_STORAGE_KEY,
    JSON.stringify(normalizeStudyBuddyInterestProfile(profile)),
  );
}

export type StudyBuddyInterestField = keyof StudyBuddyInterestProfile;

const OPTION_LOOKUP: Record<StudyBuddyInterestField, Record<string, string>> = {
  examPrep: Object.fromEntries(EXAM_PREP_OPTIONS.map((o) => [o.value, o.label])),
  applicationGoals: Object.fromEntries(APPLICATION_GOAL_OPTIONS.map((o) => [o.value, o.label])),
  intendedMajors: Object.fromEntries(INTENDED_MAJOR_OPTIONS.map((o) => [o.value, o.label])),
  focusAreas: Object.fromEntries(FOCUS_AREA_OPTIONS.map((o) => [o.value, o.label])),
};

export function getInterestLabel(field: StudyBuddyInterestField, value: string): string {
  return OPTION_LOOKUP[field][value] ?? value;
}

function overlapForField(
  mine: string[],
  theirs: string[],
  field: StudyBuddyInterestField,
): Array<{ field: StudyBuddyInterestField; value: string; label: string }> {
  const mineSet = new Set(mine);
  return theirs
    .filter((v) => mineSet.has(v))
    .map((value) => ({ field, value, label: getInterestLabel(field, value) }));
}

export function computeInterestOverlap(
  mine: StudyBuddyInterestProfile,
  theirs: StudyBuddyInterestProfile,
): Array<{ field: StudyBuddyInterestField; value: string; label: string }> {
  return [
    ...overlapForField(mine.examPrep, theirs.examPrep, 'examPrep'),
    ...overlapForField(mine.applicationGoals, theirs.applicationGoals, 'applicationGoals'),
    ...overlapForField(mine.intendedMajors, theirs.intendedMajors, 'intendedMajors'),
    ...overlapForField(mine.focusAreas, theirs.focusAreas, 'focusAreas'),
  ];
}
