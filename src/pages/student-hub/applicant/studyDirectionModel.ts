export interface StudyDirectionChoices {
  interests: string[];
  goals: string[];
  countries: string[];
  intake: string;
  funding: string;
}

export const interestOptions = [
  'Artificial intelligence',
  'Human behaviour',
  'Data science',
  'Design',
  'Business',
  'Public policy',
];

export const goalOptions = [
  'Deepen expertise',
  'Prepare for research',
  'Change career',
  'Not sure yet',
];

export const countryOptions = [
  'United Kingdom',
  'United States',
  'Netherlands',
  'Germany',
  'Canada',
  'Australia',
];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))].slice(0, 12)
    : [];

export function readStudyDirectionChoices(preferences: Record<string, unknown> | null | undefined): StudyDirectionChoices {
  const raw = preferences?.studyDirection;
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    interests: strings(value.interests),
    goals: strings(value.goals),
    countries: strings(value.countries),
    intake: typeof value.intake === 'string' ? value.intake.trim().slice(0, 80) : '',
    funding: typeof value.funding === 'string' ? value.funding.trim().slice(0, 80) : '',
  };
}

export function hasDirectionChoices(choices: StudyDirectionChoices): boolean {
  return choices.interests.length > 0 || choices.goals.length > 0;
}

export interface DirectionIdea {
  title: string;
  because: string;
  check: string;
}

const byInterest: Record<string, Omit<DirectionIdea, 'because'>> = {
  'Artificial intelligence': { title: 'Advanced computer science', check: 'Specialist modules · mathematics prerequisites · funding' },
  'Human behaviour': { title: 'Human-centered technology', check: 'Accepted prior degrees · research methods · project options' },
  'Data science': { title: 'Data science and analytics', check: 'Statistics prerequisites · practical projects · funding' },
  Design: { title: 'Design and innovation', check: 'Portfolio requirements · course format · career outcomes' },
  Business: { title: 'Business and management', check: 'Experience requirements · accreditation · career outcomes' },
  'Public policy': { title: 'Public policy and social impact', check: 'Prior study requirements · research methods · internships' },
};

export function directionIdeas(choices: StudyDirectionChoices): DirectionIdea[] {
  if (!hasDirectionChoices(choices)) return [];
  const ideas = choices.interests.slice(0, 3).map((interest) => ({
    ...(byInterest[interest] ?? {
      title: `${interest} study`,
      check: 'Entry requirements · course content · funding',
    }),
    because: `You selected ${interest} as a subject to explore${choices.goals.length ? ` and ${choices.goals[0].toLowerCase()} as a goal` : ''}.`,
  }));
  if (ideas.length) return ideas;
  return choices.goals.filter((goal) => goal !== 'Not sure yet').slice(0, 2).map((goal) => ({
    title: goal === 'Prepare for research' ? 'Research-focused master’s study' : goal === 'Change career' ? 'Conversion master’s study' : 'Specialist master’s study',
    because: `You selected “${goal}” as a goal. Add a subject to make this direction more specific.`,
    check: 'Relevant subjects · entry requirements · funding',
  }));
}
