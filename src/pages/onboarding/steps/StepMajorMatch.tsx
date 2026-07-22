import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Clock, Coins } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import { useStudentProfile } from 'src/hooks/useStudentHub';
import { useGetMajorMatchAccessStatusQuery } from 'src/app/services/student-hub/psychometricApi';
import PsychometricAssessmentPage from 'src/pages/student-hub/psychometric-assessment/PsychometricAssessmentPage';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

/**
 * Wizard Step — "Discover your best-fit major" (AI Major Match /
 * psychometric assessment), between 'trial' and 'academic'.
 *
 * Shows a short intro pitch first. Clicking "Start the assessment" mounts
 * the real `PsychometricAssessmentPage` inline (see the `onExit` prop added
 * there) instead of navigating to it — completing the assessment, or
 * leaving it early, calls `onNext` (the shell's generic advance()) so the
 * wizard moves on to 'academic' rather than routing away to /student-hub.
 *
 * Never dead-ends: while the student has no profile yet, or has no free
 * attempts left, only the intro copy + "Skip for now" are shown (no Start
 * button) with a note that the assessment is still reachable later from
 * Discover.
 */
export default function StepMajorMatch({ onNext }: Props) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const { profile: studentProfile, isLoading: profileLoading } = useStudentProfile();
  const { data: accessStatus, isLoading: accessLoading } = useGetMajorMatchAccessStatusQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id },
  );

  // Active assessment — render the real page inline, full step width (see
  // `.stepWide` on the card in index.tsx), and let it drive the wizard
  // forward via onExit instead of navigating away.
  if (started && studentProfile?.id) {
    return (
      <div className={styles.body}>
        <PsychometricAssessmentPage onExit={onNext} />
      </div>
    );
  }

  const hasProfile = !profileLoading && !!studentProfile?.id;
  const noProfileYet = !profileLoading && !studentProfile?.id;
  const attemptsKnown = hasProfile && !accessLoading;
  const noAttemptsLeft = attemptsKnown && !accessStatus?.canStart;
  const canStart = attemptsKnown && !!accessStatus?.canStart;

  return (
    <div className={styles.body}>
      <ul className={styles.benefitList}>
        <li className={styles.benefitItem}>
          <span className={styles.benefitIcon}>
            <Sparkles size={20} />
          </span>
          <span>
            {t(
              'onboarding.majorMatch.bullet1',
              'AI-powered analysis of your interests, values, and strengths',
            )}
          </span>
        </li>
        <li className={styles.benefitItem}>
          <span className={styles.benefitIcon}>
            <Clock size={20} />
          </span>
          <span>{t('onboarding.majorMatch.bullet2', 'Takes about 15 minutes')}</span>
        </li>
        <li className={styles.benefitItem}>
          <span className={styles.benefitIcon}>
            <Coins size={20} />
          </span>
          <span>
            {t(
              'onboarding.majorMatch.bullet3',
              "Free first attempt — and you'll earn coins for finishing it",
            )}
          </span>
        </li>
      </ul>

      {noProfileYet && (
        <p className={styles.infoNote}>
          {t('onboarding.majorMatch.noProfileNote', 'Complete your profile first to unlock this.')}{' '}
          {t('onboarding.majorMatch.laterHint', 'You can take it later from Discover.')}
        </p>
      )}

      {noAttemptsLeft && (
        <p className={styles.infoNote}>
          {t(
            'onboarding.majorMatch.noAttemptsNote',
            "You've already used your free attempt for this assessment.",
          )}{' '}
          {t('onboarding.majorMatch.laterHint', 'You can take it later from Discover.')}
        </p>
      )}

      {canStart && (
        <CustomButton onClick={() => setStarted(true)} type="primary" width="100%">
          {t('onboarding.majorMatch.start', 'Start the assessment')}
        </CustomButton>
      )}

      <button type="button" className={styles.skipLink} onClick={onNext}>
        {t('onboarding.majorMatch.skip', 'Skip for now')}
      </button>
    </div>
  );
}
