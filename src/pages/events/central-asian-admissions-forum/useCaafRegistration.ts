import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import {
  useGetCaafForumApplicationsMeQuery,
  useSubmitCaafForumApplicationMutation,
} from 'src/app/services/caafForumApi';
import {
  CAAF_DRAFT_STORAGE_KEY,
  CAAF_FORM_STEP_KEY,
  createEmptyCaafDraft,
  mergeCaafDraft,
  type CaafDraft,
} from './types';
import { draftHasMeaningfulProgress } from './draftUtils';
import { STEP_COUNT } from './validation';
import type { CaafForumApplicationDto } from 'src/app/services/caafForumApi';

export type CaafUiPhase = 'landing' | 'form' | 'review' | 'submitted';

function readDraft(): CaafDraft {
  if (typeof window === 'undefined') return createEmptyCaafDraft();
  try {
    const raw = window.localStorage.getItem(CAAF_DRAFT_STORAGE_KEY);
    if (!raw) return createEmptyCaafDraft();
    return mergeCaafDraft(JSON.parse(raw) as Partial<CaafDraft>);
  } catch {
    return createEmptyCaafDraft();
  }
}

function writeDraft(d: CaafDraft): boolean {
  try {
    window.localStorage.setItem(CAAF_DRAFT_STORAGE_KEY, JSON.stringify(d));
    window.dispatchEvent(new CustomEvent('topcoach-caaf-draft-updated'));
    return true;
  } catch {
    return false;
  }
}

export function useCaafRegistration() {
  const { t } = useTranslation();
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const {
    data: meData,
    refetch: refetchMe,
    isFetching: meFetching,
    isLoading: meLoading,
  } = useGetCaafForumApplicationsMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [submitApp, { isLoading: submitting }] = useSubmitCaafForumApplicationMutation();

  const [draft, setDraft] = useState<CaafDraft>(createEmptyCaafDraft);
  const [formStep, setFormStep] = useState(0);
  const [phase, setPhase] = useState<CaafUiPhase>('landing');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [serverApplication, setServerApplication] = useState<CaafForumApplicationDto | null>(null);

  useEffect(() => {
    if (phase === 'form') {
      try {
        window.localStorage.setItem(CAAF_FORM_STEP_KEY, String(formStep));
      } catch {
        /* ignore */
      }
    }
  }, [formStep, phase]);

  /** Hydrate from server + local draft when auth / server data changes */
  useEffect(() => {
    if (!isAuthenticated) {
      setDraft(createEmptyCaafDraft());
      setFormStep(0);
      setPhase('landing');
      setActiveSubmissionId(null);
      setServerApplication(null);
      return;
    }

    if (meFetching) return;

    const app = meData?.application ?? null;
    setServerApplication(app);

    if (app?.status === 'pending_payment') {
      setActiveSubmissionId(app.id);
      setDraft(mergeCaafDraft(app.draft as Partial<CaafDraft>));
      setPhase('review');
      return;
    }

    if (app?.status === 'paid') {
      setActiveSubmissionId(app.id);
      setPhase('submitted');
      return;
    }

    const d = readDraft();
    setDraft(d);
    if (draftHasMeaningfulProgress(d)) {
      try {
        const s = window.localStorage.getItem(CAAF_FORM_STEP_KEY);
        if (s !== null) {
          const n = parseInt(s, 10);
          if (!Number.isNaN(n) && n >= 0 && n < STEP_COUNT) {
            setFormStep(n);
            setPhase('form');
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setFormStep(0);
      setPhase('form');
      return;
    }

    setFormStep(0);
    setPhase('landing');
  }, [isAuthenticated, meData, meFetching]);

  const updateDraft = useCallback((patch: Partial<CaafDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const setDraftField = useCallback(<K extends keyof CaafDraft>(key: K, value: CaafDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveDraft = useCallback(() => {
    writeDraft(draft);
  }, [draft]);

  const persistDraftNow = useCallback((d: CaafDraft) => {
    writeDraft(d);
  }, []);

  const goForm = useCallback(() => {
    try {
      const s = window.localStorage.getItem(CAAF_FORM_STEP_KEY);
      if (s !== null) {
        const n = parseInt(s, 10);
        if (!Number.isNaN(n) && n >= 0 && n < STEP_COUNT) {
          setFormStep(n);
          setPhase('form');
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setFormStep(0);
    setPhase('form');
  }, []);

  const goReview = useCallback(() => {
    setPhase('review');
  }, []);

  const submitApplicationPendingPayment = useCallback(async (): Promise<string | null> => {
    try {
      const { application } = await submitApp(draft).unwrap();
      setActiveSubmissionId(application.id);
      setServerApplication(application);
      setPhase('review');
      return application.id;
    } catch {
      return null;
    }
  }, [draft, submitApp]);

  const resumeFromSubmission = useCallback(async (): Promise<string | null> => {
    const r = await refetchMe();
    const app = r.data?.application;
    if (app?.status === 'pending_payment') {
      setActiveSubmissionId(app.id);
      setDraft(mergeCaafDraft(app.draft as Partial<CaafDraft>));
      setServerApplication(app);
      setPhase('review');
      return app.id;
    }
    return null;
  }, [refetchMe]);

  const stepLabels = useMemo(
    () => [
      t('caafForum.step.aboutYou'),
      t('caafForum.step.academic'),
      t('caafForum.step.goals'),
      t('caafForum.step.consent'),
    ],
    [t],
  );

  return {
    draft,
    setDraft,
    updateDraft,
    setDraftField,
    formStep,
    setFormStep,
    stepLabels,
    stepCount: STEP_COUNT,
    phase,
    setPhase,
    activeSubmissionId,
    serverApplication,
    saveDraft,
    persistDraftNow,
    goForm,
    goReview,
    submitApplicationPendingPayment,
    resumeFromSubmission,
    refetchMe,
    submitting,
    meLoading: isAuthenticated && (meLoading || meFetching),
  };
}
