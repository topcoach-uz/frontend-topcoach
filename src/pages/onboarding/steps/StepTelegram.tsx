import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import TelegramConnectionContent from 'src/components/TelegramConnectionModal/TelegramConnectionContent';
import { usePatchOnboardingMutation } from 'src/app/services/users';
import { posthog, posthogEnabled } from 'src/lib/posthog';
import styles from '../onboarding.module.scss';

/**
 * Wizard Step (final) — Connect Telegram. Reuses the same content used
 * inside TelegramConnectionModal (extracted into TelegramConnectionContent)
 * so the connect flow/copy/status handling stays identical everywhere it
 * appears.
 *
 * This is now the FINAL step: onboarding completion
 * (`patchOnboarding({completed:true})`) fires from BOTH exits here — the
 * "connected" auto-advance (via TelegramConnectionContent's onConnected) and
 * the explicit "Skip for now" link — then navigates to '/student-hub'.
 * Deviates from the shell's usual "step calls onNext, index.tsx owns the
 * PATCH" convention for the same reason StepAcademic used to (see
 * StepInfo.tsx's comment for the established precedent): it doesn't advance
 * to another wizard step, it exits the wizard entirely.
 */
export default function StepTelegram() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patchOnboarding] = usePatchOnboardingMutation();
  const [submitting, setSubmitting] = useState<'connected' | 'skip' | null>(null);

  useEffect(() => {
    if (!posthogEnabled) return;
    posthog.capture('onboarding_step_viewed', { step: 'telegram' });
  }, []);

  const complete = async (source: 'connected' | 'skip') => {
    setSubmitting(source);
    try {
      await patchOnboarding({ completed: true }).unwrap();
      if (posthogEnabled) posthog.capture('onboarding_completed');
      navigate('/student-hub');
    } catch (err: any) {
      message.error(
        err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
        8,
      );
      setSubmitting(null);
    }
  };

  return (
    <div className={styles.body}>
      <TelegramConnectionContent onConnected={() => complete('connected')} />
      <button
        type="button"
        className={styles.skipLink}
        onClick={() => complete('skip')}
        disabled={submitting !== null}
      >
        {submitting === 'skip'
          ? t('onboarding.telegram.completing', 'One moment…')
          : t('onboarding.telegram.skip', 'Skip for now')}
import { useTranslation } from 'react-i18next';
import TelegramConnectionContent from 'src/components/TelegramConnectionModal/TelegramConnectionContent';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

/**
 * Wizard Step 3 — Connect Telegram. Reuses the same content used inside
 * TelegramConnectionModal (extracted into TelegramConnectionContent) so the
 * connect flow/copy/status handling stays identical everywhere it appears.
 * Auto-advances via onConnected once the account is linked; otherwise the
 * user can skip and connect later from Settings.
 */
export default function StepTelegram({ onNext }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.body}>
      <TelegramConnectionContent onConnected={onNext} />
      <button type="button" className={styles.skipLink} onClick={onNext}>
        {t('onboarding.telegram.skip', 'Skip for now')}
      </button>
    </div>
  );
}
