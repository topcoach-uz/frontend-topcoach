import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { UserRole } from 'src/app/api/Api';
import { UserType } from 'src/app/type';
import { CustomButton } from 'src/components/common';
import { Logo } from 'src/components/logos';
import Loader from 'src/components/loader';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { updateProfile } from 'src/app/slices/authSlice';
import { useGetMeQuery, usePatchOnboardingMutation } from 'src/app/services/users';
import RoleCard from 'src/pages/auth/signup/_components/role_card';
import { OnboardingStatus } from 'src/lib/onboarding';
import { OnboardingStepId, STEP_ORDER, isOnboardingStepId, nextStepId, prevStepId } from './steps/types';
import StepSource from './steps/StepSource';
import StepTelegram from './steps/StepTelegram';
import StepVideo from './steps/StepVideo';
import StepCommunity from './steps/StepCommunity';
import StepContact from './steps/StepContact';
import StepTrial from './steps/StepTrial';
import StepAcademic from './steps/StepAcademic';
import styles from './onboarding.module.scss';

/**
 * Post-login onboarding wizard (see ONBOARDING_DESIGN.md). Ships all 8 steps
 * (role -> source -> telegram -> video -> community -> contact -> trial ->
 * academic). Completion (`onboardingCompletedAt`) fires at the 'academic'
 * step now (StepAcademic.tsx owns its own patchOnboarding call — see the
 * comment on that component for why it deviates from the generic
 * advance()/onNext pattern used by every other step).
 *
 * Reached whenever OnboardingGate decides a signed-in user's
 * `onboardingCompletedAt` is `null` (see src/lib/onboarding.ts and
 * src/pages/onboarding/OnboardingGate.tsx).
 *
 * Resume: on mount, jumps straight to `onboardingStep` from getMe (falls
 * back to 'role' if that field is missing/unrecognized). Every "Next"
 * PATCHes the step forward so a refresh always resumes correctly.
 */
export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const storeProfile = useTypedSelector((s) => s.auth.profile);
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = me || storeProfile;
  const role = currentUser?.profile?.role;
  // onboardingStep/hearAboutSource don't exist on the generated UsersSchema
  // type yet (backend PR shipped after the client was generated) — cast
  // through the same OnboardingStatus shape OnboardingGate already uses.
  const onboardingUser = currentUser as (typeof currentUser & OnboardingStatus) | undefined;

  const [step, setStep] = useState<OnboardingStepId>('role');
  const [roleChoice, setRoleChoice] = useState<UserType>(UserRole.Student);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedInitialStep, setResolvedInitialStep] = useState(false);
  const [patchOnboarding] = usePatchOnboardingMutation();

  // A user who already picked Mentor (e.g. re-landing here after abandoning
  // the mentor wizard, per ONBOARDING_DESIGN.md §7) skips straight back into
  // the mentor wizard instead of re-running the wizard.
  useEffect(() => {
    if (role === UserRole.Mentor) {
      navigate('/auth/signup/mentor?step=1', { replace: true });
    }
  }, [role, navigate]);

  // Resume at whatever step the user last reached.
  useEffect(() => {
    if (resolvedInitialStep) return;
    if (meLoading && !currentUser?.id) return;
    if (role === UserRole.Mentor) return; // handled by the redirect effect above
    if (isOnboardingStepId(onboardingUser?.onboardingStep)) {
      setStep(onboardingUser!.onboardingStep as OnboardingStepId);
    }
    setResolvedInitialStep(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedInitialStep, meLoading, currentUser, role]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if ((meLoading && !currentUser?.id) || role === UserRole.Mentor || !resolvedInitialStep) {
    return <Loader height="100vh" />;
  }

  const showError = (err: any) => {
    message.error(
      err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
      8,
    );
  };

  // Generic "PATCH the next step and move on" used by steps that don't
  // collect their own payload beyond the step pointer (role, telegram,
  // video, community).
  const advance = async (extraPatch: Record<string, unknown> = {}) => {
    const next = nextStepId(step);
    if (!next) return;
    setSubmitting(true);
    try {
      await patchOnboarding({ ...extraPatch, step: next }).unwrap();
      setStep(next);
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSourceNext = async (value?: string) => {
    const next = nextStepId('source') ?? 'source';
    setSubmitting(true);
    try {
      await patchOnboarding({ hearAboutSource: value, step: next }).unwrap();
      if (roleChoice === UserRole.Mentor) {
        // Mirrors the existing Google-signup role PATCH (proven pattern,
        // ONBOARDING_DESIGN.md §1/§6) — step=1, never step=0, since an
        // already-authenticated user hitting step 0's email-check 422s.
        await dispatch(
          updateProfile({ profile: { role: UserRole.Mentor } } as any),
        ).unwrap();
        navigate('/auth/signup/mentor?step=1');
        return;
      }
      setStep(next);
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactNext = async (phoneNumber?: string) => {
    const next = nextStepId('contact') ?? 'contact';
    setSubmitting(true);
    try {
      await patchOnboarding({ phoneNumber, step: next }).unwrap();
      setStep(next);
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  const meta: Record<OnboardingStepId, { title: string; subtitle: string }> = {
    role: {
      title: t('onboarding.role.title', 'Are you a mentor or a mentee?'),
      subtitle: t(
        'onboarding.role.subtitle',
        'Tell us how you plan to use TopCoach so we can take you to the right place.',
      ),
    },
    source: {
      title: t('onboarding.source.title', 'Where did you hear about us?'),
      subtitle: t(
        'onboarding.source.subtitle',
        'This helps us understand how students find TopCoach.',
      ),
    },
    telegram: {
      title: t('onboarding.telegram.title', 'Connect Telegram'),
      subtitle: t(
        'onboarding.telegram.subtitle',
        "Get session confirmations, reminders, and updates the moment they happen.",
      ),
    },
    video: {
      title: t('onboarding.video.title', 'See what TopCoach is about'),
      subtitle: t(
        'onboarding.video.subtitle',
        'A 2-minute look at how mentors and students work together on TopCoach.',
      ),
    },
    community: {
      title: t('onboarding.community.title', "Let's join the community"),
      subtitle: t(
        'onboarding.community.subtitle',
        "You're not doing this alone — thousands of students and mentors are already here.",
      ),
    },
    contact: {
      title: t('onboarding.contact.title', "What's the best number to reach you?"),
      subtitle: t(
        'onboarding.contact.subtitle',
        "We'll only use this for important account and session updates.",
      ),
    },
    trial: {
      title: t('onboarding.trial.title', 'Try 7 days free'),
      subtitle: t(
        'onboarding.trial.subtitle',
        'Unlock the full Community — mentors, sessions, and roadmap — with a free trial.',
      ),
    },
    academic: {
      title: t('onboarding.academic.title', "Let's find your academic level"),
      subtitle: t(
        'onboarding.academic.subtitle',
        "One last step to unlock the Community and personalize your roadmap.",
      ),
    },
  };

  const current = meta[step];
  // Back is client-side only — it does not PATCH the backend. If the user
  // then hits Next again, that PATCH re-saves the same step forward.
  const back = prevStepId(step);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {back && (
          <button
            type="button"
            className={styles.backLink}
            onClick={() => setStep(back)}
            aria-label={t('btn.back')}
          >
            <ArrowLeft size={16} />
            {t('btn.back')}
          </button>
        )}
        <Logo />
        <span className={styles.step}>
          {t('onboarding.stepLabel', 'Step {{current}} of {{total}}', {
            current: stepIndex + 1,
            total: totalSteps,
          })}
        </span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <h1 className={styles.title}>{current.title}</h1>
        <p className={styles.subtitle}>{current.subtitle}</p>

        {step === 'role' && (
          <div className={styles.body}>
            <RoleCard handleChange={setRoleChoice} selected={roleChoice} />
            <CustomButton
              onClick={() => advance()}
              type="primary"
              width="100%"
              loading={submitting}
            >
              {t('btn.continue')}
            </CustomButton>
          </div>
        )}

        {step === 'source' && (
          <StepSource
            initialValue={onboardingUser?.hearAboutSource}
            submitting={submitting}
            onNext={handleSourceNext}
          />
        )}

        {step === 'telegram' && <StepTelegram onNext={() => advance()} />}

        {step === 'video' && <StepVideo onNext={() => advance()} />}

        {step === 'community' && <StepCommunity onNext={() => advance()} />}

        {step === 'contact' && (
          <StepContact
            initialValue={currentUser?.phoneNumber}
            submitting={submitting}
            onNext={handleContactNext}
          />
        )}

        {step === 'trial' && <StepTrial onNext={() => advance()} />}

        {step === 'academic' && <StepAcademic />}
      </div>
    </div>
  );
}
