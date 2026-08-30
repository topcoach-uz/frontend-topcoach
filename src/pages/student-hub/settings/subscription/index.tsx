import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Skeleton, message } from 'antd';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useChangeSubscriptionPlanMutation,
  useGetBillingHistoryQuery,
  useGetCurrentSubscriptionQuery,
  useGetPaymentMethodsQuery,
  useGetSubscriptionPlansQuery,
  useStartSubscriptionMutation,
} from 'src/app/services/subscription';
import { useCommunityAccessGate } from 'src/lib/communityAccess';
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
import { formatLongDate } from './_components/format';
import ConfettiCelebration from 'src/components/confetti';
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
 * the page hydrate from `_mocks/subscription.fixtures.ts` instead, handy
 * when the backend isn't running. See SUBSCRIPTION_PHASES.md for the
 * rollout plan.
 */
export default function SubscriptionTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stateParam = searchParams.get('state');

  // Funnel gate. Users who haven't completed the admissions profile
  // can't enter the Community subscription flow. Admin-granted users +
  // already-subscribed users are `eligible` and see the normal tab below.
  const communityGate = useCommunityAccessGate();

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
  //
  // sessionStorage marker guards against the toast re-firing when the
  // user switches tabs inside Settings (this component unmounts/remounts
  // and React Router may surface a stale URL with the param still
  // attached, leading to the toast appearing again).
  useEffect(() => {
    if (mockMode) return;
    if (searchParams.get('atmosBind') !== 'success') return;
    const SEEN_KEY = 'atmosBind:returned-seen';
    if (sessionStorage.getItem(SEEN_KEY)) {
      // Already toasted in this session, just strip the param defensively.
      const url = new URL(window.location.href);
      url.searchParams.delete('atmosBind');
      window.history.replaceState({}, '', url.toString());
      return;
    }
    sessionStorage.setItem(SEEN_KEY, '1');
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
  // Confirm-before-change modal: when set, we render a Modal asking the
  // user to confirm the (irreversible-until-period-end) plan switch.
  const [planChangeConfirm, setPlanChangeConfirm] = useState<PlanDto | null>(
    null,
  );
  const [planChanging, setPlanChanging] = useState(false);
  // Confirm-before-start modal: when set, we ask the user to confirm
  // before kicking off the 7-day trial / first charge. Without this
  // the click on a plan card silently fires `/subscriptions/start`
  // and users land in a paid state before they realised they
  // committed.
  const [planStartConfirm, setPlanStartConfirm] = useState<PlanDto | null>(
    null,
  );
  const [planStarting, setPlanStarting] = useState(false);
  const paymentMethodsRef = useRef<HTMLElement | null>(null);
  const planPickerRef = useRef<HTMLElement | null>(null);

  const [startSubscription] = useStartSubscriptionMutation();
  const [changePlan] = useChangeSubscriptionPlanMutation();
  // Community is delivered via the Telegram bot, a connection is required
  // before a new member can start a plan (the backend enforces this too).
  // Celebration overlay: appears for ~7s after the trial actually starts
  // (i.e. the /subscriptions/start call returns 2xx). Drives the
  // "card added → trial active → community unlocked" feel that was
  // missing before, the silent message.success toast was the only
  // signal of success and the sidebar locks confused users into
  // thinking nothing had happened.
  const [showTrialCelebration, setShowTrialCelebration] = useState(false);

  const startTrialWithCard = async (planId: string, paymentMethodId: string) => {
    try {
      await startSubscription({ planId, paymentMethodId }).unwrap();
      // Fire the confetti before the toast, the toast disappears in 3s
      // but the celebration runs ~7s so the user actually notices.
      setShowTrialCelebration(true);
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
      // Demo mode, no backend; preserve the previous "open form" UX
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

    // Active subscription? Open the confirm modal instead of firing
    // change-plan immediately. The actual call lives in
    // `confirmScheduledPlanChange`.
    //
    // Effective-plan rule: while a switch is queued, the *scheduled*
    // plan is what the user has chosen, that's what the picker labels
    // "Current plan" and what the status banner reads. Clicking the
    // other card during a scheduled switch is therefore an UNDO (the
    // target equals the live plan id; the backend accepts same-plan
    // when there's a pending change). Clicking the effective-current
    // card (the scheduled one) is a no-op.
    if (subscription) {
      const effectiveCurrentId =
        subscription.scheduledPlan?.id ?? subscription.plan.id;
      if (effectiveCurrentId === plan.id) return;
      setPlanChangeConfirm(plan);
      return;
    }

    const defaultCard = paymentMethods.find((pm) => pm.isDefault);
    if (defaultCard) {
      // User has a card on file, open the confirm modal instead of
      // firing /subscriptions/start straight away. The actual call
      // happens in `confirmPlanStart` after the user clicks OK.
      setPlanStartConfirm(plan);
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

  /**
   * Fires the actual `change-plan` mutation after the user clicks
   * "Confirm switch" in the modal. Closes the modal on success and
   * surfaces the next-charge date in the toast. The banner on
   * CurrentPlanCard (driven by `subscription.scheduledPlan`) gives the
   * user a persistent, reversible reminder afterwards.
   */
  const confirmScheduledPlanChange = async () => {
    if (!subscription || !planChangeConfirm) return;
    const isUndoFlow =
      !!subscription.scheduledPlan &&
      planChangeConfirm.id === subscription.plan.id;
    setPlanChanging(true);
    try {
      await changePlan({
        subscriptionId: subscription.id,
        newPlanId: planChangeConfirm.id,
      }).unwrap();
      const effective = subscription.currentPeriodEnd
        ? formatLongDate(subscription.currentPeriodEnd)
        : ',';
      message.success(
        isUndoFlow
          ? t(
              'settings.subscription.toast.planChangeUndone',
              "Scheduled switch cancelled, you'll stay on your current plan.",
            )
          : t(
              'settings.subscription.toast.planChangeScheduled',
              'Plan change scheduled for {{date}}.',
              { date: effective },
            ),
      );
      setPlanChangeConfirm(null);
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
    } finally {
      setPlanChanging(false);
    }
  };

  /**
   * Fires `/subscriptions/start` after the user clicks the confirm
   * button in the start-plan modal. Uses the default card already on
   * file (the modal only opens when there's one). Closes the modal on
   * success; the celebration overlay + toast take over from there.
   */
  const confirmPlanStart = async () => {
    if (!planStartConfirm) return;
    const defaultCard = paymentMethods.find((pm) => pm.isDefault);
    if (!defaultCard) {
      // Edge case: card was removed between opening the modal and
      // clicking confirm. Drop into the add-card flow.
      setPendingTrialPlan(planStartConfirm);
      setPlanStartConfirm(null);
      setAddCardOpen(true);
      return;
    }
    setPlanStarting(true);
    try {
      await startTrialWithCard(planStartConfirm.id, defaultCard.id);
      setPlanStartConfirm(null);
    } finally {
      setPlanStarting(false);
    }
  };

  const handleCardAdded = async (card: { id: string }) => {
    // If the user came in via a "Start trial" CTA, finish the flow now.
    // Otherwise (just adding a card from the section), do nothing,
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

  // Funnel gate. Before the user is allowed to subscribe (or even see
  // the plan picker / card-add CTA), they must complete the admissions
  // profile. Show a focused "complete this first" card instead of the
  // full tab.
  //
  // Mock mode (`?state=...`) bypasses the gate so designers can still
  // flip through every fixture variant offline.
  const showGate = !mockMode && communityGate.state === 'needs_profile';

  if (showGate) {
    return (
      <div className={styles.page}>
        <Alert
          type="success"
          showIcon
          icon={<Sparkles size={18} />}
          message={t(
            'settings.subscription.gate.title',
            'One quick step before you can subscribe',
          )}
          description={t(
            'settings.subscription.gate.descProfile',
            'Finish your admissions profile (a few quick questions) so we can personalize your roadmap before you start your trial.',
          )}
          action={
            <button
              type="button"
              onClick={() => navigate(communityGate.destination)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#7b1f2f',
                color: '#fff',
                border: '1px solid #7b1f2f',
                padding: '8px 16px',
                borderRadius: 10,
                fontFamily:
                  "'Iowan Old Style', 'Charter', 'Georgia', serif",
                fontSize: '0.92rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <BookOpen size={14} />
              {t('settings.subscription.gate.ctaProfile', 'Continue profile')}
              <ArrowRight size={14} />
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ConfettiCelebration
        show={showTrialCelebration}
        onComplete={() => setShowTrialCelebration(false)}
        title={t('settings.subscription.celebration.title', '🎉 You\'re in! 🎉')}
        subtitle={t(
          'settings.subscription.celebration.subtitle',
          'Welcome to Community, your free trial is active and the full TopCoach journey is unlocked.',
        )}
      />
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
          plans={plans}
          onChangePlan={() => {
            planPickerRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }}
          // Cancel flow step 3 ("too expensive") hands the target plan
          // here, reuse the SAME confirm-before-change modal the
          // AvailablePlans picker triggers, no parallel switch logic.
          onOfferPlanSwitch={(plan) => setPlanChangeConfirm(plan)}
        />
      )}

      {plans.length > 0 && (
        <section className={styles.heroPicker} ref={planPickerRef}>
          {/* One quiet subhead instead of the previous eyebrow + serif
              title + subtitle stack. The page-level "Settings · Manage
              your profile, subscription, and preferences" already
              establishes the section, and the "Subscription & billing"
              tab is active above, repeating the same eyebrow/title
              again read as duplicated chrome.

              The old "Switch anytime. Cancel anytime. 7-day free trial"
              hint lived here too; the plan panel now states the trial
              length and the cancel terms against the actual price, so
              saying it twice added nothing. */}
          <header className={styles.compactHead}>
            <h3 className={styles.subSectionTitle}>
              {isEmpty
                ? t('settings.subscription.choosePlanHeader', 'Choose your plan')
                : t('settings.subscription.availablePlans', 'Available plans')}
            </h3>
          </header>
          <AvailablePlans
            plans={plans}
            currentPlanId={subscription?.plan.id}
            scheduledPlanId={subscription?.scheduledPlan?.id}
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
            subscription={subscription}
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

      {/* Confirm-before-change modal. Reached from the AvailablePlans
          picker only when the user already has a live subscription,
          the empty-state "Start trial" path uses a different flow.
          Copy adapts: clicking the LIVE plan while a switch is queued
          is an UNDO (revert the scheduled switch); clicking any other
          plan is a NEW switch. */}
      {(() => {
        const isUndoFlow =
          !!subscription?.scheduledPlan &&
          !!planChangeConfirm &&
          planChangeConfirm.id === subscription.plan.id;
        const periodEndLabel = subscription?.currentPeriodEnd
          ? formatLongDate(subscription.currentPeriodEnd)
          : ',';
        return (
          <Modal
            open={!!planChangeConfirm}
            title={
              isUndoFlow
                ? t(
                    'settings.subscription.confirmChange.undoTitle',
                    'Cancel the scheduled switch?',
                  )
                : t(
                    'settings.subscription.confirmChange.title',
                    'Switch to {{plan}}?',
                    {
                      plan: planChangeConfirm
                        ? `${planChangeConfirm.displayName.en} · ${
                            planChangeConfirm.period === 'yearly'
                              ? 'Yearly'
                              : 'Monthly'
                          }`
                        : '',
                    },
                  )
            }
            okText={
              isUndoFlow
                ? t(
                    'settings.subscription.confirmChange.undoOk',
                    'Cancel the switch',
                  )
                : t('settings.subscription.confirmChange.ok', 'Confirm switch')
            }
            cancelText={
              isUndoFlow
                ? t(
                    'settings.subscription.confirmChange.undoCancel',
                    'Keep the scheduled switch',
                  )
                : t(
                    'settings.subscription.confirmChange.cancel',
                    'Keep current plan',
                  )
            }
            okButtonProps={{ loading: planChanging, type: 'primary' }}
            onOk={confirmScheduledPlanChange}
            onCancel={() => setPlanChangeConfirm(null)}
            destroyOnClose
          >
            {planChangeConfirm && subscription && (
              <div style={{ lineHeight: 1.55, color: '#4b463f' }}>
                <p style={{ marginBottom: 10 }}>
                  {isUndoFlow && subscription.scheduledPlan
                    ? t(
                        'settings.subscription.confirmChange.undoBody',
                        'This cancels your scheduled switch to {{from}}. On {{date}} you will be charged ${{price}} and continue on {{to}}.',
                        {
                          from: subscription.scheduledPlan.displayName.en,
                          to: planChangeConfirm.displayName.en,
                          date: periodEndLabel,
                          price: planChangeConfirm.priceUsd.toFixed(2),
                        },
                      )
                    : t(
                        'settings.subscription.confirmChange.body',
                        'You will stay on your current plan until {{date}}. On that date your subscription will switch to {{plan}} (${{price}}/{{period}}) and you will be charged ${{price}} USD.',
                        {
                          date: periodEndLabel,
                          plan: planChangeConfirm.displayName.en,
                          price: planChangeConfirm.priceUsd.toFixed(2),
                          period:
                            planChangeConfirm.period === 'yearly'
                              ? 'year'
                              : 'month',
                        },
                      )}
                </p>
                <p style={{ color: '#6b6258', fontSize: 13, margin: 0 }}>
                  {isUndoFlow
                    ? t(
                        'settings.subscription.confirmChange.undoNote',
                        'You can switch to a different plan again at any time.',
                      )
                    : t(
                        'settings.subscription.confirmChange.note',
                        'You can undo this any time before the change takes effect.',
                      )}
                </p>
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Confirm-before-start modal, mirrors the change-plan modal
          above so the two flows feel like one editorial system. Only
          opens when the user already has a card on file; the no-card
          path still routes through AddCardModal. */}
      <Modal
        open={!!planStartConfirm}
        title={
          planStartConfirm
            ? t(
                'settings.subscription.confirmStart.title',
                'Start your {{plan}} plan?',
                {
                  plan: `${planStartConfirm.displayName.en} · ${
                    planStartConfirm.period === 'yearly' ? 'Yearly' : 'Monthly'
                  }`,
                },
              )
            : ''
        }
        okText={
          planStartConfirm && planStartConfirm.trialDays > 0
            ? t(
                'settings.subscription.confirmStart.okTrial',
                'Start {{days}}-day free trial',
                { days: planStartConfirm.trialDays },
              )
            : t('settings.subscription.confirmStart.ok', 'Start subscription')
        }
        cancelText={t('settings.subscription.confirmStart.cancel', 'Not yet')}
        okButtonProps={{ loading: planStarting, type: 'primary' }}
        onOk={confirmPlanStart}
        onCancel={() => setPlanStartConfirm(null)}
        destroyOnClose
      >
        {planStartConfirm && (
          <div style={{ lineHeight: 1.55, color: '#4b463f' }}>
            <p style={{ marginBottom: 10 }}>
              {planStartConfirm.trialDays > 0
                ? t(
                    'settings.subscription.confirmStart.bodyTrial',
                    'Your {{days}}-day free trial starts today. After it ends we will charge your default card ${{price}} USD per {{period}}. You can cancel anytime from this page before the trial ends and you will not be charged.',
                    {
                      days: planStartConfirm.trialDays,
                      price: planStartConfirm.priceUsd.toFixed(2),
                      period:
                        planStartConfirm.period === 'yearly' ? 'year' : 'month',
                    },
                  )
                : t(
                    'settings.subscription.confirmStart.body',
                    'We will charge your default card ${{price}} USD per {{period}} and unlock the full Community immediately.',
                    {
                      price: planStartConfirm.priceUsd.toFixed(2),
                      period:
                        planStartConfirm.period === 'yearly' ? 'year' : 'month',
                    },
                  )}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
