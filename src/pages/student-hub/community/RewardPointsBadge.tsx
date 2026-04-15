import styles from './communityHubMock.module.scss';

/** Cost badge for reward items: amount + “pts”, affordable vs locked styling */
export function RewardPointsBadge({ cost, canAfford }: { cost: number; canAfford: boolean }) {
  return (
    <span
      className={`${styles.rewardPointsBadge} ${canAfford ? styles.rewardPointsBadgeAffordable : styles.rewardPointsBadgeLocked}`}
      title={`${cost.toLocaleString()} points`}
    >
      <span className={styles.rewardPointsBadgeRow}>
        <span className={styles.rewardPointsBadgeAmount}>{cost.toLocaleString()}</span>
        <span className={styles.rewardPointsBadgeUnit}>pts</span>
      </span>
    </span>
  );
}
