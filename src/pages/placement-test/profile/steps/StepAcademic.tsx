import type {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
} from 'src/app/services/admissionsProfileApi';

import { ChipGroup } from '../_components/ChipGroup';
import { SAT_PLAN_OPTIONS } from '../_vocab';
import styles from '../Profile.module.scss';

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
};

/**
 * Academic step — explicitly NO GPA field. SAT is optional; users who
 * haven't taken it pick "Haven't taken yet".
 */
export function StepAcademic({ draft, onChange, profile }: Props) {
  const get = <K extends keyof PatchAdmissionsProfileBody>(
    key: K,
  ): PatchAdmissionsProfileBody[K] | undefined =>
    draft[key] ?? (profile?.[key as keyof AdmissionsProfileDto] as never);

  const satScore = get('satScore');
  const satPlan = get('satPlan') ?? null;
  const extracurriculars = (get('extracurriculars') as string | undefined) ?? '';

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
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="extracurriculars">
          Extracurriculars &amp; achievements
        </label>
        <textarea
          id="extracurriculars"
          className={styles.textarea}
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
      </div>
    </>
  );
}
