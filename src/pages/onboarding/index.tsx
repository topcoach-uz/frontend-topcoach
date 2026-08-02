import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { UserRole } from 'src/app/api/Api';
import { UserType } from 'src/app/type';
import { CustomButton } from 'src/components/common';
import { Logo } from 'src/components/logos';
import Loader from 'src/components/loader';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { updateProfile } from 'src/app/slices/authSlice';
import { useGetMeQuery, usePatchOnboardingMutation } from 'src/app/services/users';
import RoleCard from 'src/pages/auth/signup/_components/role_card';
import styles from './onboarding.module.scss';

/**
 * Post-login onboarding wizard. Only Step 1 (role choice) ships in this PR
 * — steps 2-8 from ONBOARDING_DESIGN.md are future work. Reached whenever
 * OnboardingGate decides a signed-in user's `onboardingCompletedAt` is
 * `null` (see src/lib/onboarding.ts and src/pages/onboarding/OnboardingGate.tsx).
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

  const [selected, setSelected] = useState<UserType>(UserRole.Student);
  const [submitting, setSubmitting] = useState(false);
  const [patchOnboarding] = usePatchOnboardingMutation();

  // A user who already picked Mentor (e.g. re-landing here after abandoning
  // the mentor wizard, per ONBOARDING_DESIGN.md §7) skips the card entirely
  // and goes straight back into the mentor wizard.
  useEffect(() => {
    if (role === UserRole.Mentor) {
      navigate('/auth/signup/mentor?step=1', { replace: true });
    }
  }, [role, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if ((meLoading && !currentUser?.id) || role === UserRole.Mentor) {
    return <Loader height="100vh" />;
  }

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      if (selected === UserRole.Mentor) {
        // Mirrors the existing Google-signup role PATCH (proven pattern,
        // ONBOARDING_DESIGN.md §1/§6) — step=1, never step=0, since an
        // already-authenticated user hitting step 0's email-check 422s.
        await dispatch(
          updateProfile({ profile: { role: UserRole.Mentor } } as any),
        ).unwrap();
        navigate('/auth/signup/mentor?step=1');
        return;
      }

      // Mentee: steps 2-8 aren't built yet, so mark onboarding complete
      // right after role confirmation (future PRs will move this to the
      // Step 5 community handoff instead).
      await patchOnboarding({ completed: true }).unwrap();
      navigate('/student-hub');
    } catch (err: any) {
      message.error(
        err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
        8,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Logo />
        <span className={styles.step}>
          {t('onboarding.stepLabel', 'Step 1 of 1')}
        </span>
        <h1 className={styles.title}>
          {t('onboarding.role.title', 'Are you a mentor or a mentee?')}
        </h1>
        <p className={styles.subtitle}>
          {t(
            'onboarding.role.subtitle',
            'Tell us how you plan to use TopCoach so we can take you to the right place.',
          )}
        </p>
        <div className={styles.body}>
          <RoleCard handleChange={setSelected} selected={selected} />
          <CustomButton
            onClick={handleContinue}
            type="primary"
            width="100%"
            loading={submitting}
          >
            {t('btn.continue')}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
