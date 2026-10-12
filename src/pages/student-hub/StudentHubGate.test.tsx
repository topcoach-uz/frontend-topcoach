import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentHubGate from './StudentHubGate';
const state = vi.hoisted(() => ({ staff: true, admin: true, loading: false }));
vi.mock('src/app/store', () => ({ useTypedSelector: (selector: any) => selector({ auth: { isAuthenticated: true, profile: { id: 'user', profile: { role: 'Student' } } } }) }));
vi.mock('src/hooks/useOrgStaff', () => ({ default: () => ({ isOrgStaff: state.staff, isPlatformStaff: state.admin, isLoading: state.loading }) }));
vi.mock('src/components/loader', () => ({ default: () => <div>Loading</div> }));
vi.mock('react-router-dom', () => ({ Navigate: ({ to }: any) => <div>{to}</div> }));
vi.mock('src/contexts/JourneyExperienceContext', () => ({ JourneyExperienceProvider: ({ children }: any) => children }));
vi.mock('./StudentHubRoutes', () => ({ default: () => <div>Student hub</div> }));
beforeEach(() => { state.staff = true; state.admin = true; state.loading = false; });
describe('Student hub counselor redirect', () => {
  it('redirects an assigned counselor even when the account also has platform admin access', () => {
    const html = renderToStaticMarkup(<StudentHubGate />);
    expect(html).toContain('/counselor-console'); expect(html).not.toContain('Student hub');
  });
  it('preserves hub preview access for an administrator without a school assignment', () => {
    state.staff = false;
    expect(renderToStaticMarkup(<StudentHubGate />)).toContain('Student hub');
  });
  it('waits for membership before rendering either surface', () => {
    state.loading = true;
    expect(renderToStaticMarkup(<StudentHubGate />)).toContain('Loading');
  });
});
