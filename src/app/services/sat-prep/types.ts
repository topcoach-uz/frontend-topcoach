/**
 * Types mirror the backend's `SatQuestionSchema` shape exactly. Don't
 * re-derive these from the backend's generated client unless we add SAT to
 * the swagger-typescript-api regeneration target.
 */

export type SatSection = 'math' | 'reading-writing';
export type SatDifficulty = 'easy' | 'medium' | 'hard';
export type SatQuestionType = 'multiple-choice' | 'student-produced-response';
export type SatFormat = 'mathml' | 'html-png';

export interface SatChoice {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export type SatCorrectAnswer =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | {
      value: string;
      acceptedForms: string[];
      type: 'integer' | 'decimal' | 'fraction' | 'string';
    };

export interface SatQuestion {
  id: string;                     // row UUID
  questionId: string;             // CB 8-char id
  externalId: string;
  assessment: 'SAT';
  section: SatSection;
  domain: string;
  skill: string;
  skillCode: string;
  difficulty: SatDifficulty;
  questionType: SatQuestionType;
  format: SatFormat;
  passageHtml: string | null;
  stemHtml: string;
  rationaleHtml: string;
  choices: SatChoice[] | null;
  correctAnswer: SatCorrectAnswer;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterSatQuestionsQuery {
  section?: SatSection;
  domain?: string;                // comma-separated for multi
  skill?: string;
  difficulty?: string;
  questionType?: SatQuestionType;
  excludeIds?: string;
  limit?: number;
  offset?: number;
  order?: 'default' | 'random' | 'difficulty';
}

export interface FilteredSatQuestions {
  items: SatQuestion[];
  total: number;
  limit: number;
  offset: number;
}

export interface ComposeMockTestBody {
  section: SatSection;
  totalQuestions: number;
  distribution?: { easy?: number; medium?: number; hard?: number };
  domains?: string[];
  excludeIds?: string[];
  seed?: number;
}

export interface AggregateCount {
  section: SatSection;
  domain: string;
  difficulty: SatDifficulty;
  count: number;
}

export interface SkillCount {
  section: SatSection;
  domain: string;
  skill: string;
  skillCode: string;
  difficulty: SatDifficulty;
  count: number;
}
