import { useState } from 'react';
import { InputNumber, Select, Segmented, Rate, Input } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

export type EnglishTestType = 'ielts' | 'toefl';
export type ScoreTestType = 'sat' | 'act';

export interface MajorMatchProfileFieldsState {
  scoreType: ScoreTestType;
  setScoreType: (v: ScoreTestType) => void;
  scoreValue: number | null;
  setScoreValue: (v: number | null) => void;
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
  majorConfidence: number;
  setMajorConfidence: (v: number) => void;
  careerGoals: string;
  setCareerGoals: (v: string) => void;
  /** Fixed-length-3 tuple of free-text "notable activity" strings. */
  activities: string[];
  setActivity: (index: number, value: string) => void;
  /** Builds the /student-profile/my-profile PATCH payload from whatever
   * fields are non-empty, merged onto `profile`'s existing academicProfile/
   * personalProfile/activitiesProfile (same spread-and-override discipline
   * MajorMatchPromptModal already used for SAT/IELTS, and StepInfo.tsx uses
   * for personalProfile). Returns null when nothing was filled in —
   * callers should treat that as "nothing to save", not send an empty
   * patch. */
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

const ACTIVITY_SLOT_COUNT = 3;

/**
 * Local state + PATCH-builder for the optional profile fields shown in both
 * MajorMatchPromptModal (auto-popup) and MajorMatchCollectModal (hero /
 * profile-card CTA) — the two surfaces must stay in lockstep, so this is the
 * single place their shared fields live. Field set (per the engine audit
 * that established which fields actually move the ranking): SAT-or-ACT
 * score, GPA + scale, intended major + confidence, career goals, notable
 * activities, and an (explicitly optional, ranking-neutral) English test
 * score. Target countries was REMOVED from here — the engine never reads
 * it; see PersonalProfile.tsx's Target Countries field for where study-
 * destination collection now lives on the profile side.
 * See MajorMatchProfileFieldsBody below for the matching JSX.
 */
export function useMajorMatchProfileFieldsState(): MajorMatchProfileFieldsState {
  const [scoreType, setScoreTypeRaw] = useState<ScoreTestType>('sat');
  const [scoreValue, setScoreValue] = useState<number | null>(null);
  const [englishTestType, setEnglishTestTypeRaw] = useState<EnglishTestType>('ielts');
  const [englishScore, setEnglishScore] = useState<number | null>(null);
  const [gpa, setGpa] = useState<number | null>(null);
  const [gpaScale, setGpaScale] = useState<number | null>(null);
  const [major, setMajor] = useState<string | undefined>(undefined);
  const [majorConfidence, setMajorConfidence] = useState<number>(3);
  const [careerGoals, setCareerGoals] = useState('');
  const [activities, setActivitiesRaw] = useState<string[]>(
    () => Array.from({ length: ACTIVITY_SLOT_COUNT }, () => ''),
  );

  // SAT (400-1600) and ACT (1-36) don't convert — clear the score when the
  // test type toggles so a stale value on the wrong scale can't be sent.
  const setScoreType = (v: ScoreTestType) => {
    setScoreTypeRaw(v);
    setScoreValue(null);
  };

  // IELTS (0-9) and TOEFL (0-120) don't convert — clear the score when the
  // test type changes so a stale value on the wrong scale can't be sent.
  const setEnglishTestType = (v: EnglishTestType) => {
    setEnglishTestTypeRaw(v);
    setEnglishScore(null);
  };

  const setActivity = (index: number, value: string) => {
    setActivitiesRaw((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const buildPatch = (profile: any): Record<string, unknown> | null => {
    const existingAcademic = (profile?.academicProfile as any) ?? {};
    const academicProfile: Record<string, unknown> = {};

    if (scoreValue != null || englishScore != null) {
      academicProfile.testScores = {
        ...(existingAcademic.testScores ?? {}),
        ...(scoreValue != null
          ? scoreType === 'sat'
            ? { sat: { ...(existingAcademic.testScores?.sat ?? {}), total: scoreValue } }
            : { act: { ...(existingAcademic.testScores?.act ?? {}), composite: scoreValue } }
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
      personalProfile.intendedMajors = [{ major, rank: 1, confidence: majorConfidence }];
    }
    const careerGoalsList = careerGoals
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (careerGoalsList.length > 0) {
      personalProfile.careerGoals = careerGoalsList;
    }

    // Spread-before-override: keep whatever activities already exist that
    // the student didn't just re-type here (matched case-insensitively by
    // name), then append the new ones — never wipes out entries from the
    // full Activities tab (leadershipRoles/awards are untouched entirely
    // since this form never sends those keys).
    const activitiesProfile: Record<string, unknown> = {};
    const newActivities = activities
      .map((v) => v.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    if (newActivities.length > 0) {
      const existingActivities: Array<{ name?: string }> =
        (profile?.activitiesProfile as any)?.extracurricularActivities ?? [];
      const newNames = new Set(newActivities.map((a) => a.name.toLowerCase()));
      const keptExisting = existingActivities.filter(
        (a) => !newNames.has((a.name ?? '').toLowerCase()),
      );
      activitiesProfile.extracurricularActivities = [...keptExisting, ...newActivities];
    }

    const patch: Record<string, unknown> = {};
    if (Object.keys(academicProfile).length > 0) patch.academicProfile = academicProfile;
    if (Object.keys(personalProfile).length > 0) patch.personalProfile = personalProfile;
    if (Object.keys(activitiesProfile).length > 0) patch.activitiesProfile = activitiesProfile;
    return Object.keys(patch).length > 0 ? patch : null;
  };

  return {
    scoreType,
    setScoreType,
    scoreValue,
    setScoreValue,
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
    majorConfidence,
    setMajorConfidence,
    careerGoals,
    setCareerGoals,
    activities,
    setActivity,
    buildPatch,
  };
}

/** Presentational half of the pair above — takes the state object as props
 * (spread it: `<MajorMatchProfileFieldsBody {...fields} />`) so both modals
 * render byte-identical fields. Reuses MajorMatchPromptModal.scss's BEM
 * classes (imported by both modal files already). */
export function MajorMatchProfileFieldsBody(fields: MajorMatchProfileFieldsState) {
  const { t } = useTranslation();

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
          <span>{t('studentHub.majorMatchPrompt.scoreLabel', 'SAT / ACT score (optional)')}</span>
          <div className="major-match-prompt-modal__field-inline">
            <Segmented
              value={fields.scoreType}
              onChange={(v) => fields.setScoreType(v as ScoreTestType)}
              options={[
                { value: 'sat', label: t('studentHub.majorMatchPrompt.scoreTypeSat', 'SAT') },
                { value: 'act', label: t('studentHub.majorMatchPrompt.scoreTypeAct', 'ACT') },
              ]}
            />
            <InputNumber
              min={fields.scoreType === 'sat' ? 400 : 1}
              max={fields.scoreType === 'sat' ? 1600 : 36}
              step={fields.scoreType === 'sat' ? 10 : 1}
              placeholder={
                fields.scoreType === 'sat'
                  ? t('studentHub.majorMatchPrompt.satPlaceholder', 'e.g. 1450')
                  : t('studentHub.majorMatchPrompt.actPlaceholder', 'e.g. 30')
              }
              value={fields.scoreValue}
              onChange={(v) => fields.setScoreValue(typeof v === 'number' ? v : null)}
              style={{ width: '100%' }}
            />
          </div>
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
          <span>
            {t('studentHub.majorMatchPrompt.majorLabel', 'Intended major (optional)')}{' '}
            {fields.major && (
              <span className="major-match-prompt-modal__field-hint">
                {t('studentHub.majorMatchPrompt.majorConfidenceHint', 'How confident are you?')}
              </span>
            )}
          </span>
          <div className="major-match-prompt-modal__field-inline">
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
            <Rate
              count={5}
              value={fields.majorConfidence}
              onChange={(v) => fields.setMajorConfidence(v)}
              disabled={!fields.major}
              style={{ flexShrink: 0, fontSize: 16 }}
            />
          </div>
        </label>
        <label className="major-match-prompt-modal__field">
          <span>
            {t('studentHub.majorMatchPrompt.englishTestLabel', 'English test (optional)')}{' '}
            <span className="major-match-prompt-modal__field-hint">
              {t('studentHub.majorMatchPrompt.englishTestHint', "doesn't affect your ranking")}
            </span>
          </span>
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
      </div>

      <div className="major-match-prompt-modal__field-row">
        <label className="major-match-prompt-modal__field major-match-prompt-modal__field--full">
          <span>{t('studentHub.majorMatchPrompt.careerGoalsLabel', 'Career goals (optional)')}</span>
          <TextArea
            rows={2}
            maxLength={500}
            placeholder={t(
              'studentHub.majorMatchPrompt.careerGoalsPlaceholder',
              'e.g. Become a software engineer working on climate tech',
            )}
            value={fields.careerGoals}
            onChange={(e) => fields.setCareerGoals(e.target.value)}
          />
        </label>
      </div>

      <div className="major-match-prompt-modal__field-row">
        <label className="major-match-prompt-modal__field major-match-prompt-modal__field--full">
          <span>{t('studentHub.majorMatchPrompt.activitiesLabel', 'Notable activities (optional)')}</span>
          <div className="major-match-prompt-modal__activities">
            <Input
              maxLength={120}
              placeholder={t(
                'studentHub.majorMatchPrompt.activitiesPlaceholder1',
                'e.g. Debate team captain',
              )}
              value={fields.activities[0]}
              onChange={(e) => fields.setActivity(0, e.target.value)}
            />
            <Input
              maxLength={120}
              placeholder={t(
                'studentHub.majorMatchPrompt.activitiesPlaceholder2',
                'e.g. Volunteer at a local hospital',
              )}
              value={fields.activities[1]}
              onChange={(e) => fields.setActivity(1, e.target.value)}
            />
            <Input
              maxLength={120}
              placeholder={t(
                'studentHub.majorMatchPrompt.activitiesPlaceholder3',
                'e.g. Regional robotics competition',
              )}
              value={fields.activities[2]}
              onChange={(e) => fields.setActivity(2, e.target.value)}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
