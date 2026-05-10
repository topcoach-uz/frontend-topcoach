import { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { Pencil, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useRemovePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
} from 'src/app/services/subscription';
import type { PaymentMethodDto } from '../../types';
import AddCardModal from '../AddCardModal';
import { formatExpiry } from '../format';
import styles from './PaymentMethods.module.scss';

const BRAND_LABEL: Record<NonNullable<PaymentMethodDto['cardBrand']>, string> = {
  uzcard: 'UZCARD',
  humo: 'HUMO',
  visa: 'VISA',
  mastercard: 'MC',
};

const BRAND_CLASS: Record<NonNullable<PaymentMethodDto['cardBrand']>, string> = {
  uzcard: 'brandUzcard',
  humo: 'brandHumo',
  visa: 'brandVisa',
  mastercard: 'brandMastercard',
};

export interface PaymentMethodsProps {
  /** Saved cards to render (RTK-driven). */
  paymentMethods: PaymentMethodDto[];
  /** When true, the saved-cards list is suppressed (used for `?state=none`). */
  hideList?: boolean;
  /**
   * Externally-controlled "Add a card" modal open state. The page sets
   * this to `true` when a plan-card CTA is clicked so the user lands
   * directly in the card flow.
   */
  forceAddOpen?: boolean;
  /** Fired when the modal closes for any reason. */
  onAddCardClose?: () => void;
  /**
   * Fired with the newly-confirmed card. The page uses this to chain
   * into `/subscriptions/start` when the modal was opened from a
   * plan-card "Start trial" CTA.
   */
  onCardAdded?: (card: PaymentMethodDto) => void;
}

const formatPan = (last4: string): string => `•••• •••• •••• ${last4}`;

/**
 * Live cards list backed by RTK Query. Add-card flow goes through
 * {@link AddCardModal} (Atmos OTP bind, 2 steps); set-default and
 * remove are real mutations that hit the backend and invalidate
 * `PaymentMethod` so the list refetches.
 */
export default function PaymentMethods({
  paymentMethods,
  hideList = false,
  forceAddOpen = false,
  onAddCardClose,
  onCardAdded,
}: PaymentMethodsProps) {
  const { t } = useTranslation();
  const methods = hideList ? [] : paymentMethods;

  const [addOpen, setAddOpen] = useState(false);
  const [setDefault, { isLoading: settingDefault }] =
    useSetDefaultPaymentMethodMutation();
  const [removeMethod] = useRemovePaymentMethodMutation();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Reflect the page-level "Start trial" CTA into the local modal.
  // Local "Add card" button still toggles independently.
  const isOpen = addOpen || forceAddOpen;

  const handleClose = () => {
    setAddOpen(false);
    onAddCardClose?.();
  };

  const handleSuccess = (card: PaymentMethodDto) => {
    message.success(
      t('settings.subscription.toast.cardAdded', 'Card added'),
    );
    onCardAdded?.(card);
  };

  const handleMakeDefault = async (id: string) => {
    try {
      await setDefault(id).unwrap();
      message.success(
        t('settings.subscription.toast.defaultCard', 'Default card updated'),
      );
    } catch (err) {
      message.error(
        extractError(
          err,
          t(
            'settings.subscription.toast.defaultFailed',
            "Couldn't update default card.",
          ),
        ),
      );
    }
  };

  const handleEdit = () => {
    message.info(
      t(
        'settings.subscription.toast.editCard',
        'To change card details, remove this card and add a new one.',
      ),
    );
  };

  const confirmRemove = (card: PaymentMethodDto) => {
    Modal.confirm({
      title: t(
        'settings.subscription.removeCardTitle',
        'Remove this card?',
      ),
      content: t(
        'settings.subscription.removeCardBody',
        'Card ending in {{last4}} will be removed. You can add it back later.',
        { last4: card.last4 },
      ),
      okText: t('settings.subscription.removeCard', 'Remove card'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        setRemovingId(card.id);
        try {
          await removeMethod(card.id).unwrap();
          message.success(
            t('settings.subscription.toast.removeCard', 'Card removed'),
          );
        } catch (err) {
          // Backend returns 409 when this is the only card AND a live
          // sub depends on it. Surface the server's message verbatim
          // — it's already user-facing.
          message.error(
            extractError(
              err,
              t(
                'settings.subscription.toast.removeFailed',
                "Couldn't remove this card.",
              ),
            ),
          );
        } finally {
          setRemovingId(null);
        }
      },
    });
  };

  return (
    <div className={styles.wrapper}>
      {!hideList && methods.length > 0 && (
        <div className={styles.list}>
          {methods.map((pm) => {
            const brand = pm.cardBrand ?? 'visa';
            const expiryLabel =
              pm.expiryMonth != null && pm.expiryYear != null
                ? formatExpiry(pm.expiryMonth, pm.expiryYear)
                : '—';
            const cardholderLabel = pm.cardholder ?? '';
            return (
              <div key={pm.id} className={styles.row}>
                <span
                  className={`${styles.brandBadge} ${styles[BRAND_CLASS[brand]]}`}
                  aria-hidden
                >
                  {BRAND_LABEL[brand]}
                </span>
                <div className={styles.cardInfo}>
                  <div className={styles.pan}>{formatPan(pm.last4)}</div>
                  <div className={styles.cardSub}>
                    {cardholderLabel ? `${cardholderLabel} · ` : ''}
                    {t('settings.subscription.expires', 'expires {{date}}', {
                      date: expiryLabel,
                    })}
                  </div>
                </div>
                <div className={styles.rowActions}>
                  {pm.isDefault ? (
                    <span className={styles.defaultPill}>
                      {t('settings.subscription.default', 'Default')}
                    </span>
                  ) : (
                    <Button
                      className={styles.makeDefaultBtn}
                      size="small"
                      onClick={() => handleMakeDefault(pm.id)}
                      loading={settingDefault}
                    >
                      {t('settings.subscription.makeDefault', 'Make default')}
                    </Button>
                  )}
                  <Button
                    className={styles.iconBtn}
                    aria-label={t('settings.subscription.editCard', 'Edit card')}
                    onClick={handleEdit}
                    icon={<Pencil size={16} />}
                  />
                  <Button
                    className={styles.iconBtn}
                    aria-label={t('settings.subscription.removeCard', 'Remove card')}
                    onClick={() => confirmRemove(pm)}
                    loading={removingId === pm.id}
                    icon={<X size={16} />}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hideList && methods.length === 0 && (
        <div className={styles.emptyHint}>
          {t(
            'settings.subscription.noCards',
            'No saved cards yet. Add one below to subscribe or pay for sessions.',
          )}
        </div>
      )}

      <div>
        <Button
          type="primary"
          className={styles.btnFilled}
          icon={<Plus size={16} />}
          onClick={() => setAddOpen(true)}
        >
          {t('settings.subscription.addCard', 'Add card')}
        </Button>
      </div>

      <AddCardModal
        open={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
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
