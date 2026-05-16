import { Lock } from 'lucide-react';

import styles from '../Roadmap.module.scss';

type Props = {
  hiddenCount: number;
};

/**
 * Blurred placeholder rows + paywall overlay. The real locked content
 * is never sent from the server — this is purely a visual hint at the
 * structure that's behind the gate.
 */
export function LockedZone({ hiddenCount }: Props) {
  return (
    <div className={styles.lockedZone}>
      <div className={styles.lockedItems}>
        {Array.from({ length: Math.max(1, Math.min(hiddenCount, 5)) }).map(
          (_, i) => (
            <div className={styles.lockedItem} key={i}>
              <span className={`${styles.actionItem__dot}`} />
              <div className={styles.lockedItem__col}>
                <div className={styles.lockedItem__bar} />
                <div className={styles.lockedItem__bar} />
              </div>
            </div>
          ),
        )}
      </div>
      <div className={styles.lockedOverlay}>
        <div className={styles.lockedCard}>
          <span className={styles.lockedCard__icon}>
            <Lock size={16} />
          </span>
          <p className={styles.lockedCard__title}>Unlock full roadmap</p>
          <p className={styles.lockedCard__sub}>
            {hiddenCount} more action items, weekly study plan, and curated
            resources.
          </p>
        </div>
      </div>
    </div>
  );
}
