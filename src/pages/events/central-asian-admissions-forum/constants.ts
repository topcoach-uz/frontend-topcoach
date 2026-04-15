import type {
  CaafDestinationId,
  CaafParticipantCategory,
  CaafParticipatingCountry,
  CaafPrimaryGoal,
} from './types';

export const CATEGORY_OPTIONS: { id: CaafParticipantCategory }[] = [
  { id: 'high_school' },
  { id: 'university' },
  { id: 'parent' },
  { id: 'educator' },
  { id: 'edtech' },
  { id: 'other' },
];

export const DESTINATION_OPTIONS: { id: CaafDestinationId }[] = [
  { id: 'us' },
  { id: 'uk' },
  { id: 'europe' },
  { id: 'asia' },
  { id: 'other' },
];

export const PARTICIPATING_COUNTRY_OPTIONS: { id: Exclude<CaafParticipatingCountry, ''> }[] = [
  { id: 'uzbekistan' },
  { id: 'kazakhstan' },
  { id: 'kyrgyzstan' },
  { id: 'tajikistan' },
  { id: 'turkmenistan' },
];

export const PRIMARY_GOAL_OPTIONS: { id: CaafPrimaryGoal }[] = [
  { id: 'scholarship' },
  { id: 'ivy' },
  { id: 'networking' },
  { id: 'extracurricular' },
];

/** Used only when `GET /caaf-forum/registration-config` has not loaded or failed. */
export const REGISTRATION_FEE_USD_FALLBACK = 5;

export function formatCaafRegistrationFeeUsd(usd: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
}

/** Icons for value props on landing (titles/bodies are i18n: caafForum.value.N.title / .body) */
export const FORUM_VALUE_ICONS = ['🎓', '💡', '💰', '✍️', '🤝'] as const;

export const CAAF_FORUM_CARD_IMAGE = '/img/casian_forum.jpeg';
