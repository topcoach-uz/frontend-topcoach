import type {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
} from 'src/app/services/admissionsProfileApi';

import { ChipGroup } from '../_components/ChipGroup';
import {
  GRADE_LEVELS,
  PARENT_INVOLVEMENT_OPTIONS,
} from '../_vocab';
import styles from '../Profile.module.scss';
import { useTranslation } from 'react-i18next';

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
  /**
   * Per-field error map. Keys mirror DTO field names
   * (`fullName` | `gradeLevel` | `country` | `currentSchool` | `parentInvolvement`).
   * Populated by the wizard's `Next`-click validator and cleared as the
   * user edits each field.
   */
  errors?: Record<string, string>;
};

export function StepBasic({ draft, onChange, profile, errors = {} }: Props) {
  const { t } = useTranslation();
  const get = <K extends keyof PatchAdmissionsProfileBody>(
    key: K,
  ): PatchAdmissionsProfileBody[K] | undefined =>
    draft[key] ?? (profile?.[key as keyof AdmissionsProfileDto] as never);

  const fullName = (get('fullName') as string | undefined) ?? '';
  const gradeLevel = (get('gradeLevel') as number | undefined) ?? '';
  const country = (get('country') as string | undefined) ?? '';
  const currentSchool = (get('currentSchool') as string | undefined) ?? '';
  const parentInvolvement = get('parentInvolvement') ?? null;
  const targetDegree = get('targetDegree') ?? null;
  const educationStatus = get('educationStatus') ?? null;
  const previousInstitution = (get('previousInstitution') as string | undefined) ?? '';

  const inputCls = (field: string) =>
    `${styles.input} ${errors[field] ? styles.inputError : ''}`;
  const selectCls = (field: string) =>
    `${styles.select} ${errors[field] ? styles.inputError : ''}`;

  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className={inputCls('fullName')}
          placeholder="Your name as it appears in your records"
          value={fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          maxLength={120}
        />
        {errors.fullName && <div className={styles.errorText}>{errors.fullName}</div>}
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="targetDegree">{t('placementProfile.targetDegree', 'What degree are you applying for?')}</label>
          <select id="targetDegree" className={selectCls('targetDegree')} value={targetDegree ?? ''} onChange={(e) => onChange({ targetDegree: e.target.value as 'bachelor' | 'master' })}>
            <option value="">{t('placementProfile.targetDegreePlaceholder', 'Choose a degree…')}</option><option value="bachelor">{t('placementProfile.targetDegreeBachelor', 'Bachelor’s')}</option><option value="master">{t('placementProfile.targetDegreeMaster', 'Master’s')}</option>
          </select>
          {errors.targetDegree && <div className={styles.errorText}>{errors.targetDegree}</div>}
        </div>
        {targetDegree !== 'master' && <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gradeLevel">
            Grade level
          </label>
          <select
            id="gradeLevel"
            className={selectCls('gradeLevel')}
            value={gradeLevel === '' ? '' : String(gradeLevel)}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                gradeLevel: v === '' ? undefined : Number(v),
              });
            }}
          >
            <option value="">Choose your grade…</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
          {errors.gradeLevel && (
            <div className={styles.errorText}>{errors.gradeLevel}</div>
          )}
        </div>}

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className={inputCls('country')}
            placeholder="Your country"
            value={country}
            onChange={(e) => onChange({ country: e.target.value })}
            maxLength={120}
          />
          {errors.country && <div className={styles.errorText}>{errors.country}</div>}
        </div>
      </div>

      {targetDegree === 'master' && <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="educationStatus">{t('placementProfile.educationStatus', 'Bachelor’s status')}</label><select id="educationStatus" className={selectCls('educationStatus')} value={educationStatus ?? ''} onChange={(e)=>onChange({educationStatus:e.target.value as 'studying'|'graduated'})}><option value="">{t('placementProfile.educationStatusPlaceholder', 'Choose status…')}</option><option value="studying">{t('placementProfile.educationStatusStudying', 'Currently studying')}</option><option value="graduated">{t('placementProfile.educationStatusGraduated', 'Graduated')}</option></select>{errors.educationStatus && <div className={styles.errorText}>{errors.educationStatus}</div>}</div>
        <div className={styles.fieldGroup}><label className={styles.label} htmlFor="previousInstitution">{t('placementProfile.previousInstitution', 'University')}</label><input id="previousInstitution" className={inputCls('previousInstitution')} value={previousInstitution} onChange={(e)=>onChange({previousInstitution:e.target.value})}/>{errors.previousInstitution && <div className={styles.errorText}>{errors.previousInstitution}</div>}</div>
      </div>}

      {targetDegree !== 'master' && <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="currentSchool">
          Current school
        </label>
        <input
          id="currentSchool"
          className={inputCls('currentSchool')}
          placeholder="Your school name"
          value={currentSchool}
          onChange={(e) => onChange({ currentSchool: e.target.value })}
          maxLength={200}
        />
        {errors.currentSchool && (
          <div className={styles.errorText}>{errors.currentSchool}</div>
        )}
      </div>}

      {targetDegree !== 'master' && <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Is a parent or guardian involved in the process?
        </label>
        <ChipGroup
          mode="single"
          options={PARENT_INVOLVEMENT_OPTIONS}
          value={parentInvolvement ?? null}
          onChange={(v) => onChange({ parentInvolvement: v ?? undefined })}
        />
        {errors.parentInvolvement && (
          <div className={styles.errorText}>{errors.parentInvolvement}</div>
        )}
      </div>}
    </>
  );
}
