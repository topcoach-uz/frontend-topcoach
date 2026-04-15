import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  createEmptyDraft,
  mergeDraftFromStorage,
  STORAGE_KEY,
  type YouthLeadersDraft,
} from './types';
import { appendSubmission, type YouthLeadersSubmitFileRefs } from './submissionsStorage';
import {
  clearYouthLeadersSessionMeta,
  getLastSubmissionId,
  getPersistedFormStep,
  getPersistedPhase,
  setLastSubmissionId,
  setPersistedFormStep,
  setPersistedPhase,
} from './youthLeadersSessionStorage';
import { loadSubmissions } from './submissionsStorage';

type Phase = 'form' | 'review' | 'submitted';

function loadDraftFromStorage(): YouthLeadersDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeDraftFromStorage(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return createEmptyDraft();
}

function computeInitialState(): { draft: YouthLeadersDraft; formStep: number; phase: Phase } {
  const draft = loadDraftFromStorage();
  const persistedPhase = getPersistedPhase();
  const lastId = getLastSubmissionId();

  if (persistedPhase === 'submitted' && lastId) {
    const sub = loadSubmissions().find((s) => s.id === lastId);
    if (sub) {
      return { draft, formStep: 4, phase: 'submitted' };
    }
    clearYouthLeadersSessionMeta();
  }

  if (persistedPhase === 'review') {
    return { draft, formStep: 4, phase: 'review' };
  }

  return { draft, formStep: getPersistedFormStep(), phase: 'form' };
}

export function useYouthLeadersDraft() {
  const initial = useMemo(() => computeInitialState(), []);

  const [draft, setDraft] = useState<YouthLeadersDraft>(initial.draft);
  const [formStep, setFormStep] = useState(initial.formStep);
  const [phase, setPhase] = useState<Phase>(initial.phase);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  useEffect(() => {
    setPersistedPhase(phase);
  }, [phase]);

  useEffect(() => {
    setPersistedFormStep(formStep);
  }, [formStep]);

  const updateDraft = useCallback((patch: Partial<YouthLeadersDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const setPersonal = useCallback((personal: YouthLeadersDraft['personal']) => {
    setDraft((prev) => ({ ...prev, personal }));
  }, []);

  const setIdInfo = useCallback((idInfo: YouthLeadersDraft['idInfo']) => {
    setDraft((prev) => ({ ...prev, idInfo }));
  }, []);

  const setContact = useCallback((contact: YouthLeadersDraft['contact']) => {
    setDraft((prev) => ({ ...prev, contact }));
  }, []);

  const setArrival = useCallback((arrival: YouthLeadersDraft['arrival']) => {
    setDraft((prev) => ({ ...prev, arrival }));
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const goReview = useCallback(() => {
    setPhase('review');
  }, []);

  const goForm = useCallback(() => {
    setPhase('form');
  }, []);

  const submitApplication = useCallback(
    async (files?: YouthLeadersSubmitFileRefs) => {
      saveDraft();
      try {
        const row = await appendSubmission(draft, files);
        setLastSubmissionId(row.id);
        setPhase('submitted');
      } catch {
        message.error(
          'Could not save your submission. Files may be too large for browser storage, or storage is full. Try smaller files or contact support.',
        );
      }
    },
    [saveDraft, draft],
  );

  const resetAll = useCallback(() => {
    const empty = createEmptyDraft();
    setDraft(empty);
    setFormStep(0);
    setPhase('form');
    clearYouthLeadersSessionMeta();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return useMemo(
    () => ({
      draft,
      formStep,
      setFormStep,
      phase,
      updateDraft,
      setPersonal,
      setIdInfo,
      setContact,
      setArrival,
      saveDraft,
      goReview,
      goForm,
      submitApplication,
      resetAll,
    }),
    [
      draft,
      formStep,
      phase,
      updateDraft,
      setPersonal,
      setIdInfo,
      setContact,
      setArrival,
      saveDraft,
      goReview,
      goForm,
      submitApplication,
      resetAll,
    ],
  );
}
