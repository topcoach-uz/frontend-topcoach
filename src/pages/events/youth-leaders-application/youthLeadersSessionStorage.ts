/** Client-only session flags for the Youth Leaders flow (until backend exists). */

export const YL_PHASE_KEY = 'topcoach_youth_leaders_phase';
export const YL_FORM_STEP_KEY = 'topcoach_youth_leaders_form_step';
export const YL_LAST_SUBMISSION_ID_KEY = 'topcoach_youth_leaders_last_submission_id';

export type YlPersistedPhase = 'form' | 'review' | 'submitted';

export function getLastSubmissionId(): string | null {
  try {
    return localStorage.getItem(YL_LAST_SUBMISSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setLastSubmissionId(id: string): void {
  try {
    localStorage.setItem(YL_LAST_SUBMISSION_ID_KEY, id);
    window.dispatchEvent(new CustomEvent('topcoach-youth-leaders-session-updated'));
  } catch {
    /* ignore */
  }
}

export function getPersistedPhase(): YlPersistedPhase {
  try {
    const p = localStorage.getItem(YL_PHASE_KEY);
    if (p === 'form' || p === 'review' || p === 'submitted') return p;
  } catch {
    /* ignore */
  }
  return 'form';
}

export function setPersistedPhase(p: YlPersistedPhase): void {
  try {
    localStorage.setItem(YL_PHASE_KEY, p);
    window.dispatchEvent(new CustomEvent('topcoach-youth-leaders-session-updated'));
  } catch {
    /* ignore */
  }
}

export function getPersistedFormStep(): number {
  try {
    const s = localStorage.getItem(YL_FORM_STEP_KEY);
    const n = parseInt(s ?? '0', 10);
    if (Number.isFinite(n) && n >= 0 && n <= 4) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

export function setPersistedFormStep(step: number): void {
  try {
    localStorage.setItem(YL_FORM_STEP_KEY, String(step));
    window.dispatchEvent(new CustomEvent('topcoach-youth-leaders-session-updated'));
  } catch {
    /* ignore */
  }
}

export function clearYouthLeadersSessionMeta(): void {
  try {
    localStorage.removeItem(YL_PHASE_KEY);
    localStorage.removeItem(YL_FORM_STEP_KEY);
    localStorage.removeItem(YL_LAST_SUBMISSION_ID_KEY);
    window.dispatchEvent(new CustomEvent('topcoach-youth-leaders-session-updated'));
  } catch {
    /* ignore */
  }
}
