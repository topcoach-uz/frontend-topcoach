import React, { useEffect, useRef } from 'react';
import { Button, message } from 'antd';
import type { YouthLeadersSubmitFileRefs } from './submissionsStorage';
import ApplicationStepper from './components/ApplicationStepper';
import PersonalStep from './steps/PersonalStep';
import IdStep from './steps/IdStep';
import ThematicStep from './steps/ThematicStep';
import ContactStep from './steps/ContactStep';
import ArrivalStep from './steps/ArrivalStep';
import ReviewStep from './ReviewStep';
import SubmittedView from './SubmittedView';
import { useYouthLeadersDraft } from './useYouthLeadersDraft';
import { validateFormStep } from './validation';
import { getLastSubmissionId } from './youthLeadersSessionStorage';
import { loadSubmissions } from './submissionsStorage';
import styles from './YouthLeadersApplication.module.scss';

export default function YouthLeadersApplicationPage() {
  useEffect(() => {
    document.title = 'Youth Leaders Application · Top Coach';
    return () => {
      document.title = 'Top Coach';
    };
  }, []);

  const {
    draft,
    formStep,
    setFormStep,
    phase,
    setPersonal,
    setIdInfo,
    setContact,
    setArrival,
    updateDraft,
    saveDraft,
    goReview,
    goForm,
    submitApplication,
  } = useYouthLeadersDraft();

  const idPhotoFileRef = useRef<File | null>(null);
  const portraitPhotoFileRef = useRef<File | null>(null);
  const passportScanFileRef = useRef<File | null>(null);
  const resumeFileRef = useRef<File | null>(null);

  const submitWithFiles = () => {
    const files: YouthLeadersSubmitFileRefs = {
      idPhoto: idPhotoFileRef.current,
      portrait: portraitPhotoFileRef.current,
      passport: passportScanFileRef.current,
      resume: resumeFileRef.current,
    };
    void submitApplication(files);
  };

  const onNext = () => {
    const err = validateFormStep(formStep, draft);
    if (err) {
      message.warning({ content: err, key: 'youth-leaders-step-validation' });
      return;
    }
    if (formStep < 4) setFormStep(formStep + 1);
    else goReview();
  };

  const onPrev = () => {
    if (formStep > 0) setFormStep(formStep - 1);
  };

  const onSave = () => {
    saveDraft();
    message.success('Draft saved.');
  };

  if (phase === 'submitted') {
    const lastId = getLastSubmissionId();
    const submission = lastId ? loadSubmissions().find((s) => s.id === lastId) : undefined;
    return (
      <main className={styles.page}>
        <SubmittedView submission={submission} />
      </main>
    );
  }

  if (phase === 'review') {
    return (
      <main className={styles.page}>
        <ReviewStep
          draft={draft}
          onBack={() => goForm()}
          onSubmit={submitWithFiles}
          idPhotoFileRef={idPhotoFileRef}
          portraitPhotoFileRef={portraitPhotoFileRef}
          passportScanFileRef={passportScanFileRef}
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>My registration information</h1>

      <ApplicationStepper current={formStep} />

      {formStep === 0 && (
        <PersonalStep
          value={draft.personal}
          onChange={setPersonal}
          idPhotoFileRef={idPhotoFileRef}
          portraitPhotoFileRef={portraitPhotoFileRef}
        />
      )}
      {formStep === 1 && (
        <IdStep value={draft.idInfo} onChange={setIdInfo} passportScanFileRef={passportScanFileRef} />
      )}
      {formStep === 2 && (
        <ThematicStep value={draft.thematicClusterId} onChange={(v) => updateDraft({ thematicClusterId: v })} />
      )}
      {formStep === 3 && (
        <ContactStep value={draft.contact} onChange={setContact} resumeFileRef={resumeFileRef} />
      )}
      {formStep === 4 && <ArrivalStep value={draft.arrival} onChange={setArrival} />}

      <div className={styles.footerActions}>
        <Button className={styles.btnOutline} size="large" disabled={formStep === 0} onClick={onPrev}>
          Previous page
        </Button>
        <Button className={styles.btnOutline} size="large" onClick={onSave}>
          Save
        </Button>
        <Button type="primary" className={styles.btnPrimary} size="large" onClick={onNext}>
          {formStep === 4 ? 'Review' : 'Next page'}
        </Button>
      </div>
    </main>
  );
}
