import { CAAF_LANDING_CONSENT_KEY, CAAF_TERMS_GATE_KEY } from './types';

export function readLandingConsentFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.localStorage.getItem(CAAF_LANDING_CONSENT_KEY) === '1') return true;
  if (window.localStorage.getItem(CAAF_TERMS_GATE_KEY) === '1') {
    try {
      window.localStorage.setItem(CAAF_LANDING_CONSENT_KEY, '1');
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function writeLandingConsentToStorage(): void {
  window.localStorage.setItem(CAAF_LANDING_CONSENT_KEY, '1');
  window.dispatchEvent(new CustomEvent('topcoach-caaf-landing-consent-updated'));
}
