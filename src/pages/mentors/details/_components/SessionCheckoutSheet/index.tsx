import { Button, message, Modal, Radio, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SavedCardOption,
  useGetSessionPayOptionsQuery,
  usePaySessionWithSavedCardMutation,
} from 'src/app/services/sessions';
import styles from './sessionCheckout.module.scss';

interface Props {
  open: boolean;
  sessionId: string | null;
  mentorName?: string;
  onClose: () => void;
  /** Fallback to the hosted /payment page (no saved card, or "use a different card"). */
  onUseDifferentCard: () => void;
  /** Called after a successful one-tap charge. */
  onPaid: () => void;
}

function brandLabel(card: SavedCardOption): string {
  const b = (card.cardBrand || '').toLowerCase();
  if (b === 'uzcard') return 'UZCARD';
  if (b === 'humo') return 'HUMO';
  if (b === 'visa') return 'VISA';
  if (b === 'mastercard') return 'Mastercard';
  return (card.provider || 'Card').toUpperCase();
}

export default function SessionCheckoutSheet({
  open,
  sessionId,
  mentorName = 'your mentor',
  onClose,
  onUseDifferentCard,
  onPaid,
}: Props) {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useGetSessionPayOptionsQuery(sessionId as string, {
    skip: !open || !sessionId,
  });
  const [pay, { isLoading: paying }] = usePaySessionWithSavedCardMutation();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Default-select the default card once options load.
  useEffect(() => {
    if (data?.defaultCardId) setSelectedCardId(data.defaultCardId);
  }, [data?.defaultCardId]);

  // No saved card on file → send the user straight to the hosted page.
  useEffect(() => {
    if (open && data && data.cards.length === 0) {
      onUseDifferentCard();
    }
  }, [open, data, onUseDifferentCard]);

  const handlePay = async () => {
    if (!sessionId || !selectedCardId) return;
    try {
      const res = await pay({ sessionId, paymentMethodId: selectedCardId }).unwrap();
      if (res.status === 'paid') {
        message.success(t('mentors.bookingSuccess', 'Session booked successfully!'));
        onPaid();
      } else {
        // Async-pending — let the hosted page resolve it.
        message.info(t('mentors.paymentProcessing', 'Payment is processing…'));
        onUseDifferentCard();
      }
    } catch (err: any) {
      message.error(err?.data?.message || t('mentors.paymentFailed', 'Payment failed'));
    }
  };

  const amountLabel = data
    ? `${data.currency === 'UZS' ? 'UZS' : ''} ${Number(data.amountUzs).toLocaleString('en-US')}`.trim()
    : '';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={t('mentors.confirmAndPay', 'Confirm & pay')}
      destroyOnClose
      maskClosable={!paying}
    >
      {isFetching && <Skeleton active paragraph={{ rows: 3 }} />}

      {isError && (
        <div className={styles.errorBlock}>
          <p>{t('mentors.checkoutError', 'Could not load payment options.')}</p>
          <Button onClick={onUseDifferentCard}>
            {t('mentors.continueToPayment', 'Continue to payment')}
          </Button>
        </div>
      )}

      {!isFetching && !isError && data && data.cards.length > 0 && (
        <div className={styles.sheet}>
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {t('mentors.sessionWith', 'Session with')} {mentorName}
            </span>
            <span className={styles.amount}>{amountLabel}</span>
          </div>

          <Radio.Group
            className={styles.cardList}
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
          >
            {data.cards.map((card) => (
              <Radio key={card.id} value={card.id} className={styles.cardRow}>
                <span className={styles.cardBrand}>{brandLabel(card)}</span>
                <span className={styles.cardDigits}>•••• {card.last4}</span>
                {card.isDefault && (
                  <span className={styles.defaultPill}>
                    {t('mentors.defaultCard', 'Default')}
                  </span>
                )}
              </Radio>
            ))}
          </Radio.Group>

          <Button
            type="primary"
            block
            size="large"
            loading={paying}
            disabled={!selectedCardId}
            onClick={handlePay}
            className={styles.payBtn}
          >
            {t('mentors.payAmount', 'Pay')} {amountLabel}
          </Button>

          <Button type="link" block onClick={onUseDifferentCard} disabled={paying}>
            {t('mentors.useDifferentCard', 'Use a different card')}
          </Button>
        </div>
      )}
    </Modal>
  );
}
