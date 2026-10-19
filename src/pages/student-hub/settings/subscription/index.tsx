import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Skeleton, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetMyOrgMembershipQuery } from 'src/app/services/student-hub/orgMembershipApi';
import { hasActiveCommunityOrgMembership } from 'src/lib/communityOrgAccess';
import {
  useChangeSubscriptionPlanMutation,
  useGetBillingHistoryQuery,
  useGetCurrentSubscriptionQuery,
  useGetPaymentMethodsQuery,
  useGetSubscriptionPlansQuery,
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
import ClickCommunityCheckout from './_components/ClickCommunityCheckout';
import AvailablePlans from './_components/AvailablePlans';
import PaymentMethods from './_components/PaymentMethods';
import BillingHistory, {
  BillingHistoryHeaderActions,
} from './_components/BillingHistory';
import { formatLongDate } from './_components/format';
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

const isSubscriptionState = (
  value: string | null,
): value is SubscriptionState =>
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
  const plansQuery = useGetSubscriptionPlansQuery(undefined, {
    skip: mockMode,
  });
  const subscriptionQuery = useGetCurrentSubscriptionQuery(undefined, {
    skip: mockMode,
  });
  const paymentMethodsQuery = useGetPaymentMethodsQuery(undefined, {
    skip: mockMode,
  });
  const billingHistoryQuery = useGetBillingHistoryQuery(undefined, {
    skip: mockMode,
  });
  const { data: studentOrgMemberships } = useGetMyOrgMembershipQuery(
    undefined,
    { skip: mockMode },
  );

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

  const refreshCheckout = useCallback(
    () =>
      Promise.all([subscriptionQuery.refetch(), billingHistoryQuery.refetch()]),
    [subscriptionQuery.refetch, billingHistoryQuery.refetch],
  );

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
  const plans: PlanDto[] = mockMode ? FIXTURE_PLANS : (plansQuery.data ?? []);
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
  const communityOrganization = hasActiveCommunityOrgMembership(
    studentOrgMemberships,
  )
    ? studentOrgMemberships?.find(
        (member) =>
          member.role === 'student' &&
          member.status === 'active' &&
          member.organization?.status === 'active',
      )?.organization.name
    : undefined;

  // Existing recurring subscribers can still manage their current agreement.
  // Every new purchase uses the hosted Click checkout above.
  const [planChangeConfirm, setPlanChangeConfirm] = useState<PlanDto | null>(
    null,
  );
  const [planChanging, setPlanChanging] = useState(false);
  const planPickerRef = useRef<HTMLElement | null>(null);
  const [changePlan] = useChangeSubscriptionPlanMutation();
  const legacyRecurring = !!subscription && subscription.autoRenew !== false;
  const handleSelectPlan = (plan: PlanDto) => {
    if (!legacyRecurring || !subscription) return;
    const effectiveCurrentId =
      subscription.scheduledPlan?.id ?? subscription.plan.id;
    if (effectiveCurrentId !== plan.id) setPlanChangeConfirm(plan);
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
      {isEmpty && communityOrganization && (
        <Alert
          type="success"
          showIcon
          message={t(
            'settings.subscription.organizationAccess.title',
            'Community access is included',
          )}
          description={t(
            'settings.subscription.organizationAccess.description',
            'Your membership with {{organization}} gives you full Community access. You do not need to buy a plan while that membership is active.',
            { organization: communityOrganization },
          )}
        />
      )}

      {!mockMode && !isLoading && !errorAny && (
        <ClickCommunityCheckout
          plans={plans}
          subscription={subscription}
          onRefresh={refreshCheckout}
        />
      )}

      {/* Hero. The page is opinionated about what's first:
          - Active sub  → the live plan with manage actions
          - Empty       → the plan picker, fully self-contained */}
      {!isEmpty && subscription && subscription.autoRenew !== false && (
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

      {plans.length > 0 && legacyRecurring && (
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
                ? t(
                    'settings.subscription.choosePlanHeader',
                    'Choose your plan',
                  )
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
        {legacyRecurring && (
          <section className={styles.compactSection}>
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
            <PaymentMethods
              paymentMethods={paymentMethods}
              subscription={subscription}
            />
          </section>
        )}

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
    </div>
  );
}
