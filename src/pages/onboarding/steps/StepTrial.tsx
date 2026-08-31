import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import AvailablePlans from 'src/pages/student-hub/settings/subscription/_components/AvailablePlans';
import AddCardModal from 'src/pages/student-hub/settings/subscription/_components/AddCardModal';
import { useStartTrialFlow } from 'src/lib/useStartTrialFlow';
import { posthog, posthogEnabled } from 'src/lib/posthog';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

/**
 * Wizard Step 7 — "Try 7 days free". Reuses the exact plan-picker
 * (AvailablePlans) and card-bind flow (AddCardModal) from the real
 * subscription tab via `useStartTrialFlow` (see src/lib/useStartTrialFlow.ts
 * for why this is a parallel-reuse extraction rather than a refactor of that
 * page). Connecting Telegram is OPTIONAL and is offered on its own step —
 * it is not required to start a trial, so the plan picker always renders.
 *
 * Both the "trial started" success path and "Maybe later" call the same
 * `onNext` (the shell's generic `advance()`) — there's nothing step-specific
 * to persist either way, just move on to the academic-handoff step.
 */
export default function StepTrial({ onNext }: Props) {
  const { t } = useTranslation();
  const {
    plans,
    plansLoading,
    starting,
    addCardOpen,
    selectPlan,
    closeAddCard,
    handleCardAdded,
  } = useStartTrialFlow(onNext);

  useEffect(() => {
    if (!posthogEnabled) return;
    posthog.capture('onboarding_step_viewed', { step: 'trial' });
  }, []);

  return (
    <div className={styles.body}>
      <div className={styles.trialPitch}>
        <span className={styles.benefitIcon}>
          <Sparkles size={20} />
        </span>
        <span>
          {t(
            'onboarding.trial.pitch',
            '7 days free, on us. Cancel anytime before the trial ends and you will not be charged.',
          )}
        </span>
      </div>

      <div className={styles.trialPlanPicker}>
        {plansLoading ? (
          <div className={styles.trialPlansLoading}>
            {t('onboarding.trial.loadingPlans', 'Loading plans…')}
          </div>
        ) : (
          <AvailablePlans plans={plans} variant="choose" onSelectPlan={selectPlan} />
        )}
      </div>

      <button
        type="button"
        className={styles.skipLink}
        onClick={onNext}
        disabled={starting}
      >
        {t('onboarding.trial.skip', 'Maybe later')}
      </button>

      <AddCardModal open={addCardOpen} onClose={closeAddCard} onSuccess={handleCardAdded} />
    </div>
  );
}
