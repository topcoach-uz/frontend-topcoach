import ReferralsPanel from 'src/components/referral/ReferralsPanel';
import styles from './ReferralsTab.module.scss';

/**
 * Student hub settings tab. The panel itself is shared with the mentor
 * console; the wrapper adds the student workspace's glass styling only here.
 */
export default function ReferralsTab() {
  return (
    <div className={styles.referrals}>
      <ReferralsPanel />
    </div>
  );
}
