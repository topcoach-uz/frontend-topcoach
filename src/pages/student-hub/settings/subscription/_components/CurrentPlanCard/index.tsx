import { useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';

import {
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
} from 'src/app/services/subscription';
import type {
  PaymentMethodDto,
  PlanDto,
  SubscriptionDto,
} from '../../types';
import { formatPriceLine, formatLongDate } from '../format';
import styles from './CurrentPlanCard.module.scss';

const { TextArea } = Input;

export interface CurrentPlanCardProps {
  subscription: SubscriptionDto;
  paymentMethod?: PaymentMethodDto;
  /**
   * Fired when the user clicks "Change plan". The page is responsible
   * for scrolling to the plan picker (the existing AvailablePlans
   * cards already render the option set; clicking a different one
   * triggers /change-plan via the page-level handler).
   */
  onChangePlan?: () => void;
}

const PROVIDER_LABEL: Record<PaymentMethodDto['provider'], string> = {
  click: 'Click',
  atmos: 'Atmos',
  payme: 'Payme',
};

const planDisplayName = (plan: PlanDto, lang: string): string => {
  const key = (lang || 'en').slice(0, 2) as keyof typeof plan.displayName;
  return plan.displayName[key] ?? plan.displayName.en;
};

/**
 * Header block for the Subscription tab — surfaces status, the next
 * billing event, and the active payment method. Hosts the cancel /
 * reactivate / change-plan actions.
 *
 * Cancel/reactivate are wired directly to the backend; "Change plan"
 * scrolls the user to the AvailablePlans picker so they pick which
 * plan to switch to (the picker handles the actual /change-plan call
 * via the page's `handleSelectPlan`).
 */
export default function CurrentPlanCard({
  subscription,
  paymentMethod,
  onChangePlan,
}: CurrentPlanCardProps) {
  const { t, i18n } = useTranslation();

  const { id, plan, status, currentPeriodEnd, cancelAtPeriodEnd, trialEndsAt, nextRetryAt } =
    subscription;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [doCancel, { isLoading: cancelling }] = useCancelSubscriptionMutation();
  const [doReactivate, { isLoading: reactivating }] =
    useReactivateSubscriptionMutation();

  const periodLabel =
    plan.period === 'yearly'
      ? t('settings.subscription.period.yearly', 'Yearly')
      : t('settings.subscription.period.monthly', 'Monthly');

  const billedCadence =
    plan.period === 'yearly'
      ? t('settings.subscription.billedYearly', 'billed yearly')
      : t('settings.subscription.billedMonthly', 'billed monthly');

  const priceLine = `${formatPriceLine(plan.priceUsd, plan.priceUzs, plan.period)} · ${billedCadence}`;

  const effectiveStatus: 'active' | 'trial' | 'pastDue' | 'canceled' =
    cancelAtPeriodEnd
      ? 'canceled'
      : status === 'trialing' || status === 'pending'
        ? 'trial'
        : status === 'past_due'
          ? 'pastDue'
          : status === 'canceled' || status === 'expired'
            ? 'canceled'
            : 'active';

  const statusClass = {
    active: styles.statusActive,
    trial: styles.statusTrial,
    pastDue: styles.statusPastDue,
    canceled: styles.statusCanceled,
  }[effectiveStatus];

  const statusLabel = {
    active: t('settings.subscription.status.active', 'Active'),
    trial: t('settings.subscription.status.trial', 'Trial'),
    pastDue: t('settings.subscription.status.pastDue', 'Past due'),
    canceled: t('settings.subscription.status.canceled', 'Canceled'),
  }[effectiveStatus];

  const periodEndDate = currentPeriodEnd ? formatLongDate(currentPeriodEnd) : '—';

  let metaLine: string;
  if (effectiveStatus === 'trial' && trialEndsAt) {
    metaLine = t(
      'settings.subscription.meta.trial',
      'Trial ends {{date}}, first charge ${{price}}',
      {
        date: formatLongDate(trialEndsAt),
        price: plan.priceUsd.toFixed(2),
      },
    );
  } else if (effectiveStatus === 'pastDue' && nextRetryAt) {
    metaLine = t('settings.subscription.meta.pastDue', 'Next retry {{date}}', {
      date: formatLongDate(nextRetryAt),
    });
  } else if (effectiveStatus === 'canceled') {
    metaLine = t('settings.subscription.meta.canceled', 'Access until {{date}}', {
      date: periodEndDate,
    });
  } else {
    metaLine = t('settings.subscription.meta.renews', 'Renews on {{date}}', {
      date: periodEndDate,
    });
  }

  const handleCancelConfirm = async () => {
    try {
      await doCancel({
        subscriptionId: id,
        reason: reason.trim() || undefined,
      }).unwrap();
      message.success(
        t(
          'settings.subscription.toast.cancelScheduled',
          'Cancellation scheduled. You keep access until {{date}}.',
          { date: periodEndDate },
        ),
      );
      setCancelOpen(false);
      setReason('');
    } catch (err) {
      message.error(extractError(err, t('settings.subscription.toast.cancelFailed', "Couldn't cancel.")));
    }
  };

  const handleReactivate = async () => {
    try {
      await doReactivate(id).unwrap();
      message.success(
        t('settings.subscription.toast.reactivated', 'Subscription reactivated.'),
      );
    } catch (err) {
      message.error(
        extractError(
          err,
          t(
            'settings.subscription.toast.reactivateFailed',
            "Couldn't reactivate.",
          ),
        ),
      );
    }
  };

  const handleChange = () => {
    if (onChangePlan) onChangePlan();
    else
      message.info(
        t(
          'settings.subscription.toast.changePlan',
          'Pick a plan from the list below to switch.',
        ),
      );
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>
            {planDisplayName(plan, i18n.language)} · {periodLabel}
          </h3>
          <div className={styles.priceLine}>{priceLine}</div>
          <div className={styles.metaLine}>{metaLine}</div>
        </div>
        <span className={`${styles.statusPill} ${statusClass}`}>{statusLabel}</span>
      </div>

      {paymentMethod && (
        <div className={styles.paymentRow}>
          <span className={styles.paymentBrand}>{PROVIDER_LABEL[paymentMethod.provider]}</span>
          <span>•••• {paymentMethod.last4}</span>
        </div>
      )}

      <div className={styles.actions}>
        {cancelAtPeriodEnd ? (
          <Button
            className={styles.btnFilled}
            type="primary"
            onClick={handleReactivate}
            loading={reactivating}
          >
            {t('settings.subscription.reactivate', 'Reactivate')}
          </Button>
        ) : (
          <>
            <Button
              className={styles.btnGhost}
              onClick={() => setCancelOpen(true)}
              disabled={
                status === 'canceled' ||
                status === 'expired' ||
                status === 'pending'
              }
            >
              {t('settings.subscription.cancelPlan', 'Cancel plan')}
            </Button>
            <Button
              className={styles.btnFilled}
              type="primary"
              onClick={handleChange}
            >
              {t('settings.subscription.changePlan', 'Change plan')}
            </Button>
          </>
        )}
      </div>

      <Modal
        open={cancelOpen}
        title={t('settings.subscription.cancelTitle', 'Cancel subscription?')}
        onCancel={() => {
          setCancelOpen(false);
          setReason('');
        }}
        okText={t('settings.subscription.confirmCancel', 'Yes, cancel')}
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelText={t('settings.subscription.keepPlan', 'Keep my plan')}
        onOk={handleCancelConfirm}
        destroyOnClose
      >
        <p style={{ marginBottom: 12 }}>
          {t(
            'settings.subscription.cancelBody',
            "You'll keep access until {{date}}, then your subscription ends. No refunds for the current period.",
            { date: periodEndDate },
          )}
        </p>
        <label
          htmlFor="cancel-reason"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {t(
            'settings.subscription.cancelReasonLabel',
            'Reason (optional, helps us improve)',
          )}
        </label>
        <TextArea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t(
            'settings.subscription.cancelReasonPlaceholder',
            "What's making you cancel?",
          )}
        />
      </Modal>
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  const anyErr = err as {
    data?: { message?: string | string[] };
  };
  const m = anyErr?.data?.message;
  if (Array.isArray(m)) return m.join(' • ');
  if (typeof m === 'string') return m;
  return fallback;
}
