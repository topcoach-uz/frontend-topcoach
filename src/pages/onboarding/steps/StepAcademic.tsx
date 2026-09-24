import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { GraduationCap, ClipboardList } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import { usePatchOnboardingMutation } from 'src/app/services/users';
import { useCommunityAccessGate } from 'src/lib/communityAccess';
import { posthog, posthogEnabled } from 'src/lib/posthog';
import styles from '../onboarding.module.scss';

/**
 * Wizard Step 8 — Community handoff. This is
 * the FINAL step: onboarding completion (`patchOnboarding({completed:true})`)
 * fires from the two buttons here, not from the 'contact' step anymore (see
 * the removed TEMP comment in StepContact.tsx / index.tsx).
 *
 * Deviates from the shell's usual "step calls onNext, index.tsx owns the
 * PATCH" convention (see StepSource/StepContact handlers in index.tsx):
 * this step doesn't advance to another wizard step, it exits the wizard
 * entirely, and its destination depends on `useCommunityAccessGate()` —
 * a hook that's cheapest to mount only while this step is actually visible
 * (it fires 2 extra queries). Keeping the mutation + hook + navigate calls
 * together here, self-contained, avoids mounting those queries from step 1
 * onward for every onboarding user.
 */
export default function StepAcademic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patchOnboarding] = usePatchOnboardingMutation();
  const gate = useCommunityAccessGate();
  const [submitting, setSubmitting] = useState<'start' | 'skip' | null>(null);

  useEffect(() => {
    if (!posthogEnabled) return;
    posthog.capture('onboarding_step_viewed', { step: 'academic' });
  }, []);

  const completeOnboarding = async () => {
    await patchOnboarding({ completed: true }).unwrap();
    if (posthogEnabled) posthog.capture('onboarding_completed');
  };

  const handleStart = async () => {
    setSubmitting('start');
    try {
      await completeOnboarding();
      // Community access no longer requires the separate placement profile.
      // The gate sends unenrolled users straight to the plan page.
      navigate(gate.destination);
    } catch (err: any) {
      message.error(
        err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
        8,
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleSkip = async () => {
    setSubmitting('skip');
    try {
      await completeOnboarding();
      navigate('/student-hub');
    } catch (err: any) {
      message.error(
        err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
        8,
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className={styles.body}>
      <ul className={styles.benefitList}>
        <li className={styles.benefitItem}>
          <span className={styles.benefitIcon}>
            <ClipboardList size={20} />
          </span>
          <span>
            {t(
              'onboarding.academic.communityBenefit1',
              'Explore the Community plan and the support available to you.',
            )}
          </span>
        </li>
        <li className={styles.benefitItem}>
          <span className={styles.benefitIcon}>
            <GraduationCap size={20} />
          </span>
          <span>
            {t(
              'onboarding.academic.communityBenefit2',
              'You can complete your academic profile later when you want a personalized roadmap.',
            )}
          </span>
        </li>
      </ul>

      <CustomButton
        type="primary"
        width="100%"
        onClick={handleStart}
        loading={submitting === 'start'}
        disabled={submitting === 'skip'}
      >
        {t('onboarding.academic.viewCommunityPlans', 'View Community plans')}
      </CustomButton>

      <button
        type="button"
        className={styles.skipLink}
        onClick={handleSkip}
        disabled={submitting !== null}
      >
        {submitting === 'skip'
          ? t('onboarding.academic.skipping', 'One moment…')
          : t('onboarding.academic.skip', 'Skip for now — go to my dashboard')}
      </button>
    </div>
  );
}
