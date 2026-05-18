import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Spin, message } from 'antd';
import { ArrowLeft, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useConfirmPaymentMethodMutation,
  useInitCheckoutBindAtmosMutation,
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
type CardFamily = 'click' | 'atmos';

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
  // Which card family the user picked. `null` = the chooser screen is
  // showing. Once chosen we render only the fields that flow actually
  // needs (no PAN/expiry inputs for the Atmos hosted flow).
  const [family, setFamily] = useState<CardFamily | null>(null);
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
  const [doAtmosCheckoutInit, { isLoading: atmosRedirectLoading }] =
    useInitCheckoutBindAtmosMutation();

  // Reset everything whenever the modal closes — leaving stale OTP /
  // PAN around between opens is a footgun.
  useEffect(() => {
    if (!open) {
      setStep('form');
      setFamily(null);
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
  /** BIN-derived provider — only consulted in the Click branch to warn
   *  the user if they typed a Visa/MC PAN into the Uzcard/Humo flow. */
  const detectedProvider = useMemo(() => pickProvider(cleanPan), [cleanPan]);
  /** Provider for the actual submission. Set by the family chooser. */
  const provider = family;
  /**
   * Form validity per family:
   *   Click  — 16-digit PAN + MM/YY expiry + BIN matches Click's accepted networks
   *   Atmos  — no fields needed; the button alone is the action
   */
  const formValid =
    family === 'atmos' ||
    (family === 'click' &&
      cleanPan.length === 16 &&
      expiryYyMm.length === 4 &&
      detectedProvider === 'click');

  /**
   * Fires the Atmos hosted-bind init and redirects the browser to the
   * returned URL. Used both from the chooser tile (zero clicks before
   * the redirect) and as a fallback if the Click flow ever needs to
   * hand off to Atmos.
   */
  const goToAtmos = async () => {
    setErrorMsg(null);
    try {
      const res = await doAtmosCheckoutInit().unwrap();
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error('Missing redirect URL from server');
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

  const submitForm = async () => {
    if (!formValid || !provider) {
      setErrorMsg(
        t(
          'settings.subscription.addCard.invalidForm',
          'Enter a 16-digit card number and a valid MM/YY expiry.',
        ),
      );
      return;
    }
    setErrorMsg(null);

    // Atmos flow doesn't go through this submit handler anymore — it's
    // wired directly to `goToAtmos` from the chooser tile so the user
    // gets a 1-click redirect with no intermediate "Continue" screen.
    // This handler is the Click (Uzcard / Humo) in-modal OTP path.
    try {
      const res = await doInit({
        provider,
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
    if (resendIn > 0 || !provider) return;
    setErrorMsg(null);
    setOtp('');
    try {
      // Atmos doesn't expose a free-standing "resend" — we re-issue the
      // bind init with the same PAN+expiry, which yields a fresh OTP
      // and a new transaction_id (so we update paymentMethodId too).
      const res = await doInit({
        provider,
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

      {step === 'form' && family === null && (
        <>
          <div className={styles.eyebrow}>
            {t('settings.subscription.addCard.eyebrow', 'Add a card')}
          </div>
          <h3 className={styles.title}>
            {t(
              'settings.subscription.addCard.chooseTitle',
              'Choose your card type',
            )}
          </h3>
          <p className={styles.subtitle}>
            {t(
              'settings.subscription.addCard.chooseSubtitle',
              "Uzcard / Humo binds inside this page. Visa / Mastercard binds securely on Atmos's page — we'll redirect you there.",
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

          <div className={styles.familyChooser}>
            <button
              type="button"
              className={styles.familyOption}
              disabled={atmosRedirectLoading}
              onClick={() => {
                setErrorMsg(null);
                setFamily('click');
              }}
            >
              <span className={styles.familyOption__icon}>
                <CreditCard size={20} strokeWidth={2} />
              </span>
              <span className={styles.familyOption__title}>
                {t('settings.subscription.addCard.uzcardHumo', 'Uzcard / Humo')}
              </span>
            </button>

            <button
              type="button"
              className={styles.familyOption}
              disabled={atmosRedirectLoading}
              onClick={goToAtmos}
            >
              <span className={styles.familyOption__icon}>
                {atmosRedirectLoading ? (
                  <Spin size="small" />
                ) : (
                  <ShieldCheck size={20} strokeWidth={2} />
                )}
              </span>
              <span className={styles.familyOption__title}>
                {t(
                  'settings.subscription.addCard.visaMastercard',
                  'Visa / Mastercard',
                )}
              </span>
            </button>
          </div>

          <div className={styles.footer}>
            <Button
              className={styles.btnGhost}
              onClick={onClose}
              disabled={atmosRedirectLoading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </>
      )}

      {step === 'form' && family === 'click' && (
        <>
          <div className={styles.eyebrow}>
            {t('settings.subscription.addCard.eyebrow', 'Add a card')}
          </div>
          <h3 className={styles.title}>
            {t(
              'settings.subscription.addCard.clickTitle',
              'Uzcard / Humo card details',
            )}
          </h3>
          <p className={styles.subtitle}>
            {t(
              'settings.subscription.addCard.clickSubtitle',
              "We'll send a confirmation code to the phone tied to your card.",
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
                {cleanPan.length === 16 && detectedProvider === 'atmos' && (
                  <div className={styles.binHint}>
                    {t(
                      'settings.subscription.addCard.visaInClickFlow',
                      'This looks like a Visa / Mastercard. ',
                    )}
                    <button
                      type="button"
                      className={styles.binHintLink}
                      onClick={() => {
                        setPan('');
                        setExpiry('');
                        setErrorMsg(null);
                        setFamily('atmos');
                      }}
                    >
                      {t(
                        'settings.subscription.addCard.switchToAtmos',
                        'Switch to Visa / Mastercard',
                      )}
                    </button>
                  </div>
                )}
                {cleanPan.length === 16 &&
                  detectedProvider !== 'click' &&
                  detectedProvider !== 'atmos' && (
                    <div className={styles.binHint}>
                      {t(
                        'settings.subscription.addCard.unsupportedBin',
                        'This card type is not supported. Please use a Uzcard, Humo, Visa, or Mastercard.',
                      )}
                    </div>
                  )}
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
            <Button
              className={styles.btnGhost}
              onClick={() => {
                setErrorMsg(null);
                setFamily(null);
              }}
              icon={<ArrowLeft size={14} />}
            >
              {t('common.back', 'Back')}
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
  // Click + Atmos both accept the user-typed MM/YY format directly as
  // a 4-digit MMYY string (e.g. "1230" = Dec 2030). The previous swap
  // here flipped to YYMM which made the form label inverted: users had
  // to type YY/MM to get a valid date. Strip the slash, keep the order.
  return digits;
}

// BIN-based provider routing.
//
// Click handles the local UZ rails (Uzcard / Humo). Atmos handles the
// international Visa / Mastercard rails. Co-brand cards have BINs that
// belong to one of the local networks even though the card is also
// branded Visa or Mastercard — those still go through Click on the
// local rail (the user's bank issued it as a Uzcard or Humo card).
//
//   8600..  → Uzcard                          → Click
//   9860..  → Humo                            → Click
//   5614..  → Uzcard-Mastercard co-brand      → Click (charged on Uzcard rail)
//   4...    → Visa (any, incl. Humo-Visa)     → Atmos
//   51-55.. → Mastercard                      → Atmos
//   2221-2720.. → Mastercard 2-series         → Atmos
//
// Anything else (Amex, Discover, JCB, Maestro 50/56-58, Mir, …) returns
// null so we don't even hit the network with a card the providers will
// reject. The 5614 check runs before the 51-55 check is irrelevant
// (5614 starts with 56, not 51-55) but it's listed first for clarity.
function pickProvider(cleanPan: string): 'click' | 'atmos' | null {
  if (cleanPan.length < 4) return null;
  if (
    cleanPan.startsWith('8600') ||
    cleanPan.startsWith('9860') ||
    cleanPan.startsWith('5614')
  ) {
    return 'click';
  }
  if (cleanPan.startsWith('4')) return 'atmos';
  if (/^5[1-5]/.test(cleanPan)) return 'atmos';
  if (isMastercard2Series(cleanPan)) return 'atmos';
  return null;
}

// Mastercard 2-series: BINs 222100–272099 (4-digit prefix 2221–2720).
// Use the first 4 digits as a number for a clean range check.
function isMastercard2Series(cleanPan: string): boolean {
  if (cleanPan.length < 4) return false;
  const head = Number(cleanPan.slice(0, 4));
  return Number.isFinite(head) && head >= 2221 && head <= 2720;
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
