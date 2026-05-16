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

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
};

export function StepBasic({ draft, onChange, profile }: Props) {
  const get = <K extends keyof PatchAdmissionsProfileBody>(
    key: K,
  ): PatchAdmissionsProfileBody[K] | undefined =>
    draft[key] ?? (profile?.[key as keyof AdmissionsProfileDto] as never);

  const fullName = (get('fullName') as string | undefined) ?? '';
  const gradeLevel = (get('gradeLevel') as number | undefined) ?? '';
  const country = (get('country') as string | undefined) ?? '';
  const currentSchool = (get('currentSchool') as string | undefined) ?? '';
  const parentInvolvement = get('parentInvolvement') ?? null;

  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className={styles.input}
          placeholder="Your name as it appears in your records"
          value={fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          maxLength={120}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gradeLevel">
            Grade level
          </label>
          <select
            id="gradeLevel"
            className={styles.select}
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
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className={styles.input}
            placeholder="Uzbekistan"
            value={country}
            onChange={(e) => onChange({ country: e.target.value })}
            maxLength={120}
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="currentSchool">
          Current school
        </label>
        <input
          id="currentSchool"
          className={styles.input}
          placeholder="Your school name"
          value={currentSchool}
          onChange={(e) => onChange({ currentSchool: e.target.value })}
          maxLength={200}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Is a parent or guardian involved in the process?
        </label>
        <ChipGroup
          mode="single"
          options={PARENT_INVOLVEMENT_OPTIONS}
          value={parentInvolvement ?? null}
          onChange={(v) => onChange({ parentInvolvement: v ?? undefined })}
        />
      </div>
    </>
  );
}
