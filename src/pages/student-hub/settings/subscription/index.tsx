import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Skeleton, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useChangeSubscriptionPlanMutation,
  useGetBillingHistoryQuery,
  useGetCurrentSubscriptionQuery,
  useGetPaymentMethodsQuery,
  useGetSubscriptionPlansQuery,
  useStartSubscriptionMutation,
} from 'src/app/services/subscription';
import {
  FIXTURE_BILLING_HISTORY,
  FIXTURE_PAYMENT_METHODS,
  FIXTURE_PLANS,
  FIXTURES_BY_STATE,
  SubscriptionState,
} from './_mocks/subscription.fixtures';
import type {
  BillingHistoryEntryDto,
  PaymentMethodDto,
  PlanDto,
  SubscriptionDto,
} from './types';
import CurrentPlanCard from './_components/CurrentPlanCard';
import AvailablePlans from './_components/AvailablePlans';
import PaymentMethods from './_components/PaymentMethods';
import BillingHistory, {
  BillingHistoryHeaderActions,
} from './_components/BillingHistory';
import styles from './subscription.module.scss';

const VALID_STATES: SubscriptionState[] = [
  'active',
  'trialing',
  'pending',
  'past_due',
  'canceled',
  'expired',
  'none',
];

const isSubscriptionState = (value: string | null): value is SubscriptionState =>
  !!value && (VALID_STATES as string[]).includes(value);

/**
 * Phase 2B "Subscription & billing" tab.
 *
 * Reads live data from the four `subscriptionApi` endpoints. Preserves
 * a dev-only mock mode: appending `?state=mock` (or any subscription
 * state name like `?state=active|trialing|past_due|canceled|none`) makes
 * the page hydrate from `_mocks/subscription.fixtures.ts` instead — handy
 * when the backend isn't running. See SUBSCRIPTION_PHASES.md for the
 * rollout plan.
 */
export default function SubscriptionTab() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const stateParam = searchParams.get('state');

  // Mock mode: `?state=mock` always pulls fixtures (defaults to 'active').
  // Any explicit known state name (`active`, `none`, …) is also treated
  // as a mock-mode signal so designers can still flip through every
  // visual state offline.
  const mockMode = stateParam === 'mock' || isSubscriptionState(stateParam);
  const mockState: SubscriptionState = isSubscriptionState(stateParam)
    ? stateParam
    : 'active';

  // Live RTK queries. `skip: mockMode` keeps the network quiet when
  // demoing the mocked variants offline.
  const plansQuery = useGetSubscriptionPlansQuery(undefined, { skip: mockMode });
  const subscriptionQuery = useGetCurrentSubscriptionQuery(undefined, { skip: mockMode });
  const paymentMethodsQuery = useGetPaymentMethodsQuery(undefined, { skip: mockMode });
  const billingHistoryQuery = useGetBillingHistoryQuery(undefined, { skip: mockMode });

  // After Atmos's hosted bind page finishes, the user lands back here
  // with `?atmosBind=success`. The server-to-server callback that flips
  // the new card to active may arrive a beat before the user's browser
  // returns, so we toast + refetch the cards list a couple of times to
  // catch up, then strip the query param so a refresh doesn't replay it.
  useEffect(() => {
    if (mockMode) return;
    if (searchParams.get('atmosBind') !== 'success') return;
    message.success(
      t(
        'settings.subscription.toast.atmosBindReturned',
        'Card added. Finishing up…',
      ),
    );
    let tries = 0;
    const refresh = () => {
      paymentMethodsQuery.refetch();
      tries += 1;
      if (tries < 5) setTimeout(refresh, 1500);
    };
    refresh();
    // Drop the marker so reloading the page doesn't re-toast.
    const url = new URL(window.location.href);
    url.searchParams.delete('atmosBind');
    window.history.replaceState({}, '', url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  const isLoading =
    !mockMode &&
    (plansQuery.isLoading ||
      subscriptionQuery.isLoading ||
      paymentMethodsQuery.isLoading ||
      billingHistoryQuery.isLoading);

  const errorAny =
    !mockMode &&
    (plansQuery.error ||
      subscriptionQuery.error ||
      paymentMethodsQuery.error ||
      billingHistoryQuery.error);

  // Resolve the data source. In mock mode we fall back to fixtures so
  // the page stays demoable without the backend.
  const plans: PlanDto[] = mockMode
    ? FIXTURE_PLANS
    : (plansQuery.data ?? []);
  const subscription: SubscriptionDto | null = mockMode
    ? FIXTURES_BY_STATE[mockState]
    : (subscriptionQuery.data ?? null);
  const paymentMethods: PaymentMethodDto[] = mockMode
    ? FIXTURE_PAYMENT_METHODS
    : (paymentMethodsQuery.data ?? []);
  const billingHistory: BillingHistoryEntryDto[] = mockMode
    ? FIXTURE_BILLING_HISTORY
    : (billingHistoryQuery.data ?? []);

  // Resolve the default-card row referenced by the active subscription so
  // CurrentPlanCard can show "Click •••• 3347" without re-deriving in
  // child components.
  const defaultPaymentMethod = useMemo(() => {
    if (!subscription) return undefined;
    return (
      paymentMethods.find((pm) => pm.id === subscription.paymentMethodId) ??
      paymentMethods.find((pm) => pm.isDefault)
    );
  }, [subscription, paymentMethods]);

  const isEmpty = subscription === null;

  // Trial-start flow. Two paths:
  //   (a) User has a default card → call /subscriptions/start with
  //       paymentMethodId; backend transitions straight to trialing.
  //   (b) No default card → open AddCardModal, then on success call
  //       /start with the freshly-bound card. We persist the picked
  //       plan in state across the modal's lifetime.
  const [pendingTrialPlan, setPendingTrialPlan] = useState<PlanDto | null>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const paymentMethodsRef = useRef<HTMLElement | null>(null);
  const planPickerRef = useRef<HTMLElement | null>(null);

  const [startSubscription] = useStartSubscriptionMutation();
  const [changePlan] = useChangeSubscriptionPlanMutation();

  const startTrialWithCard = async (planId: string, paymentMethodId: string) => {
    try {
      await startSubscription({ planId, paymentMethodId }).unwrap();
      message.success(
        t(
          'settings.subscription.toast.trialStarted',
          'Your free trial has started.',
        ),
      );
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
    }
  };

  const handleSelectPlan = async (plan: PlanDto) => {
    if (mockMode) {
      // Demo mode — no backend; preserve the previous "open form" UX
      // so designers can still flip through fixtures.
      setPendingTrialPlan(plan);
      setAddCardOpen(true);
      requestAnimationFrame(() => {
        paymentMethodsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
      return;
    }

    // Active subscription? Schedule a plan change for next period.
    // The backend records a PLAN_CHANGED event; the cron applies it
    // post-charge. Same-plan clicks are filtered by the disabled CTA on
    // the card itself.
    if (subscription) {
      if (subscription.plan.id === plan.id) return;
      try {
        await changePlan({
          subscriptionId: subscription.id,
          newPlanId: plan.id,
        }).unwrap();
        const periodEnd = subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
          : '—';
        message.success(
          t(
            'settings.subscription.toast.planChangeScheduled',
            'Plan change scheduled for {{date}}.',
            { date: periodEnd },
          ),
        );
      } catch (err) {
        const anyErr = err as { data?: { message?: string | string[] } };
        const m = anyErr?.data?.message;
        const text = Array.isArray(m) ? m.join(' • ') : m;
        message.error(
          text ??
            t(
              'settings.subscription.toast.planChangeFailed',
              "Couldn't schedule the plan change.",
            ),
        );
      }
      return;
    }

    const defaultCard = paymentMethods.find((pm) => pm.isDefault);
    if (defaultCard) {
      await startTrialWithCard(plan.id, defaultCard.id);
      return;
    }

    // No card → open the add-card modal and pin the plan so we can
    // chain into /start once the card is bound.
    setPendingTrialPlan(plan);
    setAddCardOpen(true);
    requestAnimationFrame(() => {
      paymentMethodsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleAddCardClose = () => {
    setAddCardOpen(false);
    setPendingTrialPlan(null);
  };

  const handleCardAdded = async (card: { id: string }) => {
    // If the user came in via a "Start trial" CTA, finish the flow now.
    // Otherwise (just adding a card from the section), do nothing —
    // the modal already shows the success state.
    if (!pendingTrialPlan || mockMode) return;
    await startTrialWithCard(pendingTrialPlan.id, card.id);
    setPendingTrialPlan(null);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.section}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
        <div className={styles.section}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
        <div className={styles.section}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
        <div className={styles.section}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {errorAny && (
        <Alert
          type="error"
          showIcon
          message={t(
            'settings.subscription.error.title',
            "We couldn't load your subscription details",
          )}
          description={t(
            'settings.subscription.error.description',
            'Please refresh the page or try again in a moment.',
          )}
        />
      )}

      {/* Hero. The page is opinionated about what's first:
          - Active sub  → the live plan with manage actions
          - Empty       → the plan picker, fully self-contained */}
      {!isEmpty && subscription && (
        <CurrentPlanCard
          subscription={subscription}
          paymentMethod={defaultPaymentMethod}
          onChangePlan={() => {
            planPickerRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }}
        />
      )}

      {plans.length > 0 && (
        <section className={styles.heroPicker} ref={planPickerRef}>
          {/* One quiet subhead instead of the previous eyebrow + serif
              title + subtitle stack. The page-level "Settings · Manage
              your profile, subscription, and preferences" already
              establishes the section, and the "Subscription & billing"
              tab is active above — repeating the same eyebrow/title
              again read as duplicated chrome. */}
          <header className={styles.compactHead}>
            <h3 className={styles.subSectionTitle}>
              {isEmpty
                ? t('settings.subscription.choosePlanHeader', 'Choose your plan')
                : t('settings.subscription.availablePlans', 'Available plans')}
            </h3>
            {isEmpty && (
              <p className={styles.compactHint}>
                {t(
                  'settings.subscription.heroSubtitle',
                  'Switch anytime. Cancel anytime. 7-day free trial on every plan.',
                )}
              </p>
            )}
          </header>
          <AvailablePlans
            plans={plans}
            currentPlanId={subscription?.plan.id}
            variant={isEmpty ? 'choose' : 'switch'}
            onSelectPlan={handleSelectPlan}
          />
        </section>
      )}

      {/* Payment methods + Billing history live in a tighter two-column
          grid below the hero so the page reads top-down: pick → pay →
          history. Empty states stay subtle (no giant dashed cards).  */}
      <div className={styles.bottomGrid}>
        <section
          className={styles.compactSection}
          ref={paymentMethodsRef}
        >
          <header className={styles.compactHead}>
            <h3 className={styles.subSectionTitle}>
              {t('settings.subscription.paymentMethods', 'Payment methods')}
            </h3>
            <p className={styles.compactHint}>
              {t(
                'settings.subscription.paymentMethodsHint',
                'Cards used for subscription, sessions, and event passes.',
              )}
            </p>
          </header>
          {pendingTrialPlan && (
            <Alert
              type="info"
              showIcon
              className={styles.trialBanner}
              message={t(
                'settings.subscription.trialBanner',
                'Add a card to start your {{plan}} · {{period}} {{days}}-day free trial. You won’t be charged until {{days}} days from today.',
                {
                  plan:
                    pendingTrialPlan.displayName.en ?? pendingTrialPlan.name,
                  period:
                    pendingTrialPlan.period === 'yearly' ? 'Yearly' : 'Monthly',
                  days: pendingTrialPlan.trialDays,
                },
              )}
            />
          )}
          <PaymentMethods
            paymentMethods={paymentMethods}
            forceAddOpen={addCardOpen}
            onAddCardClose={handleAddCardClose}
            onCardAdded={handleCardAdded}
          />
        </section>

        <section className={styles.compactSection}>
          <header className={styles.compactHead}>
            <div className={styles.compactHeadRow}>
              <h3 className={styles.subSectionTitle}>
                {t('settings.subscription.billingHistory', 'Billing history')}
              </h3>
              {billingHistory.length > 0 && <BillingHistoryHeaderActions />}
            </div>
            <p className={styles.compactHint}>
              {t(
                'settings.subscription.billingHistoryHint',
                'Receipts auto-emailed. Click any line to download a PDF.',
              )}
            </p>
          </header>
          <BillingHistory entries={billingHistory} hideRows={isEmpty} />
        </section>
      </div>
    </div>
  );
}
