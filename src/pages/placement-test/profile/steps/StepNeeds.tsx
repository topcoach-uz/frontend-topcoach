import type {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
} from 'src/app/services/admissionsProfileApi';

import { ChipGroup } from '../_components/ChipGroup';
import {
  APPLICATION_TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
} from '../_vocab';
import styles from '../Profile.module.scss';

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
};

/**
 * Final step. No GPA-based challenge offered — keep the list focused
 * on signals the AI roadmap can act on without surfacing the GPA topic.
 */
export function StepNeeds({ draft, onChange, profile }: Props) {
  const getArr = (key: 'challenges'): string[] =>
    draft[key] ?? profile?.[key] ?? [];

  const timeline = draft.applicationTimeline ?? profile?.applicationTimeline ?? null;
  const budget = draft.budgetRange ?? profile?.budgetRange ?? null;

  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Biggest challenges right now</label>
        <p className={styles.labelHelp}>Optional. Pick any that apply.</p>
        <ChipGroup
          mode="multi"
          options={CHALLENGE_OPTIONS}
          value={getArr('challenges')}
          onChange={(v) => onChange({ challenges: v })}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          When do you plan to apply? <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <ChipGroup
          mode="single"
          options={APPLICATION_TIMELINE_OPTIONS}
          value={timeline}
          onChange={(v) => onChange({ applicationTimeline: v ?? undefined })}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Monthly budget for admissions prep{' '}
          <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <ChipGroup
          mode="single"
          options={BUDGET_OPTIONS}
          value={budget}
          onChange={(v) => onChange({ budgetRange: v ?? undefined })}
        />
      </div>
    </>
  );
}
