import type {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
} from 'src/app/services/admissionsProfileApi';

import { ChipGroup } from '../_components/ChipGroup';
import {
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  TARGET_UNIVERSITY_OPTIONS,
} from '../_vocab';
import styles from '../Profile.module.scss';

type Props = {
  draft: PatchAdmissionsProfileBody;
  onChange: (patch: PatchAdmissionsProfileBody) => void;
  profile: AdmissionsProfileDto | null;
};

export function StepGoals({ draft, onChange, profile }: Props) {
  const getArr = (key: 'goals' | 'academicInterests' | 'targetUniversities'): string[] =>
    draft[key] ?? profile?.[key] ?? [];

  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          What are your main goals? <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <p className={styles.labelHelp}>Pick all that apply.</p>
        <ChipGroup
          mode="multi"
          options={GOAL_OPTIONS}
          value={getArr('goals')}
          onChange={(v) => onChange({ goals: v })}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Academic interests <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <ChipGroup
          mode="multi"
          options={INTEREST_OPTIONS}
          value={getArr('academicInterests')}
          onChange={(v) => onChange({ academicInterests: v })}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Target universities <span style={{ color: '#7b1f2f' }}>*</span>
        </label>
        <p className={styles.labelHelp}>
          Choose from the chips or add any school below.
        </p>
        <ChipGroup
          mode="multi"
          options={TARGET_UNIVERSITY_OPTIONS}
          value={getArr('targetUniversities')}
          onChange={(v) => onChange({ targetUniversities: v })}
          allowOther
          max={30}
        />
      </div>
    </>
  );
}
