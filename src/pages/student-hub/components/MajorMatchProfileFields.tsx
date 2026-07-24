import { useState } from 'react';
import { InputNumber, Select, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';

export type EnglishTestType = 'ielts' | 'toefl';

export interface MajorMatchProfileFieldsState {
  satTotal: number | null;
  setSatTotal: (v: number | null) => void;
  englishTestType: EnglishTestType;
  setEnglishTestType: (v: EnglishTestType) => void;
  englishScore: number | null;
  setEnglishScore: (v: number | null) => void;
  gpa: number | null;
  setGpa: (v: number | null) => void;
  gpaScale: number | null;
  setGpaScale: (v: number | null) => void;
  major: string | undefined;
  setMajor: (v: string | undefined) => void;
  countries: string[];
  setCountries: (v: string[]) => void;
  /** Builds the /student-profile/my-profile PATCH payload from whatever
   * fields are non-empty, merged onto `profile`'s existing academicProfile
   * (same spread-and-override discipline MajorMatchPromptModal already used
   * for SAT/IELTS, and StepInfo.tsx uses for personalProfile). Returns null
   * when nothing was filled in — callers should treat that as "nothing to
   * save", not send an empty patch. */
  buildPatch: (profile: any) => Record<string, unknown> | null;
}

// Same canonical list PersonalProfile.tsx uses for `intendedMajors[0].major`
// (it defines this array inline at two call sites in that file) — duplicated
// here rather than extracted/shared, to keep this change scoped to the
// major-match surfaces.
const MAJOR_OPTIONS = [
  'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
  'Cybersecurity', 'Information Technology', 'Mechanical Engineering', 'Electrical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Biomedical Engineering', 'Aerospace Engineering',
  'Business Administration', 'Finance', 'Marketing', 'Accounting', 'International Business',
  'Entrepreneurship', 'Medicine', 'Nursing', 'Pharmacy', 'Dentistry', 'Veterinary Medicine',
  'Public Health', 'Law', 'Criminal Justice', 'Political Science', 'International Relations',
  'Psychology', 'Sociology', 'Anthropology', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
  'Statistics', 'Environmental Science', 'Geology', 'Astronomy', 'Economics',
  'Banking', 'Architecture', 'Urban Planning', 'Graphic Design', 'Fine Arts', 'Music',
  'Theater', 'Film Studies', 'Journalism', 'Communications', 'Education', 'Social Work',
  'Agriculture', 'Food Science', 'Nutrition', 'Sports Science', 'Tourism', 'Hospitality', 'Other',
];

const GPA_SCALE_OPTIONS = [
  { value: 4.0, label: '4.0' },
  { value: 5.0, label: '5.0' },
  { value: 100, label: '100' },
  { value: 20, label: '20' },
];

/** Same destination taxonomy + "not sure" exclusivity as
 * onboarding/steps/StepInfo.tsx's DESTINATION_OPTIONS/handleDestinationChange
 * — duplicated (StepInfo builds its options inline with local t() calls) so
 * this stays self-contained; keep the two lists in sync manually if the
 * destination taxonomy ever changes. */
function useDestinationOptions() {
  const { t } = useTranslation();
  return [
    { value: 'usa', label: t('onboarding.info.destinationUsa', 'USA') },
    { value: 'uk', label: t('onboarding.info.destinationUk', 'UK') },
    { value: 'canada', label: t('onboarding.info.destinationCanada', 'Canada') },
    { value: 'europe', label: t('onboarding.info.destinationEurope', 'Europe') },
    { value: 'asia', label: t('onboarding.info.destinationAsia', 'Asia') },
    { value: 'australia', label: t('onboarding.info.destinationAustralia', 'Australia') },
    { value: 'not-sure', label: t('onboarding.info.destinationNotSure', 'Not sure yet') },
  ];
}

/**
 * Local state + PATCH-builder for the optional profile fields shown in both
 * MajorMatchPromptModal (auto-popup) and MajorMatchCollectModal (hero CTA) —
 * the two surfaces must stay in lockstep, so this is the single place their
 * shared fields (SAT, English test, GPA, intended major, target countries)
 * live. See MajorMatchProfileFieldsBody below for the matching JSX.
 */
export function useMajorMatchProfileFieldsState(): MajorMatchProfileFieldsState {
  const [satTotal, setSatTotal] = useState<number | null>(null);
  const [englishTestType, setEnglishTestTypeRaw] = useState<EnglishTestType>('ielts');
  const [englishScore, setEnglishScore] = useState<number | null>(null);
  const [gpa, setGpa] = useState<number | null>(null);
  const [gpaScale, setGpaScale] = useState<number | null>(null);
  const [major, setMajor] = useState<string | undefined>(undefined);
  const [countries, setCountriesRaw] = useState<string[]>([]);

  // IELTS (0-9) and TOEFL (0-120) don't convert — clear the score when the
  // test type changes so a stale value on the wrong scale can't be sent.
  const setEnglishTestType = (v: EnglishTestType) => {
    setEnglishTestTypeRaw(v);
    setEnglishScore(null);
  };

  // Mirrors StepInfo.tsx's handleDestinationChange: picking "not sure yet"
  // clears every other selection (mutually exclusive with real countries).
  const setCountries = (values: string[]) => {
    const justAddedNotSure = values.includes('not-sure') && !countries.includes('not-sure');
    if (justAddedNotSure) {
      setCountriesRaw(['not-sure']);
      return;
    }
    setCountriesRaw(values.filter((v) => v !== 'not-sure'));
  };

  const buildPatch = (profile: any): Record<string, unknown> | null => {
    const existingAcademic = (profile?.academicProfile as any) ?? {};
    const academicProfile: Record<string, unknown> = {};

    if (satTotal != null || englishScore != null) {
      academicProfile.testScores = {
        ...(existingAcademic.testScores ?? {}),
        ...(satTotal != null
          ? { sat: { ...(existingAcademic.testScores?.sat ?? {}), total: satTotal } }
          : {}),
        ...(englishScore != null
          ? englishTestType === 'ielts'
            ? { ielts: { ...(existingAcademic.testScores?.ielts ?? {}), overall: englishScore } }
            : { toefl: { ...(existingAcademic.testScores?.toefl ?? {}), total: englishScore } }
          : {}),
      };
    }

    if (gpa != null) {
      academicProfile.gpa = {
        ...(existingAcademic.gpa ?? {}),
        unweighted: gpa,
        ...(gpaScale != null ? { scale: gpaScale } : {}),
      };
    }

    const personalProfile: Record<string, unknown> = {};
    if (major) {
      personalProfile.intendedMajors = [{ major, rank: 1 }];
    }
    if (countries.length > 0) {
      personalProfile.studyAbroadGoals = countries.includes('not-sure')
        ? { interest: true }
        : { interest: true, targetCountries: countries };
    }

    const patch: Record<string, unknown> = {};
    if (Object.keys(academicProfile).length > 0) patch.academicProfile = academicProfile;
    if (Object.keys(personalProfile).length > 0) patch.personalProfile = personalProfile;
    return Object.keys(patch).length > 0 ? patch : null;
  };

  return {
    satTotal,
    setSatTotal,
    englishTestType,
    setEnglishTestType,
    englishScore,
    setEnglishScore,
    gpa,
    setGpa,
    gpaScale,
    setGpaScale,
    major,
    setMajor,
    countries,
    setCountries,
    buildPatch,
  };
}

/** Presentational half of the pair above — takes the state object as props
 * (spread it: `<MajorMatchProfileFieldsBody {...fields} />`) so both modals
 * render byte-identical fields. Reuses MajorMatchPromptModal.scss's BEM
 * classes (imported by both modal files already). */
export function MajorMatchProfileFieldsBody(fields: MajorMatchProfileFieldsState) {
  const { t } = useTranslation();
  const destinationOptions = useDestinationOptions();

  return (
    <div className="major-match-prompt-modal__fields">
      <p className="major-match-prompt-modal__fields-hint">
        {t(
          'studentHub.majorMatchPrompt.fieldsHint',
          'Optional — sharpens your results if you have them handy.',
        )}
      </p>

      <div className="major-match-prompt-modal__field-row">
        <label className="major-match-prompt-modal__field">
          <span>{t('studentHub.majorMatchPrompt.satLabel', 'SAT total (optional)')}</span>
          <InputNumber
            min={400}
            max={1600}
            placeholder={t('studentHub.majorMatchPrompt.satPlaceholder', 'e.g. 1450')}
            value={fields.satTotal}
            onChange={(v) => fields.setSatTotal(typeof v === 'number' ? v : null)}
            style={{ width: '100%' }}
          />
        </label>
        <label className="major-match-prompt-modal__field">
          <span>{t('studentHub.majorMatchPrompt.gpaLabel', 'GPA (optional)')}</span>
          <div className="major-match-prompt-modal__field-inline">
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              placeholder={t('studentHub.majorMatchPrompt.gpaPlaceholder', 'e.g. 3.8')}
              value={fields.gpa}
              onChange={(v) => fields.setGpa(typeof v === 'number' ? v : null)}
              style={{ width: '100%' }}
            />
            <Select
              allowClear
              placeholder={t('studentHub.majorMatchPrompt.gpaScalePlaceholder', 'Scale')}
              value={fields.gpaScale ?? undefined}
              onChange={(v) => fields.setGpaScale(typeof v === 'number' ? v : null)}
              options={GPA_SCALE_OPTIONS}
              style={{ width: 92 }}
            />
          </div>
        </label>
      </div>

      <div className="major-match-prompt-modal__field-row">
        <label className="major-match-prompt-modal__field">
          <span>{t('studentHub.majorMatchPrompt.englishTestLabel', 'English test (optional)')}</span>
          <div className="major-match-prompt-modal__field-inline">
            <Segmented
              value={fields.englishTestType}
              onChange={(v) => fields.setEnglishTestType(v as EnglishTestType)}
              options={[
                { value: 'ielts', label: t('studentHub.majorMatchPrompt.englishTestIelts', 'IELTS') },
                { value: 'toefl', label: t('studentHub.majorMatchPrompt.englishTestToefl', 'TOEFL') },
              ]}
            />
            <InputNumber
              min={0}
              max={fields.englishTestType === 'ielts' ? 9 : 120}
              step={fields.englishTestType === 'ielts' ? 0.5 : 1}
              placeholder={
                fields.englishTestType === 'ielts'
                  ? t('studentHub.majorMatchPrompt.ieltsPlaceholder', 'e.g. 7.0')
                  : t('studentHub.majorMatchPrompt.toeflPlaceholder', 'e.g. 100')
              }
              value={fields.englishScore}
              onChange={(v) => fields.setEnglishScore(typeof v === 'number' ? v : null)}
              style={{ width: '100%' }}
            />
          </div>
        </label>
        <label className="major-match-prompt-modal__field">
          <span>{t('studentHub.majorMatchPrompt.majorLabel', 'Intended major (optional)')}</span>
          <Select
            showSearch
            allowClear
            placeholder={t('studentHub.majorMatchPrompt.majorPlaceholder', 'Select your intended major')}
            value={fields.major}
            onChange={(v) => fields.setMajor(v)}
            options={MAJOR_OPTIONS.map((m) => ({ value: m, label: m }))}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div className="major-match-prompt-modal__field-row">
        <label className="major-match-prompt-modal__field major-match-prompt-modal__field--full">
          <span>
            {t('studentHub.majorMatchPrompt.countriesLabel', 'Where do you want to study? (optional)')}
          </span>
          <Select
            mode="multiple"
            allowClear
            placeholder={t('studentHub.majorMatchPrompt.countriesPlaceholder', 'Select destinations')}
            value={fields.countries}
            onChange={fields.setCountries}
            options={destinationOptions}
            style={{ width: '100%' }}
          />
        </label>
      </div>
    </div>
  );
}
