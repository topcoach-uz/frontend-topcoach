import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingWizardPage from './index';

const fixture = vi.hoisted(() => ({ version: undefined as number | undefined, loading: false, junior: false }));
vi.mock('src/app/store', () => ({
  useTypedSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { isAuthenticated: true, profile: { onboardingVersion: fixture.version, profile: { role: 'student' } } },
  }),
}));
vi.mock('src/app/services/student-hub/studentProfileApi', () => ({
  useGetMyStudentProfileQuery: () => ({ data: { academicProfile: {} }, isLoading: fixture.loading }),
}));
vi.mock('src/lib/onboarding', () => ({ usesJuniorCommunity: () => fixture.junior }));
vi.mock('src/components/loader', () => ({ default: () => <div>Loading account</div> }));
vi.mock('react-router-dom', () => ({ Navigate: ({ to }: { to: string }) => <div>{to}</div> }));
vi.mock('src/pages/onboarding-preview/OnboardingPreview', () => ({
  default: ({ mode }: { mode: string }) => <div>New onboarding: {mode}</div>,
}));

afterEach(() => {
  fixture.loading = false;
  fixture.junior = false;
  vi.unstubAllEnvs();
});

describe('published onboarding route', () => {
  it.each([undefined, 1, 2])('uses the new flow for account version %s even with the old flag disabled', (version) => {
    fixture.version = version;
    vi.stubEnv('VITE_ONBOARDING_V2_ENABLED', 'false');
    expect(renderToStaticMarkup(<OnboardingWizardPage />)).toContain('New onboarding: production');
  });
  it('waits for account data', () => {
    fixture.loading = true;
    expect(renderToStaticMarkup(<OnboardingWizardPage />)).toContain('Loading account');
  });
  it('preserves the junior community redirect', () => {
    fixture.junior = true;
    expect(renderToStaticMarkup(<OnboardingWizardPage />)).toContain('/student-hub?section=feed');
  });
});
