import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usesJuniorCommunity } from 'src/lib/onboarding';
import { AutoComplete, Input, Select, message } from 'antd';
import { api } from 'src/app/api';
import { MajorTypeEnum } from 'src/app/api/Api';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { useTranslation } from 'react-i18next';
import { CustomButton } from 'src/components/common';
import { useAppDispatch } from 'src/app/store';
import { updateProfile } from 'src/app/slices/authSlice';
import { usePatchOnboardingMutation } from 'src/app/services/users';
import {
  useEnsureMyProfileMutation,
  useGetMyStudentProfileQuery,
  useUpdateMyStudentProfileMutation,
} from 'src/app/services/student-hub/studentProfileApi';
import { COUNTRY_NATIONALITY_OPTIONS } from 'src/pages/events/youth-leaders-application/countryNationalityOptions';
import i18n from 'src/lib/i18n';
import { nextStepId } from './types';
import styles from '../onboarding.module.scss';
import { COMMON_FIELDS, EducationOption, matchesEducationSearch, mergeEducationOptions } from './educationSuggestions';

interface Props {
  initialName?: string;
  initialPhone?: string | null;
  onNext: () => void;
}

type LanguageCode = 'en' | 'uz' | 'ru' | 'kk';

// Endonyms (a language's name for itself) are never run through t() —
// mirrors src/components/language_select/index.tsx, the app's one existing
// language switcher, which hardcodes these same 4 labels for the same reason.
const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'uz', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
  { value: 'kk', label: 'Qoraqalpoq' },
];

/**
 * Wizard Step 2 — "Tell us about yourself" (first/last name, grade level,
 * school, country, study destination, preferred language, optional phone).
 *
 * SAT was REMOVED from this step — it's now collected in the major-match
 * dashboard popup instead (see CLAUDE.md session notes).
 *
 * Deviates from the shell's usual "step calls onNext, index.tsx owns the
 * PATCH" convention (see StepTelegram.tsx for the established precedent)
 * because Continue here fans out to several backend writes:
 *
 *   1. profile.name -> PUT /users (the same `updateProfile` thunk the
 *      Google-signup role step and StepSource's mentor-exit already use).
 *      REQUIRED — gates advancement.
 *
 *   2. POST /student-profile/management/ensure-profile — fired ONCE on
 *      mount (ref-guarded), best-effort. This is the reliability fix for
 *      the known gap where a brand-new account has no `student_profiles`
 *      row yet when it reaches this step, which made the my-profile PATCH
 *      below silently 404. The Continue handler awaits this same in-flight
 *      promise (if it hasn't settled yet) before attempting #3, so the
 *      ensure-profile call always resolves BEFORE the PATCH is sent,
 *      regardless of how quickly the user fills the form.
 *
 *   3. ONE combined PATCH /student-profile/my-profile with
 *      personalProfile{country, studyAbroadGoals} + academicProfile
 *      {gradeLevel, currentSchool} — best-effort for admissions; required for grades 7–8
 *      before completing the junior community path. The backend's UpdatePersonalProfileDto /
 *      UpdateAcademicProfileDto are true partial DTOs (every field
 *      optional, service merges onto the existing row) — no need to
 *      fetch+merge the existing profile client-side first.
 *
 *   4. phoneNumber + step -> PATCH /users/onboarding (the shell's usual
 *      per-step pointer advance), done here (not in index.tsx) since it
 *      must run after #1/#3 resolve. REQUIRED — gates advancement.
 */
export default function StepInfo({ initialName, initialPhone, onNext }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [patchOnboarding] = usePatchOnboardingMutation();
  const [ensureMyProfile] = useEnsureMyProfileMutation();
  const [updateMyStudentProfile] = useUpdateMyStudentProfileMutation();
  const { data: savedStudentProfile } = useGetMyStudentProfileQuery();

  const [{ first: initialFirst, last: initialLast }] = useState(() => {
    const trimmed = (initialName ?? '').trim();
    if (!trimmed) return { first: '', last: '' };
    const [first, ...rest] = trimmed.split(/\s+/);
    return { first, last: rest.join(' ') };
  });

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [gradeLevel, setGradeLevel] = useState<string | undefined>(undefined);
  const [school, setSchool] = useState('');
  const [targetDegree, setTargetDegree] = useState<'bachelor' | 'master'>();
  const [educationStatus, setEducationStatus] = useState<'studying' | 'graduated'>();
  const [previousInstitution, setPreviousInstitution] = useState('');
  const [previousDegree, setPreviousDegree] = useState('');
  const [previousField, setPreviousField] = useState('');
  const [bachelorGraduationYear, setBachelorGraduationYear] = useState('');
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [language, setLanguage] = useState<LanguageCode>(
    () => (localStorage.getItem('i18nextLng') as LanguageCode) || 'en',
  );
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [universityOptions, setUniversityOptions] = useState<EducationOption[]>([]);
  const [fieldOptions, setFieldOptions] = useState<EducationOption[]>(COMMON_FIELDS.map(value => ({ value })));
  const sortedUniversityOptions = useMemo(() => [...universityOptions].sort((a, b) =>
    Number(b.country === country) - Number(a.country === country) || a.value.localeCompare(b.value)),
  [universityOptions, country]);

  useEffect(() => {
    if (targetDegree !== 'master') return;
    let active = true;
    const controller = new AbortController();
    const toOptions = (names: string[]) => [...new Set(names.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(value => ({ value }));
    // Prior education can be at any university, including one outside our catalog.
    // Each list can fail independently; typed values remain valid in either case.
    void Promise.allSettled([
      Promise.allSettled([
        fetch('/world-universities.json', { signal: controller.signal }).then(async response => {
          if (!response.ok) throw new Error('University directory unavailable');
          const entries: { name: string; country: string }[] = await response.json();
          return entries.map(item => ({ value: item.name, country: item.country, label: `${item.name} — ${item.country}` }));
        }),
        api.university.getUnivsList({ signal: controller.signal }).then(({ data }) =>
          toOptions(data.map(item => getTranslation(item.name) || ''))),
      ]).then(results => {
        if (active) setUniversityOptions(mergeEducationOptions(results.flatMap(result =>
          result.status === 'fulfilled' ? result.value : [])));
      }),
      api.university.getFilters({ signal: controller.signal }).then(({ data }) => {
        if (active) setFieldOptions(mergeEducationOptions([...COMMON_FIELDS.map(value => ({ value })), ...toOptions(data.majors
          .filter(item => item.type === MajorTypeEnum.Undergraduate)
          .map(item => getTranslation(item.name) || ''))]));
      }),
    ]);
    return () => { active = false; controller.abort(); };
  }, [targetDegree, language]);

  const educationSearchPlaceholder = t('onboarding.info.searchOrEnter', 'Search or enter your own');
  const filterEducationOption = matchesEducationSearch;

  useEffect(() => {
    const academic = savedStudentProfile?.academicProfile;
    if (!academic) return;
    setTargetDegree(academic.targetDegree ?? undefined);
    setGradeLevel(academic.gradeLevel == null ? undefined : String(academic.gradeLevel));
    setSchool(academic.currentSchool ?? '');
    setEducationStatus(academic.educationStatus ?? undefined);
    setPreviousInstitution(academic.previousInstitution ?? '');
    setPreviousDegree(academic.previousDegree ?? '');
    setPreviousField(academic.previousField ?? '');
    setBachelorGraduationYear(academic.bachelorGraduationYear?.toString() ?? '');
  }, [savedStudentProfile?.academicProfile]);

  // Fire-and-forget, ref-guarded — see class-level comment above (#2).
  const ensureProfileRef = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    if (ensureProfileRef.current) return;
    ensureProfileRef.current = ensureMyProfile().unwrap().catch((err) => {
      ensureProfileRef.current = null;
      return Promise.reject(err);
    });
    void ensureProfileRef.current.catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = (key: keyof typeof errors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: typeof errors = {};
    const junior = usesJuniorCommunity({ gradeLevel, targetDegree });
    if (!firstName.trim()) {
      next.firstName = t('onboarding.info.firstNameRequired', 'First name is required.');
    }
    if (!lastName.trim()) {
      next.lastName = t('onboarding.info.lastNameRequired', 'Last name is required.');
    }
    if (!country && !junior) {
      next.country = t('onboarding.info.countryRequired', 'Please select your country.');
    }
    if (!targetDegree && !junior) next.targetDegree = t('onboarding.info.targetDegreeRequired', 'Choose the degree you plan to pursue.');
    if (targetDegree === 'bachelor' && !gradeLevel) next.gradeLevel = t('onboarding.info.gradeLevelRequired', 'Select your current education stage.');
    if (targetDegree === 'master') {
      if (!educationStatus) next.educationStatus = t('onboarding.info.educationStatusRequired', 'Select your bachelor’s status.');
      if (!previousInstitution.trim()) next.previousInstitution = t('onboarding.info.previousInstitutionRequired', 'Enter your university.');
      if (!previousDegree.trim()) next.previousDegree = t('onboarding.info.previousDegreeRequired', 'Enter your bachelor’s degree.');
      if (!previousField.trim()) next.previousField = t('onboarding.info.previousFieldRequired', 'Enter your field of study.');
      const year = Number(bachelorGraduationYear);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) next.bachelorGraduationYear = t('onboarding.info.bachelorGraduationYearRequired', 'Enter a year from 1900 to 2100.');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleDestinationChange = (values: string[]) => {
    const justAddedNotSure = values.includes('not-sure') && !destinations.includes('not-sure');
    if (justAddedNotSure) {
      setDestinations(['not-sure']);
      return;
    }
    setDestinations(values.filter((v) => v !== 'not-sure'));
  };

  const handleLanguageChange = (lng: LanguageCode) => {
    setLanguage(lng);
    // Live switch (no reload) — i18next-browser-languagedetector persists
    // to localStorage['i18nextLng'] automatically on changeLanguage, same
    // as src/components/language_select/index.tsx.
    i18n.changeLanguage(lng);
  };

  // Admissions saves remain best-effort; junior grades must be persisted before completion.
  const persistProfileFields = async () => {
    const personalProfile: Record<string, unknown> = {};
    if (country) personalProfile.country = country;
    if (destinations.length > 0) {
      personalProfile.studyAbroadGoals = destinations.includes('not-sure')
        ? { interest: true }
        : { interest: true, targetCountries: destinations };
    }

    const academicProfile: Record<string, unknown> = {};
    academicProfile.targetDegree = targetDegree;
    if (targetDegree !== 'master') {
      if (gradeLevel && /^\d+$/.test(gradeLevel)) academicProfile.gradeLevel = Number(gradeLevel);
      academicProfile.gapYear = gradeLevel === 'gap-year';
      academicProfile.educationStatus = gradeLevel === 'graduated' ? 'graduated' : 'studying';
      if (school.trim()) academicProfile.currentSchool = school.trim();
    } else {
      academicProfile.educationStatus = educationStatus;
      academicProfile.previousInstitution = previousInstitution.trim();
      academicProfile.previousDegree = previousDegree.trim();
      academicProfile.previousField = previousField.trim();
      academicProfile.bachelorGraduationYear = Number(bachelorGraduationYear);
    }

    const patch: Record<string, unknown> = {};
    if (Object.keys(personalProfile).length > 0) patch.personalProfile = personalProfile;
    if (Object.keys(academicProfile).length > 0) patch.academicProfile = academicProfile;
    if (Object.keys(patch).length === 0) return;

    try {
      if (!ensureProfileRef.current) ensureProfileRef.current = ensureMyProfile().unwrap();
      await ensureProfileRef.current;
      await updateMyStudentProfile(patch as any).unwrap();
    } catch (err) {
      if (usesJuniorCommunity({ gradeLevel, targetDegree }) || targetDegree === 'master') throw err;
      // eslint-disable-next-line no-console
      console.warn('[onboarding] could not save profile fields (best-effort, non-blocking)', err);
    }
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await dispatch(updateProfile({ profile: { name: fullName } } as any)).unwrap();

      await persistProfileFields();

      if (usesJuniorCommunity({ gradeLevel, targetDegree })) {
        await patchOnboarding({ phoneNumber: phone.trim() || undefined, completed: true }).unwrap();
        navigate('/student-hub?section=feed', { replace: true });
        return;
      }

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

  const GRADE_LEVEL_OPTIONS = [
    { value: '7', label: t('onboarding.info.gradeLevel7', '7th grade') },
    { value: '8', label: t('onboarding.info.gradeLevel8', '8th grade') },
    { value: '9', label: t('onboarding.info.gradeLevel9', '9th grade') },
    { value: '10', label: t('onboarding.info.gradeLevel10', '10th grade') },
    { value: '11', label: t('onboarding.info.gradeLevel11', '11th grade') },
    { value: '12', label: t('onboarding.info.gradeLevel12', '12th grade') },
    { value: 'gap-year', label: t('onboarding.info.gradeLevelGapYear', 'Gap year') },
    { value: 'graduated', label: t('onboarding.info.gradeLevelGraduated', 'Already graduated') },
  ];

  const DESTINATION_OPTIONS = [
    { value: 'usa', label: t('onboarding.info.destinationUsa', 'USA') },
    { value: 'uk', label: t('onboarding.info.destinationUk', 'UK') },
    { value: 'canada', label: t('onboarding.info.destinationCanada', 'Canada') },
    { value: 'europe', label: t('onboarding.info.destinationEurope', 'Europe') },
    { value: 'asia', label: t('onboarding.info.destinationAsia', 'Asia') },
    { value: 'australia', label: t('onboarding.info.destinationAustralia', 'Australia') },
    { value: 'not-sure', label: t('onboarding.info.destinationNotSure', 'Not sure yet') },
  ];

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

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-target-degree">{t('onboarding.info.targetDegree', 'What degree are you applying for?')}</label>
          <Select id="onboarding-target-degree" size="large" value={targetDegree} onChange={(v) => { setTargetDegree(v); clearError('targetDegree'); }} status={errors.targetDegree ? 'error' : undefined} options={[
            { value: 'bachelor', label: t('onboarding.info.targetDegreeBachelor', "Bachelor’s degree") },
            { value: 'master', label: t('onboarding.info.targetDegreeMaster', "Master’s degree") },
          ]} />
          {errors.targetDegree && <div className={styles.errorMsg}>{errors.targetDegree}</div>}
        </div>
      </div>

      {targetDegree !== 'master' && (
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-grade-level">
            {t('onboarding.info.gradeLevel', 'Grade level')}
          </label>
          <Select
            id="onboarding-grade-level"
            size="large"
            allowClear
            value={gradeLevel}
            onChange={(v) => { setGradeLevel(v); clearError('gradeLevel'); }}
            placeholder={t('onboarding.info.gradeLevelPlaceholder', 'Select your grade level')}
            options={GRADE_LEVEL_OPTIONS}
            status={errors.gradeLevel ? 'error' : undefined}
          />
          {errors.gradeLevel && <div className={styles.errorMsg}>{errors.gradeLevel}</div>}
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-school">
            {t('onboarding.info.school', 'Your school')}
          </label>
          <Input
            id="onboarding-school"
            size="large"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder={t('onboarding.info.schoolPlaceholder', 'Your school name')}
            maxLength={160}
          />
        </div>
      </div>
      )}

      {targetDegree === 'master' && (
        <>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel} htmlFor="onboarding-education-status">{t('onboarding.info.educationStatus', 'Bachelor’s status')}</label><Select id="onboarding-education-status" size="large" value={educationStatus} onChange={(v) => { setEducationStatus(v); clearError('educationStatus'); }} options={[{value:'studying',label:t('onboarding.info.educationStatusStudying','Currently studying')},{value:'graduated',label:t('onboarding.info.educationStatusGraduated','Graduated')}]} status={errors.educationStatus ? 'error' : undefined}/>{errors.educationStatus && <div className={styles.errorMsg}>{errors.educationStatus}</div>}</div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="onboarding-previous-institution">{t('onboarding.info.previousInstitution', 'University')}</label>
              <AutoComplete id="onboarding-previous-institution" size="large" style={{ width: '100%' }}
                value={previousInstitution} options={sortedUniversityOptions} filterOption={filterEducationOption}
                placeholder={educationSearchPlaceholder} allowClear
                onChange={(value) => { setPreviousInstitution(value); clearError('previousInstitution'); }}
                status={errors.previousInstitution ? 'error' : undefined} />
              {errors.previousInstitution && <div className={styles.errorMsg}>{errors.previousInstitution}</div>}
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel} htmlFor="onboarding-previous-degree">{t('onboarding.info.previousDegree', 'Bachelor’s degree')}</label><Input id="onboarding-previous-degree" size="large" value={previousDegree} placeholder="e.g. BSc" onChange={(e)=>{setPreviousDegree(e.target.value);clearError('previousDegree');}} status={errors.previousDegree ? 'error' : undefined}/>{errors.previousDegree && <div className={styles.errorMsg}>{errors.previousDegree}</div>}</div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="onboarding-previous-field">{t('onboarding.info.previousField', 'Field of study')}</label>
              <AutoComplete id="onboarding-previous-field" size="large" style={{ width: '100%' }}
                value={previousField} options={fieldOptions} filterOption={filterEducationOption}
                placeholder={educationSearchPlaceholder} allowClear
                onChange={(value) => { setPreviousField(value); clearError('previousField'); }}
                status={errors.previousField ? 'error' : undefined} />
              {errors.previousField && <div className={styles.errorMsg}>{errors.previousField}</div>}
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel} htmlFor="onboarding-bachelor-year">{t('onboarding.info.bachelorGraduationYear', 'Bachelor’s graduation year')}</label><Input id="onboarding-bachelor-year" size="large" type="number" min={1900} max={2100} value={bachelorGraduationYear} onChange={(e)=>{setBachelorGraduationYear(e.target.value);clearError('bachelorGraduationYear');}} status={errors.bachelorGraduationYear ? 'error' : undefined}/>{errors.bachelorGraduationYear && <div className={styles.errorMsg}>{errors.bachelorGraduationYear}</div>}</div>
          </div>
        </>
      )}

      <div className={styles.fieldRow}>
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
          <label className={styles.fieldLabel} htmlFor="onboarding-destination">
            {t('onboarding.info.destination', 'Where do you want to study?')}
          </label>
          <Select
            id="onboarding-destination"
            size="large"
            mode="multiple"
            allowClear
            value={destinations}
            onChange={handleDestinationChange}
            placeholder={t('onboarding.info.destinationPlaceholder', 'Select destinations')}
            options={DESTINATION_OPTIONS}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="onboarding-language">
            {t('onboarding.info.language', 'Preferred language')}
          </label>
          <Select
            id="onboarding-language"
            size="large"
            value={language}
            onChange={handleLanguageChange}
            placeholder={t('onboarding.info.languagePlaceholder', 'Select language')}
            options={LANGUAGE_OPTIONS}
          />
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
      </div>

      <CustomButton type="primary" width="100%" onClick={handleContinue} loading={submitting}>
        {t('btn.continue')}
      </CustomButton>
    </div>
  );
}
