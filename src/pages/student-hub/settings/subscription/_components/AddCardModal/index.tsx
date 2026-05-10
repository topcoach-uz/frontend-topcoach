import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, message } from 'antd';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useConfirmPaymentMethodMutation,
  useInitPaymentMethodMutation,
} from 'src/app/services/subscription';
import type { PaymentMethodDto } from '../../types';
import OtpInput from '../OtpInput';
import styles from './AddCardModal.module.scss';

export interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired with the newly-confirmed card. Page-level can chain into /subscriptions/start. */
  onSuccess?: (paymentMethod: PaymentMethodDto) => void;
}

type Step = 'form' | 'otp' | 'done';

const RESEND_COOLDOWN_S = 60;

/**
 * 2-step Atmos card bind modal.
 *
 *   Step "form": user enters card number + expiry. We POST /init →
 *                Atmos sends an OTP to their phone → we get back
 *                { paymentMethodId, phoneMasked }.
 *
 *   Step "otp":  user types the 6-digit OTP from the SMS. We POST
 *                /confirm → on success the card flips to active and we
 *                advance to the done state.
 *
 *   Step "done": brief success view, fires onSuccess + auto-closes.
 *
 * Click bind isn't wired yet; the provider chooser is hidden until
 * Phase 3b lands. The modal hardcodes `provider: 'atmos'`.
 */
export default function AddCardModal({
  open,
  onClose,
  onSuccess,
}: AddCardModalProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('form');
  const [pan, setPan] = useState('');
  const [expiry, setExpiry] = useState(''); // displayed MM/YY
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [phoneMasked, setPhoneMasked] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const [doInit, { isLoading: initLoading }] = useInitPaymentMethodMutation();
  const [doConfirm, { isLoading: confirmLoading }] =
    useConfirmPaymentMethodMutation();

  // Reset everything whenever the modal closes — leaving stale OTP /
  // PAN around between opens is a footgun.
  useEffect(() => {
    if (!open) {
      setStep('form');
      setPan('');
      setExpiry('');
      setOtp('');
      setErrorMsg(null);
      setPaymentMethodId(null);
      setPhoneMasked(null);
      setResendIn(0);
    }
  }, [open]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const cleanPan = useMemo(() => pan.replace(/\s+/g, ''), [pan]);
  const expiryYyMm = useMemo(() => mmYyToYyMm(expiry), [expiry]);
  const formValid = cleanPan.length === 16 && expiryYyMm.length === 4;

  const submitForm = async () => {
    if (!formValid) {
      setErrorMsg(
        t(
          'settings.subscription.addCard.invalidForm',
          'Enter a 16-digit card number and a valid MM/YY expiry.',
        ),
      );
      return;
    }
    setErrorMsg(null);
    try {
      const res = await doInit({
        // Click is the primary gateway for Uzcard/Humo cards (which is
        // what virtually all UZ users have). Atmos is the fallback for
        // Visa/MC, but until our Atmos partner-API permission is
        // approved, Click handles 100% of bind traffic.
        provider: 'click',
        cardNumber: cleanPan,
        expiryYyMm,
      }).unwrap();
      setPaymentMethodId(res.paymentMethodId);
      setPhoneMasked(res.phoneMasked);
      setResendIn(RESEND_COOLDOWN_S);
      setStep('otp');
    } catch (err) {
      setErrorMsg(
        extractError(
          err,
          t(
            'settings.subscription.addCard.genericError',
            'Something went wrong. Please try again.',
          ),
        ),
      );
    }
  };

  const submitOtp = async (codeToTry?: string) => {
    if (!paymentMethodId) return;
    const code = codeToTry ?? otp;
    if (code.length !== 6) return;
    setErrorMsg(null);
    try {
      const card = await doConfirm({
        paymentMethodId,
        otp: code,
      }).unwrap();
      setStep('done');
      onSuccess?.(card);
      // Auto-close after a brief success view so the page can react.
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setErrorMsg(
        extractError(
          err,
          t(
            'settings.subscription.addCard.genericError',
            'Something went wrong. Please try again.',
          ),
        ),
      );
      setOtp('');
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setErrorMsg(null);
    setOtp('');
    try {
      // Atmos doesn't expose a free-standing "resend" — we re-issue the
      // bind init with the same PAN+expiry, which yields a fresh OTP
      // and a new transaction_id (so we update paymentMethodId too).
      const res = await doInit({
        provider: 'click',
        cardNumber: cleanPan,
        expiryYyMm,
      }).unwrap();
      setPaymentMethodId(res.paymentMethodId);
      setPhoneMasked(res.phoneMasked);
      setResendIn(RESEND_COOLDOWN_S);
      message.info(
        t(
          'settings.subscription.addCard.otpResent',
          'A new code has been sent.',
        ),
      );
    } catch (err) {
      setErrorMsg(
        extractError(
          err,
          t(
            'settings.subscription.addCard.genericError',
            'Something went wrong. Please try again.',
          ),
        ),
      );
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      className={styles.modal}
      maskClosable={false}
      width={460}
      title={null}
      closable
    >
      {/* Step indicator */}
      <div className={styles.steps} aria-hidden>
        <span
          className={`${styles.stepDot} ${
            step === 'form' ? styles.active : styles.done
          }`}
        />
        <span
          className={`${styles.stepLine} ${
            step === 'otp' || step === 'done' ? styles.done : ''
          }`}
        />
        <span
          className={`${styles.stepDot} ${
            step === 'otp' ? styles.active : step === 'done' ? styles.done : ''
          }`}
        />
        <span
          className={`${styles.stepLine} ${step === 'done' ? styles.done : ''}`}
        />
        <span
          className={`${styles.stepDot} ${step === 'done' ? styles.done : ''}`}
        />
      </div>

      {step === 'form' && (
        <>
          <div className={styles.eyebrow}>
            {t('settings.subscription.addCard.eyebrow', 'Add a card')}
          </div>
          <h3 className={styles.title}>
            {t('settings.subscription.addCard.formTitle', 'Card details')}
          </h3>
          <p className={styles.subtitle}>
            {t(
              'settings.subscription.addCard.formSubtitle',
              'We will send a confirmation code to the phone tied to your card. Uzcard, Humo, Visa, and Mastercard are accepted.',
            )}
          </p>

          {errorMsg && (
            <Alert
              type="error"
              showIcon
              message={errorMsg}
              className={styles.errorAlert}
            />
          )}

          <div className={styles.body}>
            <div className={styles.formGrid}>
              <div className={styles.formRowFull}>
                <label className={styles.fieldLabel}>
                  {t('settings.subscription.cardNumber', 'Card number')}
                </label>
                <Input
                  size="large"
                  value={pan}
                  onChange={(e) =>
                    setPan(
                      e.target.value
                        .replace(/[^\d]/g, '')
                        .slice(0, 16)
                        .replace(/(.{4})/g, '$1 ')
                        .trim(),
                    )
                  }
                  placeholder="8600 1234 5678 9012"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className={styles.formRowFull}>
                <label className={styles.fieldLabel}>
                  {t('settings.subscription.expiry', 'Expiry (MM/YY)')}
                </label>
                <Input
                  size="large"
                  value={expiry}
                  onChange={(e) => setExpiry(formatMmYy(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <Button className={styles.btnGhost} onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              className={styles.btnFilled}
              onClick={submitForm}
              loading={initLoading}
              disabled={!formValid}
            >
              {t('settings.subscription.addCard.sendCode', 'Send code')}
            </Button>
          </div>
        </>
      )}

      {step === 'otp' && (
        <>
          <div className={styles.eyebrow}>
            {t('settings.subscription.addCard.eyebrow', 'Add a card')}
          </div>
          <h3 className={styles.title}>
            {t('settings.subscription.addCard.otpTitle', 'Enter the 6-digit code')}
          </h3>
          <p className={styles.otpHint}>
            {phoneMasked
              ? t(
                  'settings.subscription.addCard.otpSentTo',
                  'We sent a code to {{phone}}.',
                  { phone: phoneMasked },
                )
              : t(
                  'settings.subscription.addCard.otpSent',
                  'We sent a code to the phone tied to your card.',
                )}
          </p>

          {errorMsg && (
            <Alert
              type="error"
              showIcon
              message={errorMsg}
              className={styles.errorAlert}
            />
          )}

          <OtpInput
            value={otp}
            onChange={setOtp}
            onComplete={(code) => submitOtp(code)}
            autoFocus
            disabled={confirmLoading}
            hasError={!!errorMsg}
          />

          <div className={styles.otpResendRow}>
            {resendIn > 0 ? (
              <span>
                {t(
                  'settings.subscription.addCard.resendIn',
                  'Resend in {{seconds}}s',
                  { seconds: resendIn },
                )}
              </span>
            ) : (
              <Button
                className={styles.linkBtn}
                onClick={resend}
                disabled={initLoading}
                type="link"
              >
                {t('settings.subscription.addCard.resend', 'Resend code')}
              </Button>
            )}
          </div>

          <div className={styles.footer}>
            <Button className={styles.btnGhost} onClick={() => setStep('form')}>
              {t('common.back', 'Back')}
            </Button>
            <Button
              type="primary"
              className={styles.btnFilled}
              onClick={() => submitOtp()}
              loading={confirmLoading}
              disabled={otp.length !== 6}
            >
              {t('settings.subscription.addCard.verify', 'Verify')}
            </Button>
          </div>
        </>
      )}

      {step === 'done' && (
        <div className={styles.successCard}>
          <div className={styles.checkBubble} aria-hidden>
            <Check size={28} strokeWidth={2.4} />
          </div>
          <h3 className={styles.title}>
            {t('settings.subscription.addCard.doneTitle', 'Card added')}
          </h3>
          <p className={styles.subtitle}>
            {t(
              'settings.subscription.addCard.doneSubtitle',
              'Your card is verified and ready to use.',
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMmYy(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function mmYyToYyMm(displayed: string): string {
  const digits = displayed.replace(/\D/g, '');
  if (digits.length !== 4) return '';
  const mm = digits.slice(0, 2);
  const yy = digits.slice(2, 4);
  // Atmos wants YYMM (e.g. "2510" for Oct 2025).
  return `${yy}${mm}`;
}

/** Pull a user-friendly message out of an RTK error envelope. */
function extractError(err: unknown, fallback: string): string {
  const anyErr = err as {
    data?: { message?: string | string[]; error?: string };
    status?: number | string;
  };
  const data = anyErr?.data;
  if (data) {
    if (Array.isArray(data.message)) return data.message.join(' • ');
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  return fallback;
}
