import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingWizardPage from './index';

const fixture = vi.hoisted(() => ({ version: undefined as number | undefined, loading: false, junior: false, staff: false, platformStaff: false, staffLoading: false }));
vi.mock('src/hooks/useOrgStaff', () => ({ default: () => ({ isOrgStaff: fixture.staff, isPlatformStaff: fixture.platformStaff, isLoading: fixture.staffLoading }) }));
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
  fixture.staff = false;
  fixture.platformStaff = false;
  fixture.staffLoading = false;
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
  it.each([undefined, 1, 2])('sends a counselor with a Student profile to the console for onboarding version %s', (version) => {
    fixture.version = version;
    fixture.staff = true;
    fixture.junior = true;
    const html = renderToStaticMarkup(<OnboardingWizardPage />);
    expect(html).toContain('/counselor-console');
    expect(html).not.toContain('New onboarding');
    expect(html).not.toContain('/student-hub');
  });
  it('waits for membership before offering the student wizard', () => {
    fixture.staffLoading = true;
    expect(renderToStaticMarkup(<OnboardingWizardPage />)).toContain('Loading account');
  });
  it('keeps platform administrators out of student onboarding', () => {
    fixture.platformStaff = true;
    expect(renderToStaticMarkup(<OnboardingWizardPage />)).toContain('/new-admin');
  });
});
