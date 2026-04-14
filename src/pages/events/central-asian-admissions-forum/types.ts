export type CaafParticipantCategory =
  | 'high_school'
  | 'university'
  | 'parent'
  | 'educator'
  | 'edtech'
  | 'other';

export type CaafDestinationId = 'us' | 'uk' | 'europe' | 'asia' | 'other';

export type CaafPrimaryGoal = 'scholarship' | 'ivy' | 'networking' | 'extracurricular';
export type CaafParticipatingCountry =
  | 'uzbekistan'
  | 'kazakhstan'
  | 'kyrgyzstan'
  | 'tajikistan'
  | 'turkmenistan'
  | '';

/** After form submit, until $5 is paid */
export type CaafRegistrationStatus = 'pending_payment' | 'paid' | 'refunded' | 'cancelled';

export interface CaafDraft {
  fullName: string;
  email: string;
  phone: string;
  countryCity: string;
  participatingCountry: CaafParticipatingCountry;
  categoryId: CaafParticipantCategory | '';
  categoryOther: string;
  gradeOrYear: string;
  destinationIds: CaafDestinationId[];
  destinationOther: string;
  intendedFieldOfStudy: string;
  hearAbout: string;
  primaryGoal: CaafPrimaryGoal | '';
  speakerQuestion: string;
  wantsConsultation: 'yes' | 'no' | '';
  /** Final registration consent (before review / payment) */
  consentAccepted: boolean;
}

export const CAAF_DRAFT_STORAGE_KEY = 'topcoach_caaf_forum_2026_draft';
/** Landing-page consent (checkbox) — required before starting the questionnaire */
export const CAAF_LANDING_CONSENT_KEY = 'topcoach_caaf_landing_consent_v1';
/** @deprecated use CAAF_LANDING_CONSENT_KEY; still read for migration */
export const CAAF_TERMS_GATE_KEY = 'topcoach_caaf_forum_2026_terms_gate_v1';
export const CAAF_FORM_STEP_KEY = 'topcoach_caaf_forum_2026_form_step';

export function createEmptyCaafDraft(): CaafDraft {
  return {
    fullName: '',
    email: '',
    phone: '',
    countryCity: '',
    participatingCountry: '',
    categoryId: '',
    categoryOther: '',
    gradeOrYear: '',
    destinationIds: [],
    destinationOther: '',
    intendedFieldOfStudy: '',
    hearAbout: '',
    primaryGoal: '',
    speakerQuestion: '',
    wantsConsultation: '',
    consentAccepted: false,
  };
}

export function mergeCaafDraft(parsed: Partial<CaafDraft> | null | undefined): CaafDraft {
  const empty = createEmptyCaafDraft();
  if (!parsed || typeof parsed !== 'object') return empty;
  return {
    ...empty,
    ...parsed,
    destinationIds: Array.isArray(parsed.destinationIds)
      ? (parsed.destinationIds.filter(Boolean) as CaafDestinationId[])
      : empty.destinationIds,
    consentAccepted: Boolean(parsed.consentAccepted),
  };
}
