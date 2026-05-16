/**
 * Closed-list options for the chip-multiselect fields. Stored as strings
 * so the backend remains schema-flexible — admin can edit/extend without
 * a migration.
 */

import type {
  BudgetRange,
  ParentInvolvement,
  SatPlan,
} from 'src/app/services/admissionsProfileApi';

export type Option<T extends string = string> = {
  id: T;
  label: string;
};

export const GRADE_LEVELS: Option<string>[] = [
  { id: '6', label: 'Grade 6' },
  { id: '7', label: 'Grade 7' },
  { id: '8', label: 'Grade 8' },
  { id: '9', label: 'Grade 9' },
  { id: '10', label: 'Grade 10' },
  { id: '11', label: 'Grade 11' },
  { id: '12', label: 'Grade 12' },
  { id: '13', label: 'Gap year / freshman' },
];

export const PARENT_INVOLVEMENT_OPTIONS: Option<ParentInvolvement>[] = [
  { id: 'active', label: 'Yes, actively' },
  { id: 'somewhat', label: 'Somewhat' },
  { id: 'independent', label: 'I’m doing this independently' },
];

export const SAT_PLAN_OPTIONS: Option<SatPlan>[] = [
  { id: 'not_taken', label: "Haven't taken yet" },
  { id: 'retake_planned', label: 'Planning to retake' },
  { id: 'satisfied', label: 'Satisfied with my score' },
  { id: 'not_planning', label: 'Not planning to take' },
];

export const GOAL_OPTIONS: Option[] = [
  { id: 'get_into_ivy_league', label: 'Get into Ivy League' },
  { id: 'improve_sat', label: 'Improve SAT score' },
  { id: 'build_extracurriculars', label: 'Build extracurriculars' },
  { id: 'strong_essays', label: 'Strong application essays' },
  { id: 'get_scholarships', label: 'Get scholarships' },
  { id: 'explore_major_options', label: 'Explore major options' },
];

export const INTEREST_OPTIONS: Option[] = [
  { id: 'stem', label: 'STEM' },
  { id: 'business', label: 'Business' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'law', label: 'Law' },
  { id: 'arts', label: 'Arts' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'computer_science', label: 'Computer Science' },
  { id: 'social_sciences', label: 'Social Sciences' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'economics', label: 'Economics' },
];

export const TARGET_UNIVERSITY_OPTIONS: Option[] = [
  { id: 'harvard', label: 'Harvard' },
  { id: 'mit', label: 'MIT' },
  { id: 'stanford', label: 'Stanford' },
  { id: 'yale', label: 'Yale' },
  { id: 'princeton', label: 'Princeton' },
  { id: 'columbia', label: 'Columbia' },
  { id: 'upenn', label: 'UPenn' },
  { id: 'duke', label: 'Duke' },
  { id: 'caltech', label: 'Caltech' },
  { id: 'brown', label: 'Brown' },
  { id: 'cornell', label: 'Cornell' },
  { id: 'georgetown', label: 'Georgetown' },
  { id: 'nyu', label: 'NYU' },
  { id: 'ucb', label: 'UC Berkeley' },
];

export const CHALLENGE_OPTIONS: Option[] = [
  { id: 'no_sat_yet', label: 'No SAT score yet' },
  { id: 'limited_extracurriculars', label: 'Limited extracurriculars' },
  { id: 'english_not_native', label: 'English not native' },
  { id: 'unsure_about_major', label: 'Unsure about major' },
  { id: 'need_financial_aid', label: 'Need financial aid' },
  { id: 'no_guidance_at_school', label: 'No guidance at school' },
];

export const APPLICATION_TIMELINE_OPTIONS: Option[] = [
  { id: '2026-2027', label: '2026–2027' },
  { id: '2027-2028', label: '2027–2028' },
  { id: '2028-2029', label: '2028–2029' },
  { id: '2029-2030', label: '2029–2030' },
  { id: 'not_sure_yet', label: 'Not sure yet' },
];

export const BUDGET_OPTIONS: Option<BudgetRange>[] = [
  { id: 'free_only', label: 'Free resources only' },
  { id: 'under_15', label: 'Under $15 / mo' },
  { id: 'under_100', label: 'Under $100 / mo' },
  { id: 'flexible', label: 'Flexible' },
];
