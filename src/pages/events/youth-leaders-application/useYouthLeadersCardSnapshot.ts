import { useSyncExternalStore } from 'react';
import {
  createEmptyDraft,
  isDraftMeaningful,
  mergeDraftFromStorage,
  STEP_TITLES,
  STORAGE_KEY,
  type YouthLeadersDraft,
} from './types';
import {
  getLastSubmissionId,
  getPersistedFormStep,
  getPersistedPhase,
  YL_FORM_STEP_KEY,
  YL_LAST_SUBMISSION_ID_KEY,
  YL_PHASE_KEY,
} from './youthLeadersSessionStorage';
import {
  loadSubmissions,
  SUBMISSIONS_STORAGE_KEY,
  type YouthLeadersSubmission,
} from './submissionsStorage';

export type YouthLeadersCardSnapshot =
  | { kind: 'submitted'; submission: YouthLeadersSubmission }
  | { kind: 'resume'; uiPhase: 'form' | 'review'; formStep: number; stepLabel: string }
  | { kind: 'fresh' };

const SERVER_SNAPSHOT: YouthLeadersCardSnapshot = { kind: 'fresh' };

/** Raw localStorage bundle — when this is unchanged, card state is unchanged. */
function getStorageFingerprint(): string {
  try {
    return [
      localStorage.getItem(STORAGE_KEY) ?? '',
      localStorage.getItem(YL_PHASE_KEY) ?? '',
      localStorage.getItem(YL_FORM_STEP_KEY) ?? '',
      localStorage.getItem(YL_LAST_SUBMISSION_ID_KEY) ?? '',
      localStorage.getItem(SUBMISSIONS_STORAGE_KEY) ?? '',
    ].join('\x1e');
  } catch {
    return '';
  }
}

let cachedFingerprint: string | null = null;
let cachedSnapshot: YouthLeadersCardSnapshot | null = null;

function readDraft(): YouthLeadersDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeDraftFromStorage(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return createEmptyDraft();
}

function computeSnapshot(): YouthLeadersCardSnapshot {
  const lastId = getLastSubmissionId();
  const persistedPhase = getPersistedPhase();

  if (persistedPhase === 'submitted' && lastId) {
    const submission = loadSubmissions().find((s) => s.id === lastId);
    if (submission) {
      return { kind: 'submitted', submission };
    }
  }

  const draft = readDraft();
  const formStep = getPersistedFormStep();

  if (persistedPhase === 'review') {
    return {
      kind: 'resume',
      uiPhase: 'review',
      formStep: Math.min(formStep, 4),
      stepLabel: 'Final review before submit',
    };
  }

  if (persistedPhase === 'form' && isDraftMeaningful(draft)) {
    const safeStep = Math.min(Math.max(formStep, 0), 4);
    return {
      kind: 'resume',
      uiPhase: 'form',
      formStep: safeStep,
      stepLabel: STEP_TITLES[safeStep] ?? STEP_TITLES[0],
    };
  }

  return { kind: 'fresh' };
}

/**
 * useSyncExternalStore requires a stable snapshot reference when underlying data is unchanged.
 * We key off a fingerprint of all relevant localStorage keys.
 */
function getSnapshot(): YouthLeadersCardSnapshot {
  const fp = getStorageFingerprint();
  if (fp === cachedFingerprint && cachedSnapshot !== null) {
    return cachedSnapshot;
  }
  cachedFingerprint = fp;
  cachedSnapshot = computeSnapshot();
  return cachedSnapshot;
}

function getServerSnapshot(): YouthLeadersCardSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(onStoreChange: () => void): () => void {
  const invalidate = () => {
    cachedFingerprint = null;
    onStoreChange();
  };

  const onStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY ||
      e.key === YL_PHASE_KEY ||
      e.key === YL_FORM_STEP_KEY ||
      e.key === YL_LAST_SUBMISSION_ID_KEY ||
      e.key === SUBMISSIONS_STORAGE_KEY
    ) {
      invalidate();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('topcoach-youth-leaders-session-updated', invalidate);
  window.addEventListener('topcoach-youth-leaders-submissions-updated', invalidate);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('topcoach-youth-leaders-session-updated', invalidate);
    window.removeEventListener('topcoach-youth-leaders-submissions-updated', invalidate);
  };
}

export function useYouthLeadersCardSnapshot(): YouthLeadersCardSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
