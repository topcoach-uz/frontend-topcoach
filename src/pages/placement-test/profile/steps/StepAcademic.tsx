import type {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
} from 'src/app/services/admissionsProfileApi';

import { ChipGroup } from '../_components/ChipGroup';
import { SAT_PLAN_OPTIONS } from '../_vocab';
import styles from '../Profile.module.scss';
import { useTranslation } from 'react-i18next';

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
  /** Per-field error map populated by the wizard on `Next` click. */
  errors?: Record<string, string>;
};

/**
 * Academic step — explicitly NO GPA field. SAT score is optional (users
 * who haven't taken it leave it empty); SAT plan is required so the
 * roadmap can place prep on the timeline.
 */
export function StepAcademic({ draft, onChange, profile, errors = {} }: Props) {
  const { t } = useTranslation();
  const get = <K extends keyof PatchAdmissionsProfileBody>(
    key: K,
  ): PatchAdmissionsProfileBody[K] | undefined =>
    draft[key] ?? (profile?.[key as keyof AdmissionsProfileDto] as never);

  const satScore = get('satScore');
  const satPlan = get('satPlan') ?? null;
  const extracurriculars = (get('extracurriculars') as string | undefined) ?? '';
  const targetDegree = get('targetDegree') ?? 'bachelor';

  if (targetDegree === 'master') {
    const field = (key: keyof PatchAdmissionsProfileBody) => (get(key) as string | number | undefined) ?? '';
    return <>
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="previousDegree">{t('placementProfile.previousDegree', 'Bachelor’s degree')}</label><input id="previousDegree" className={styles.input} value={field('previousDegree')} onChange={(e)=>onChange({previousDegree:e.target.value})}/>{errors.previousDegree && <div className={styles.errorText}>{errors.previousDegree}</div>}</div>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="previousField">{t('placementProfile.previousField', 'Field of study')}</label><input id="previousField" className={styles.input} value={field('previousField')} onChange={(e)=>onChange({previousField:e.target.value})}/>{errors.previousField && <div className={styles.errorText}>{errors.previousField}</div>}</div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="bachelorGraduationYear">{t('placementProfile.bachelorGraduationYear', 'Bachelor’s graduation year')}</label><input id="bachelorGraduationYear" type="number" min={1900} max={2100} className={styles.input} value={field('bachelorGraduationYear')} onChange={(e)=>onChange({bachelorGraduationYear:Number(e.target.value)})}/>{errors.bachelorGraduationYear && <div className={styles.errorText}>{errors.bachelorGraduationYear}</div>}</div>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="universityGpa">{t('placementProfile.universityGpa', 'University GPA')}</label><input id="universityGpa" className={styles.input} value={field('universityGpa')} onChange={(e)=>onChange({universityGpa:e.target.value})} placeholder="e.g. 3.7" /></div>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="universityGpaScale">{t('placementProfile.universityGpaScale', 'GPA scale')}</label><input id="universityGpaScale" className={styles.input} value={field('universityGpaScale')} onChange={(e)=>onChange({universityGpaScale:e.target.value})} placeholder="e.g. 4.0 or 100" /></div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="greScore">{t('placementProfile.greScore', 'GRE score (optional)')}</label><input id="greScore" className={styles.input} value={field('greScore')} onChange={(e)=>onChange({greScore:e.target.value})}/></div>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="gmatScore">{t('placementProfile.gmatScore', 'GMAT score (optional)')}</label><input id="gmatScore" className={styles.input} value={field('gmatScore')} onChange={(e)=>onChange({gmatScore:e.target.value})}/></div>
      </div>
      <div className={styles.fieldGroup}><label className={styles.label} htmlFor="relevantExperience">{t('placementProfile.relevantExperience', 'Relevant experience (optional)')}</label><textarea id="relevantExperience" className={styles.textarea} value={field('relevantExperience')} onChange={(e)=>onChange({relevantExperience:e.target.value})} placeholder={t('placementProfile.relevantExperiencePlaceholder', 'Research, work, internships, publications, or projects…')} /></div>
    </>;
  }

  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="satScore">
            SAT score (if taken)
          </label>
          <input
            id="satScore"
            className={styles.input}
            type="number"
            min={400}
            max={1600}
            step={10}
            placeholder="1420"
            value={satScore === undefined || satScore === null ? '' : satScore}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                onChange({ satScore: undefined });
              } else {
                onChange({ satScore: Number(v) });
              }
            }}
          />
          <p className={styles.labelHelp}>
            Leave empty if you haven’t taken it yet.
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>SAT plan</label>
          <ChipGroup
            mode="single"
            options={SAT_PLAN_OPTIONS}
            value={satPlan ?? null}
            onChange={(v) => onChange({ satPlan: v ?? undefined })}
          />
          {errors.satPlan && <div className={styles.errorText}>{errors.satPlan}</div>}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="extracurriculars">
          Extracurriculars &amp; achievements{' '}
          <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <textarea
          id="extracurriculars"
          className={`${styles.textarea} ${errors.extracurriculars ? styles.inputError : ''}`}
          placeholder="Clubs, sports, competitions, awards, volunteer work…"
          value={extracurriculars}
          onChange={(e) =>
            onChange({ extracurriculars: e.target.value })
          }
          maxLength={2000}
        />
        <p className={styles.labelHelp}>
          A few sentences is plenty. We use this to personalize your roadmap.
        </p>
        {errors.extracurriculars && (
          <div className={styles.errorText}>{errors.extracurriculars}</div>
        )}
      </div>
    </>
  );
}
