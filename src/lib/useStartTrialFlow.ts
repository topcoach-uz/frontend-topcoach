import { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useGetPaymentMethodsQuery,
  useGetSubscriptionPlansQuery,
  useStartSubscriptionMutation,
} from 'src/app/services/subscription';
import type {
  PaymentMethodDto,
  PlanDto,
} from 'src/pages/student-hub/settings/subscription/types';

/**
 * Reusable "start a Community trial" orchestration.
 *
 * Extracted from the real orchestration in
 * `src/pages/student-hub/settings/subscription/index.tsx` (`handleSelectPlan`
 * / `startTrialWithCard` / `handleCardAdded`) so the onboarding wizard's
 * `trial` step can offer the exact same "pick a plan -> start trial" flow
 * without duplicating the request/error-handling logic.
 *
 * This is a PARALLEL-REUSE extraction (approach b), not a refactor of the
 * settings page: it independently calls the same RTK mutations/queries and
 * is meant to be paired with the same `AddCardModal` component, but the
 * settings page's own `handleSelectPlan` is untouched — it still has its
 * own confirm-before-switch / confirm-before-start modals and scheduled-plan
 * logic that don't apply to a brand-new onboarding user (who by definition
 * has no existing subscription to switch away from). Duplicating the ~10
 * lines of request/error handling here was judged safer than threading a
 * generic hook through the settings page's much more stateful flow, which
 * risked regressing that already-shipped page for no onboarding benefit.
 *
 * Unlike the settings page, this hook skips the "confirm before we charge
 * you" modal when a default card is already on file and starts the trial
 * immediately — onboarding only ever reaches this step for users with zero
 * prior cards, so that path is dead weight here; it's kept only as a
 * defensive fallback in case a user resumes onboarding after already adding
 * a card elsewhere.
 */
export interface UseStartTrialFlowResult {
  plans: PlanDto[];
  plansLoading: boolean;
  /** True while the /subscriptions/start request is in flight. */
  starting: boolean;
  /** Whether the AddCardModal should be open. */
  addCardOpen: boolean;
  /** Call when the user picks a plan card. */
  selectPlan: (plan: PlanDto) => void;
  /** Pass as AddCardModal's onClose. */
  closeAddCard: () => void;
  /** Pass as AddCardModal's onSuccess. */
  handleCardAdded: (card: PaymentMethodDto) => Promise<void>;
}

export function useStartTrialFlow(onStarted?: () => void): UseStartTrialFlowResult {
  const { t } = useTranslation();

  const { data: plans = [], isLoading: plansLoading } = useGetSubscriptionPlansQuery();
  const { data: paymentMethods = [] } = useGetPaymentMethodsQuery();
  const [startSubscription] = useStartSubscriptionMutation();

  const [pendingPlan, setPendingPlan] = useState<PlanDto | null>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const startWithCard = async (planId: string, paymentMethodId: string) => {
    setStarting(true);
    try {
      await startSubscription({ planId, paymentMethodId }).unwrap();
      message.success(
        t('settings.subscription.toast.trialStarted', 'Your free trial has started.'),
      );
      onStarted?.();
    } catch (err) {
      const anyErr = err as { data?: { message?: string | string[] } };
      const m = anyErr?.data?.message;
      const text = Array.isArray(m) ? m.join(' • ') : m;
      message.error(
        text ??
          t(
            'settings.subscription.toast.startFailed',
            "Couldn't start your trial. Please try again.",
          ),
      );
    } finally {
      setStarting(false);
    }
  };

  const selectPlan = (plan: PlanDto) => {
    const defaultCard = paymentMethods.find((pm) => pm.isDefault);
    if (defaultCard) {
      startWithCard(plan.id, defaultCard.id);
      return;
    }

    setPendingPlan(plan);
    setAddCardOpen(true);
  };

  const closeAddCard = () => {
    setAddCardOpen(false);
    setPendingPlan(null);
  };

  const handleCardAdded = async (card: PaymentMethodDto) => {
    if (!pendingPlan) return;
    await startWithCard(pendingPlan.id, card.id);
    setPendingPlan(null);
  };

  return {
    plans,
    plansLoading,
    starting,
    addCardOpen,
    selectPlan,
    closeAddCard,
    handleCardAdded,
  };
}
