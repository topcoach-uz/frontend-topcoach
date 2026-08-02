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
import {
  OnboardingStepId,
  STEP_ORDER,
  nextStepId,
  prevStepId,
  resolveResumeStepId,
} from './steps/types';
import StepInfo from './steps/StepInfo';
import StepSource from './steps/StepSource';
import StepOpportunity from './steps/StepOpportunity';
import StepTelegram from './steps/StepTelegram';
import styles from './onboarding.module.scss';

/**
 * Post-login onboarding wizard (see ONBOARDING_DESIGN.md). Ships 5 steps
 * (role -> info -> source -> opportunity -> telegram). Completion
 * (`onboardingCompletedAt`) fires at the 'telegram' step (StepTelegram.tsx
 * owns its own patchOnboarding call — see the comment on that component for
 * why it deviates from the generic advance()/onNext pattern used by every
 * other step; StepInfo.tsx deviates the same way, for the same reason: it
 * needs to fan out to multiple backend writes before advancing).
 *
 * 'role' now runs FIRST. A student choosing 'role' just advances to 'info'
 * like any other step; a mentor EXITS the wizard entirely there
 * (profile.role -> Mentor via the same `updateProfile` PUT /users mechanism
 * the Google-signup role step uses, then navigate into the mentor signup
 * wizard at ?step=1) — see `handleRoleNext` below.
 *
 * 'trial', 'majorMatch' and 'academic' were REMOVED (2026-07 trimmed-tail
 * pass) — onboarding now ends after Telegram; the trial pitch, major-match
 * assessment and placement-test handoff are reached later from inside the
 * product itself, not during onboarding.
 *
 * Reached whenever OnboardingGate decides a signed-in user's
 * `onboardingCompletedAt` is `null` (see src/lib/onboarding.ts and
 * src/pages/onboarding/OnboardingGate.tsx).
 *
 * Resume: on mount, jumps straight to `onboardingStep` from getMe, mapping
 * any legacy step value (from before this step order was restructured, or
 * from before the tail was trimmed) onto its closest surviving step, falling
 * back to STEP_ORDER[0] ('role') if unrecognized (see `resolveResumeStepId`
 * in ./steps/types.ts). Every "Next" PATCHes the step forward so a refresh
 * always resumes correctly.
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

  const [step, setStep] = useState<OnboardingStepId>(STEP_ORDER[0]);
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
    setStep(resolveResumeStepId(onboardingUser?.onboardingStep));
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
  // collect their own payload beyond the step pointer (role, opportunity,
  // telegram).
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

  const handleSourceNext = async (value?: string, reasons?: string[]) => {
    const next = nextStepId('source') ?? 'source';
    setSubmitting(true);
    try {
      await patchOnboarding({ hearAboutSource: value, usageReasons: reasons, step: next }).unwrap();
      setStep(next);
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 'role' runs FIRST. A student just advances like any other step; a
  // mentor EXITS the wizard here instead — mirrors the existing
  // Google-signup role PATCH (proven pattern, ONBOARDING_DESIGN.md §1/§6) —
  // step=1, never step=0, since an already-authenticated user hitting
  // step 0's email-check 422s.
  const handleRoleNext = async () => {
    if (roleChoice === UserRole.Mentor) {
      setSubmitting(true);
      try {
        await dispatch(
          updateProfile({ profile: { role: UserRole.Mentor } } as any),
        ).unwrap();
        navigate('/auth/signup/mentor?step=1');
      } catch (err: any) {
        showError(err);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    await advance();
  };

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  const meta: Record<OnboardingStepId, { title: string; subtitle: string }> = {
    role: {
      title: t('onboarding.role.title', 'Are you a student or a mentor?'),
      subtitle: t(
        'onboarding.role.subtitle',
        'Tell us how you plan to use TopCoach so we can take you to the right place.',
      ),
    },
    info: {
      title: t('onboarding.info.title', 'Tell us about yourself'),
      subtitle: t(
        'onboarding.info.subtitle',
        "A few basics to personalize your TopCoach experience — we'll only use these to tailor your account.",
      ),
    },
    source: {
      title: t('onboarding.source.title', 'Where did you hear about us?'),
      subtitle: t(
        'onboarding.source.subtitle',
        'This helps us understand how students find TopCoach.',
      ),
    },
    opportunity: {
      title: t('onboarding.opportunity.title', 'What you get with TopCoach'),
      subtitle: t(
        'onboarding.opportunity.subtitle',
        'Everything you need to build a winning application, in one place.',
      ),
    },
    telegram: {
      title: t('onboarding.telegram.title', 'Connect Telegram'),
      subtitle: t(
        'onboarding.telegram.subtitle',
        "Get session confirmations, reminders, and updates the moment they happen.",
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
            <RoleCard handleChange={setRoleChoice} selected={roleChoice} variant="onboarding" />
            <CustomButton
              onClick={handleRoleNext}
              type="primary"
              width="100%"
              loading={submitting}
            >
              {t('btn.continue')}
            </CustomButton>
          </div>
        )}

        {step === 'info' && (
          <StepInfo
            initialName={currentUser?.profile?.name}
            initialPhone={currentUser?.phoneNumber}
            onNext={() => setStep(nextStepId('info') ?? 'source')}
          />
        )}

        {step === 'source' && (
          <StepSource
            initialValue={onboardingUser?.hearAboutSource}
            initialReasons={onboardingUser?.usageReasons}
            submitting={submitting}
            onNext={handleSourceNext}
          />
        )}

        {step === 'opportunity' && <StepOpportunity onNext={() => advance()} />}

        {step === 'telegram' && <StepTelegram />}
      </div>
    </div>
  );
}
