import { useState } from 'react';
import { Input, Select, InputNumber, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { CustomButton } from 'src/components/common';
import { useAppDispatch } from 'src/app/store';
import { updateProfile } from 'src/app/slices/authSlice';
import { usePatchOnboardingMutation } from 'src/app/services/users';
import {
  useLazyGetMyStudentProfileQuery,
  useUpdateMyStudentProfileMutation,
} from 'src/app/services/student-hub/studentProfileApi';
import { COUNTRY_NATIONALITY_OPTIONS } from 'src/pages/events/youth-leaders-application/countryNationalityOptions';
import { nextStepId } from './types';
import styles from '../onboarding.module.scss';

interface Props {
  initialName?: string;
  initialPhone?: string | null;
  onNext: () => void;
}

/**
 * Wizard Step 2 — "Tell us about yourself" (first/last name, country,
 * optional phone, optional SAT score).
 *
 * Deviates from the shell's usual "step calls onNext, index.tsx owns the
 * PATCH" convention (see StepTelegram.tsx for the established precedent)
 * because Continue here fans out to THREE different backend writes:
 *
 *   1. profile.name -> PUT /users (the same `updateProfile` thunk the
 *      Google-signup role step and StepSource's mentor-exit already use —
 *      `dispatch(updateProfile({ profile: {...} })).unwrap()`).
 *      REQUIRED — gates advancement.
 *
 *   2. country/SAT -> PATCH /student-profile/my-profile — BEST EFFORT ONLY,
 *      never gates advancement. Verified live against a running :8085 with
 *      a brand-new account:
 *        - the endpoint 404s ("Student profile not found for this user")
 *          until the student has a `student_profiles` row at all — the
 *          common case for a user who just signed up and is on step 2 of
 *          onboarding;
 *        - even once a row exists, the `personalProfile` nested DTO
 *          validates `languages`/`personalInterests`/`careerGoals`/
 *          `intendedMajors` as required non-empty arrays on ANY PATCH that
 *          includes `personalProfile` at all (unlike `academicProfile`,
 *          which is a true partial/optional DTO) — fields this step does
 *          not collect (they come later, in the full profile builder /
 *          major-match flow).
 *      So: we only attempt this write when a `student_profiles` row
 *      already exists; we only send `country` when the existing
 *      `personalProfile` already carries those four required arrays
 *      (spreading the *whole* existing object so we never clobber other
 *      fields — the same "load full object, submit full object" merge
 *      discipline `AcademicProfile.tsx` relies on); we always spread the
 *      existing `academicProfile.testScores` before overriding `sat.total`
 *      so other test scores (ACT/IELTS/TOEFL/etc.) already on file survive.
 *      Any failure here is swallowed (console.warn) — for a brand-new
 *      account this section is a no-op today, which is fine: country/SAT
 *      are collected again in the real profile builder before Community.
 *
 *   3. phoneNumber + step -> PATCH /users/onboarding (the shell's usual
 *      per-step pointer advance), done here (not in index.tsx) since it
 *      must run after #1/#2 resolve. REQUIRED — gates advancement.
 */
export default function StepInfo({ initialName, initialPhone, onNext }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [patchOnboarding] = usePatchOnboardingMutation();
  const [updateMyStudentProfile] = useUpdateMyStudentProfileMutation();
  const [fetchMyStudentProfile] = useLazyGetMyStudentProfileQuery();

  const [{ first: initialFirst, last: initialLast }] = useState(() => {
    const trimmed = (initialName ?? '').trim();
    if (!trimmed) return { first: '', last: '' };
    const [first, ...rest] = trimmed.split(/\s+/);
    return { first, last: rest.join(' ') };
  });

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [satTotal, setSatTotal] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; country?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: keyof typeof errors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!firstName.trim()) {
      next.firstName = t('onboarding.info.firstNameRequired', 'First name is required.');
    }
    if (!lastName.trim()) {
      next.lastName = t('onboarding.info.lastNameRequired', 'Last name is required.');
    }
    if (!country) {
      next.country = t('onboarding.info.countryRequired', 'Please select your country.');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Best-effort — see class-level comment above. Never throws to the caller.
  const persistCountryAndSat = async () => {
    if (!country && satTotal == null) return;
    try {
      const existing = await fetchMyStudentProfile().unwrap().catch(() => null);
      if (!existing) return; // no student_profiles row yet — nothing to merge into, skip silently

      const patch: Record<string, unknown> = {};

      if (country) {
        const existingPersonal = existing.personalProfile as any;
        const hasRequiredArrays =
          existingPersonal &&
          Array.isArray(existingPersonal.languages) &&
          existingPersonal.languages.length > 0 &&
          Array.isArray(existingPersonal.personalInterests) &&
          existingPersonal.personalInterests.length > 0 &&
          Array.isArray(existingPersonal.careerGoals) &&
          existingPersonal.careerGoals.length > 0 &&
          Array.isArray(existingPersonal.intendedMajors) &&
          existingPersonal.intendedMajors.length > 0;
        if (hasRequiredArrays) {
          patch.personalProfile = { ...existingPersonal, country };
        }
        // else: skip — sending country alone would 400 (backend requires
        // those four arrays on any personalProfile write) and we won't
        // fabricate placeholder data for real AI-recommendation fields.
      }

      if (satTotal != null) {
        const existingAcademic = (existing.academicProfile as any) ?? {};
        patch.academicProfile = {
          ...existingAcademic,
          testScores: {
            ...(existingAcademic.testScores ?? {}),
            sat: { ...(existingAcademic.testScores?.sat ?? {}), total: satTotal },
          },
        };
      }

      if (Object.keys(patch).length > 0) {
        await updateMyStudentProfile(patch as any).unwrap();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[onboarding] could not save country/SAT to student profile (best-effort, non-blocking)', err);
    }
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await dispatch(updateProfile({ profile: { name: fullName } } as any)).unwrap();

      await persistCountryAndSat();

      const next = nextStepId('info') ?? 'source';
      await patchOnboarding({ phoneNumber: phone.trim() || undefined, step: next }).unwrap();
      onNext();
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
    <div className={styles.body}>
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-first-name">
            {t('onboarding.info.firstName', 'First name')}
          </label>
          <Input
            id="onboarding-first-name"
            size="large"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearError('firstName');
            }}
            placeholder={t('onboarding.info.firstNamePlaceholder', 'First name')}
            maxLength={80}
            status={errors.firstName ? 'error' : undefined}
          />
          {errors.firstName && <div className={styles.errorMsg}>{errors.firstName}</div>}
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-last-name">
            {t('onboarding.info.lastName', 'Last name')}
          </label>
          <Input
            id="onboarding-last-name"
            size="large"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearError('lastName');
            }}
            placeholder={t('onboarding.info.lastNamePlaceholder', 'Last name')}
            maxLength={80}
            status={errors.lastName ? 'error' : undefined}
          />
          {errors.lastName && <div className={styles.errorMsg}>{errors.lastName}</div>}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="onboarding-country">
          {t('onboarding.info.country', 'Country')}
        </label>
        <Select
          id="onboarding-country"
          size="large"
          showSearch
          value={country}
          onChange={(v) => {
            setCountry(v);
            clearError('country');
          }}
          placeholder={t('onboarding.info.countryPlaceholder', 'Select your country')}
          options={COUNTRY_NATIONALITY_OPTIONS as unknown as { value: string; label: string }[]}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          status={errors.country ? 'error' : undefined}
        />
        {errors.country && <div className={styles.errorMsg}>{errors.country}</div>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="onboarding-phone">
          {t('onboarding.info.phone', 'Phone number (optional)')}
        </label>
        <Input
          id="onboarding-phone"
          size="large"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('onboarding.info.phonePlaceholder', '+998 90 123 45 67')}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="onboarding-sat">
          {t('onboarding.info.sat', 'SAT score (optional)')}
        </label>
        <InputNumber
          id="onboarding-sat"
          size="large"
          min={400}
          max={1600}
          style={{ width: '100%' }}
          value={satTotal}
          onChange={(v) => setSatTotal(v ?? null)}
          placeholder={t('onboarding.info.satPlaceholder', 'e.g. 1450')}
        />
      </div>

      <CustomButton type="primary" width="100%" onClick={handleContinue} loading={submitting}>
        {t('btn.continue')}
      </CustomButton>
    </div>
  );
}
