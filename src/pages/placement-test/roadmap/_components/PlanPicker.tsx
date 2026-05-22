import { useGetSubscriptionPlansQuery } from 'src/app/services/subscription';
import AvailablePlans from 'src/pages/student-hub/settings/subscription/_components/AvailablePlans';

import styles from '../Roadmap.module.scss';

type Props = {
  onChoose: () => void;
};

/**
 * Roadmap paywall plan picker. Renders the same `AvailablePlans` cards
 * the settings · subscription tab uses, with prices pulled from the
 * admin-editable plans API so the two surfaces never drift.
 */
export function PlanPicker({ onChoose }: Props) {
  const { data: plans = [], isLoading } = useGetSubscriptionPlansQuery();

  // Yearly first — matches the highlighted "save" card on the right.
  const orderedPlans = [...plans].sort((a, b) => {
    if (a.period === b.period) return 0;
    return a.period === 'monthly' ? -1 : 1;
  });

  return (
    <>
      <div className={styles.plansHeader}>
        <h2 className={styles.plansHeader__title}>Choose your plan</h2>
        <p className={styles.plansHeader__lede}>
          Start with a 7-day free trial. Cancel anytime.
        </p>
      </div>

      {isLoading || orderedPlans.length === 0 ? (
        <div className={styles.plansSkeleton} aria-hidden />
      ) : (
        <div className={styles.plansShell}>
          <AvailablePlans plans={orderedPlans} onSelectPlan={onChoose} />
        </div>
      )}
    </>
  );
}
