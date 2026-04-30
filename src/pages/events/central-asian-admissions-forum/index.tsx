import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Radio,
  Select,
  Spin,
  message,
} from 'antd';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetCaafForumRegistrationConfigQuery } from 'src/app/services/caafForumApi';
import {
  CATEGORY_OPTIONS,
  CAAF_FORUM_CARD_IMAGE,
  DESTINATION_OPTIONS,
  FORUM_VALUE_ICONS,
  PARTICIPATING_COUNTRY_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  formatCaafRegistrationFeeUsd,
  isPastCaafRegistrationDeadline,
  REGISTRATION_FEE_USD_FALLBACK,
} from './constants';
import type { CaafDestinationId, CaafDraft, CaafParticipatingCountry } from './types';
import { useCaafRegistration } from './useCaafRegistration';
import { validateCaafStep } from './validation';
import CaafApplicationStepper from './components/CaafApplicationStepper';
import styles from './CentralAsianAdmissionsForum.module.scss';

const { TextArea } = Input;

function categoryLabel(t: (key: string) => string, id: string): string {
  return t(`caafForum.cat.${id}`);
}

function destinationLabels(t: (key: string) => string, ids: CaafDestinationId[]): string {
  return ids.map((id) => t(`caafForum.dest.${id}`)).join(', ');
}

function primaryGoalLabel(t: (key: string) => string, id: string): string {
  return t(`caafForum.goal.${id}`);
}

function participatingCountryLabel(
  t: (key: string) => string,
  id: CaafParticipatingCountry,
): string {
  if (!id) return '—';
  return t(`caafForum.participatingCountry.${id}`);
}

const FORUM_PATH = '/events/central-asian-admissions-forum';

export default function CentralAsianAdmissionsForumPage() {
  const { t } = useTranslation();
  const { data: regConfig } = useGetCaafForumRegistrationConfigQuery();
  const feeUsd = regConfig?.registrationFeeUsd ?? REGISTRATION_FEE_USD_FALLBACK;
  const feeLabel = formatCaafRegistrationFeeUsd(feeUsd);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    document.title = t('caafForum.documentTitle');
    return () => {
      document.title = 'Top Coach';
    };
  }, [t]);

  const {
    draft,
    updateDraft,
    formStep,
    setFormStep,
    stepLabels,
    stepCount,
    phase,
    goForm,
    goReview,
    saveDraft,
    submitApplicationPendingPayment,
    resumeFromSubmission,
    activeSubmissionId,
    setPhase,
    serverApplication,
    refetchMe,
    submitting,
    meLoading,
  } = useCaafRegistration();

  const caafPaymentSearch = (applicationId: string) =>
    `type=caaf&caafApplicationId=${encodeURIComponent(applicationId)}&amount=${encodeURIComponent(String(feeUsd))}`;

  useEffect(() => {
    if (searchParams.get('caaf_payment') !== 'success') return;
    let cancelled = false;
    void (async () => {
      await refetchMe();
      if (cancelled) return;
      message.success(t('caafForum.success.paymentReceived'));
      const next = new URLSearchParams(searchParams);
      next.delete('caaf_payment');
      setSearchParams(next, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, refetchMe, t]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (phase === 'form' || phase === 'review') {
      try {
        window.localStorage.setItem('redirectAfterLogin', FORUM_PATH);
      } catch {
        /* ignore */
      }
      navigate('/auth/signin', { replace: true });
    }
  }, [isAuthenticated, phase, navigate]);

  const signInToRegister = () => {
    try {
      window.localStorage.setItem('redirectAfterLogin', FORUM_PATH);
    } catch {
      /* ignore */
    }
    navigate('/auth/signin');
  };

  const onNext = () => {
    const errKey = validateCaafStep(formStep, draft);
    if (errKey) {
      message.warning({ content: t(errKey), key: 'caaf-validation' });
      return;
    }
    saveDraft();
    if (formStep < stepCount - 1) setFormStep(formStep + 1);
    else goReview();
  };

  const onPrev = () => {
    if (formStep > 0) setFormStep(formStep - 1);
  };

  const onSaveProgress = () => {
    saveDraft();
    message.success(t('caafForum.toast.progressSaved'));
  };

  const onSubmitToPayment = async () => {
    if (serverApplication?.status === 'pending_payment' && activeSubmissionId) {
      navigate(`/payment?${caafPaymentSearch(activeSubmissionId)}`);
      return;
    }
    const applicationId = await submitApplicationPendingPayment();
    if (!applicationId) {
      message.error(t('caafForum.toast.submitFailed'));
      return;
    }
    navigate(`/payment?${caafPaymentSearch(applicationId)}`);
  };

  if (!isAuthenticated && (phase === 'form' || phase === 'review')) {
    return null;
  }

  if (serverApplication?.status === 'pending_payment' && activeSubmissionId) {
    navigate(`/payment?${caafPaymentSearch(activeSubmissionId)}`, { replace: true });
    return null;
  }

  if (isPastCaafRegistrationDeadline()) {
    const exempt =
      phase === 'submitted' ||
      serverApplication?.status === 'paid' ||
      serverApplication?.status === 'pending_payment';
    if (!exempt) {
      return (
        <main className={styles.page}>
          <Alert
            type="warning"
            showIcon
            message={t('caafForum.registrationClosed.title')}
            description={t('caafForum.registrationClosed.body')}
          />
          <Button type="primary" size="large" style={{ marginTop: 24 }} onClick={() => navigate('/events')}>
            {t('caafForum.btn.backToEvents')}
          </Button>
        </main>
      );
    }
  }

  if (phase === 'submitted') {
    if (meLoading) {
      return (
        <main className={styles.page} style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </main>
      );
    }
    const sub = serverApplication;
    if (!sub || sub.status !== 'paid') {
      return (
        <main className={styles.page}>
          <Alert type="error" showIcon message={t('caafForum.alert.verifyFailed')} />
          <Button size="large" style={{ marginTop: 16 }} onClick={() => (window.location.href = '/events')}>
            {t('caafForum.btn.backToEvents')}
          </Button>
        </main>
      );
    }
    return (
      <main className={styles.page}>
        <div className={styles.successCard}>
          <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: 16 }} aria-hidden />
          <h1 className={styles.successTitle}>{t('caafForum.success.registeredTitle')}</h1>
          <p className={styles.successBody}>
            <Trans
              i18nKey="caafForum.success.registeredBody"
              values={{ email: sub.draft.email }}
              components={{ 1: <strong /> }}
            />
          </p>
          <Button type="primary" size="large" style={{ marginTop: 24 }} onClick={() => (window.location.href = '/events')}>
            {t('caafForum.btn.backToEvents')}
          </Button>
        </div>
      </main>
    );
  }

  if (phase === 'review') {
    return (
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>{t('caafForum.review.title')}</h1>
        <p className={styles.subtitle}>{t('caafForum.subtitle.review')}</p>

        <div className={styles.reviewSection}>
          <ReviewRows draft={draft} />
        </div>

        <div className={styles.footerActions}>
          <Button size="large" onClick={() => setPhase('form')}>
            {t('caafForum.btn.backToEdit')}
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRight size={18} />}
            loading={submitting}
            onClick={() => void onSubmitToPayment()}
          >
            {t('caafForum.btn.continueToPayment')}
          </Button>
        </div>
      </main>
    );
  }

  if (phase === 'form') {
    return (
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>{t('caafForum.pageTitle')}</h1>
        <p className={styles.subtitle}>{t('caafForum.subtitle.form')}</p>

        <div className={styles.stepperWrap}>
          <CaafApplicationStepper current={formStep} titles={stepLabels} />
        </div>

        {formStep === 0 && <StepAboutYou draft={draft} updateDraft={updateDraft} />}
        {formStep === 1 && <StepAcademic draft={draft} updateDraft={updateDraft} />}
        {formStep === 2 && <StepForumGoals draft={draft} updateDraft={updateDraft} />}
        {formStep === 3 && <StepConsentConsultation draft={draft} updateDraft={updateDraft} />}

        <div className={styles.footerActions}>
          <Button size="large" disabled={formStep === 0} onClick={onPrev}>
            {t('caafForum.btn.previous')}
          </Button>
          <Button size="large" onClick={onSaveProgress}>
            {t('caafForum.btn.saveProgress')}
          </Button>
          <Button type="primary" size="large" className={styles.btnPrimary} onClick={onNext}>
            {formStep === stepCount - 1 ? t('caafForum.btn.review') : t('caafForum.btn.next')}
          </Button>
        </div>
      </main>
    );
  }

  /* landing */
  const introIndices = [0, 1, 2, 3] as const;
  const valueIndices = [0, 1, 2, 3, 4] as const;

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>{t('caafForum.pageTitle')}</h1>

      <img
        className={styles.landingHero}
        src={CAAF_FORUM_CARD_IMAGE}
        alt={t('caafForum.hero.alt')}
        width={800}
        height={400}
        loading="eager"
      />

      <div className={styles.introBlock}>
        {introIndices.map((i) => (
          <p key={i} className={styles.introParagraph}>
            {t(`caafForum.intro.${i}`)}
          </p>
        ))}
        <ul className={styles.valueList}>
          {valueIndices.map((i) => (
            <li key={i} className={styles.valueItem}>
              <span className={styles.valueIcon} aria-hidden>
                {FORUM_VALUE_ICONS[i]}
              </span>
              <div className={styles.valueText}>
                <div className={styles.valueTitle}>{t(`caafForum.value.${i}.title`)}</div>
                {t(`caafForum.value.${i}.body`)}
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.feeBlock}>
          <strong>{t('caafForum.registrationDetailsHeading')}</strong>
          <div style={{ marginTop: 8 }}>{t('caafForum.registrationFeeNote', { fee: feeLabel })}</div>
          <div className={styles.spotsNote}>{t('caafForum.spotsNote')}</div>
        </div>
      </div>

      {!isAuthenticated ? (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 20 }}
            message={t('caafForum.alert.signIn.title')}
            description={t('caafForum.alert.signIn.description')}
          />
          <div className={styles.landingActions}>
            <Button type="primary" size="large" icon={<ArrowRight size={18} />} onClick={signInToRegister}>
              {t('caafForum.btn.signInToRegister')}
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.landingActions}>
          <Button type="primary" size="large" icon={<ArrowRight size={18} />} onClick={goForm}>
            {t('caafForum.btn.register')}
          </Button>
        </div>
      )}
    </main>
  );
}

function ReviewRows({ draft }: { draft: CaafDraft }) {
  const { t } = useTranslation();
  const rows: { k: string; v: React.ReactNode }[] = [
    { k: t('caafForum.review.fullName'), v: draft.fullName },
    { k: t('caafForum.review.email'), v: draft.email },
    { k: t('caafForum.review.phone'), v: draft.phone },
    { k: t('caafForum.review.countryCity'), v: draft.countryCity },
    {
      k: t('caafForum.review.participatingCountry'),
      v: participatingCountryLabel(t, draft.participatingCountry),
    },
    {
      k: t('caafForum.review.category'),
      v:
        draft.categoryId === 'other'
          ? `${t('caafForum.review.otherPrefix')}: ${draft.categoryOther}`
          : categoryLabel(t, draft.categoryId),
    },
    { k: t('caafForum.review.grade'), v: draft.gradeOrYear },
    {
      k: t('caafForum.review.destinations'),
      v: (
        <>
          {destinationLabels(t, draft.destinationIds)}
          {draft.destinationIds.includes('other') && draft.destinationOther
            ? ` — ${t('caafForum.review.otherPrefix')}: ${draft.destinationOther}`
            : ''}
        </>
      ),
    },
    { k: t('caafForum.review.fieldOfStudy'), v: draft.intendedFieldOfStudy },
    { k: t('caafForum.review.hearAbout'), v: draft.hearAbout },
    { k: t('caafForum.review.primaryGoal'), v: draft.primaryGoal ? primaryGoalLabel(t, draft.primaryGoal) : '—' },
    { k: t('caafForum.review.speakerQuestion'), v: draft.speakerQuestion },
    {
      k: t('caafForum.review.consultation'),
      v:
        draft.wantsConsultation === 'yes'
          ? t('caafForum.consultation.yes')
          : draft.wantsConsultation === 'no'
            ? t('caafForum.consultation.no')
            : '—',
    },
  ];
  return (
    <>
      {rows.map((r) => (
        <div key={r.k} className={styles.reviewRow}>
          <div className={styles.reviewKey}>{r.k}</div>
          <div className={styles.reviewVal}>{r.v}</div>
        </div>
      ))}
    </>
  );
}

function StepAboutYou({
  draft,
  updateDraft,
}: {
  draft: CaafDraft;
  updateDraft: (p: Partial<CaafDraft>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.fullName')}</label>
        <Input
          size="large"
          value={draft.fullName}
          onChange={(e) => updateDraft({ fullName: e.target.value })}
          placeholder={t('caafForum.form.about.fullNamePh')}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.email')}</label>
        <Input
          size="large"
          type="email"
          value={draft.email}
          onChange={(e) => updateDraft({ email: e.target.value })}
          placeholder={t('caafForum.form.about.emailPh')}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.phone')}</label>
        <Input
          size="large"
          value={draft.phone}
          onChange={(e) => updateDraft({ phone: e.target.value })}
          placeholder={t('caafForum.form.about.phonePh')}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.countryCity')}</label>
        <Input
          size="large"
          value={draft.countryCity}
          onChange={(e) => updateDraft({ countryCity: e.target.value })}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.participatingCountry')}</label>
        <Radio.Group
          className={styles.radioStack}
          value={draft.participatingCountry || undefined}
          onChange={(e) => updateDraft({ participatingCountry: e.target.value })}
        >
          {PARTICIPATING_COUNTRY_OPTIONS.map((country) => (
            <Radio key={country.id} value={country.id}>
              {t(`caafForum.participatingCountry.${country.id}`)}
            </Radio>
          ))}
        </Radio.Group>
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.about.category')}</label>
        <Radio.Group
          className={styles.radioStack}
          value={draft.categoryId || undefined}
          onChange={(e) => updateDraft({ categoryId: e.target.value })}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <Radio key={o.id} value={o.id}>
              {t(`caafForum.cat.${o.id}`)}
            </Radio>
          ))}
        </Radio.Group>
        {draft.categoryId === 'other' && (
          <Input
            style={{ marginTop: 12 }}
            placeholder={t('caafForum.form.about.categoryOtherPh')}
            value={draft.categoryOther}
            onChange={(e) => updateDraft({ categoryOther: e.target.value })}
          />
        )}
      </div>
    </>
  );
}

function StepAcademic({
  draft,
  updateDraft,
}: {
  draft: CaafDraft;
  updateDraft: (p: Partial<CaafDraft>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.academic.grade')}</label>
        <Input
          size="large"
          value={draft.gradeOrYear}
          onChange={(e) => updateDraft({ gradeOrYear: e.target.value })}
          placeholder={t('caafForum.form.academic.gradePh')}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.academic.destinations')}</label>
        <Select
          mode="multiple"
          size="large"
          style={{ width: '100%' }}
          placeholder={t('caafForum.form.academic.destinationsPh')}
          value={draft.destinationIds}
          options={DESTINATION_OPTIONS.map((o) => ({ label: t(`caafForum.dest.${o.id}`), value: o.id }))}
          onChange={(v) => updateDraft({ destinationIds: v as CaafDestinationId[] })}
        />
        {draft.destinationIds.includes('other') && (
          <Input
            style={{ marginTop: 12 }}
            placeholder={t('caafForum.form.academic.destinationOtherPh')}
            value={draft.destinationOther}
            onChange={(e) => updateDraft({ destinationOther: e.target.value })}
          />
        )}
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.academic.field')}</label>
        <Input
          size="large"
          value={draft.intendedFieldOfStudy}
          onChange={(e) => updateDraft({ intendedFieldOfStudy: e.target.value })}
          placeholder={t('caafForum.form.academic.fieldPh')}
        />
      </div>
    </>
  );
}

function StepForumGoals({
  draft,
  updateDraft,
}: {
  draft: CaafDraft;
  updateDraft: (p: Partial<CaafDraft>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.goals.hearAbout')}</label>
        <TextArea
          rows={3}
          value={draft.hearAbout}
          onChange={(e) => updateDraft({ hearAbout: e.target.value })}
          placeholder={t('caafForum.form.goals.hearAboutPh')}
        />
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.goals.primaryGoal')}</label>
        <Radio.Group
          className={styles.radioStack}
          value={draft.primaryGoal || undefined}
          onChange={(e) => updateDraft({ primaryGoal: e.target.value })}
        >
          {PRIMARY_GOAL_OPTIONS.map((o) => (
            <Radio key={o.id} value={o.id}>
              {t(`caafForum.goal.${o.id}`)}
            </Radio>
          ))}
        </Radio.Group>
      </div>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.goals.speakerQuestion')}</label>
        <TextArea
          rows={4}
          value={draft.speakerQuestion}
          onChange={(e) => updateDraft({ speakerQuestion: e.target.value })}
        />
      </div>
    </>
  );
}

function StepConsentConsultation({
  draft,
  updateDraft,
}: {
  draft: CaafDraft;
  updateDraft: (p: Partial<CaafDraft>) => void;
}) {
  const { t } = useTranslation();
  const consentBullets = [
    t('caafForum.consent.bullet1'),
    t('caafForum.consent.bullet2'),
    t('caafForum.consent.bullet3'),
    t('caafForum.consent.bullet4'),
  ];
  return (
    <>
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>{t('caafForum.form.consent.consultation')}</label>
        <Radio.Group
          value={draft.wantsConsultation || undefined}
          onChange={(e) => updateDraft({ wantsConsultation: e.target.value })}
        >
          <Radio value="yes">{t('caafForum.consultation.yes')}</Radio>
          <Radio value="no">{t('caafForum.consultation.no')}</Radio>
        </Radio.Group>
      </div>

      <div className={styles.formSection}>
        <div className={styles.consentBox}>
          <p className={styles.consentTitle}>{t('caafForum.consent.boxTitle')}</p>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>{t('caafForum.consent.title')}</p>
          <ul className={styles.consentList}>
            {consentBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Checkbox checked={draft.consentAccepted} onChange={(e) => updateDraft({ consentAccepted: e.target.checked })}>
            {t('caafForum.consent.checkboxLabel')}
          </Checkbox>
        </div>
      </div>
    </>
  );
}
