import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentRegistrationPage from './index';

const state = vi.hoisted(() => ({
  params: new URLSearchParams(), props: undefined as any,
  navigate: vi.fn(), dispatch: vi.fn(), register: vi.fn(),
  form: { validateFields: vi.fn(), setFieldsValue: vi.fn() },
  headers: {} as Record<string, string>,
}));
vi.mock('antd/es/form/Form', () => ({ useForm: () => [state.form] }));
vi.mock('src/app/api', () => ({ api: { auth: { registerStudentByEmail: state.register }, instance: { defaults: { headers: state.headers } } } }));
vi.mock('src/app/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/app/slices/authSlice', () => ({ login: (payload: any) => ({ type: 'auth/login', payload }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate, useSearchParams: () => [state.params], Link: () => null }));
vi.mock('../_components/personalInfo', () => ({ default: (props: any) => { state.props = props; return null; } }));
vi.mock('src/components/logos', () => ({ Logo: () => null }));
vi.mock('src/components/AlreadyHaveAccount', () => ({ default: () => null }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('src/lib/meta-pixel', () => ({ trackCompleteRegistration: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  state.form.validateFields.mockResolvedValue({ email: 'student@example.test', name: 'Student', password: 'Secure!123' });
  state.params = new URLSearchParams({ email: 'student@example.test', invitationToken: 'a'.repeat(64), role: 'student', redirect: '/join/token' });
  (globalThis as any).localStorage = { removeItem: vi.fn(), setItem: vi.fn() };
});

describe('Invitation password setup', () => {
  it('submits the email invitation proof and signs in directly to the student hub', async () => {
    state.register.mockResolvedValue({ data: { emailVerificationRequired: false, user: { access: 'access', refresh: 'refresh' } } });
    renderToStaticMarkup(<StudentRegistrationPage />);
    state.props.formButtonsProps.onNext();
    await vi.waitFor(() => expect(state.navigate).toHaveBeenCalledWith('/student-hub', { replace: true }));
    expect(state.register).toHaveBeenCalledWith(expect.objectContaining({ invitationToken: 'a'.repeat(64), email: 'student@example.test' }));
    expect(state.dispatch).toHaveBeenCalledWith({ type: 'auth/login', payload: { access: 'access', refresh: 'refresh' } });
    expect(state.headers.Authorization).toBe('Bearer access');
    expect(localStorage.removeItem).toHaveBeenCalledWith('redirectAfterLogin');
  });
  it('keeps ordinary signup on verification and preserves its return path', async () => {
    state.params.delete('invitationToken');
    state.register.mockResolvedValue({ data: { emailVerificationRequired: true } });
    renderToStaticMarkup(<StudentRegistrationPage />);
    state.props.formButtonsProps.onNext();
    await vi.waitFor(() => expect(state.navigate).toHaveBeenCalledWith('/auth/verification?email=student%40example.test&redirect=%2Fjoin%2Ftoken'));
    expect(state.dispatch).not.toHaveBeenCalled();
    expect(state.register.mock.calls[0][0]).not.toHaveProperty('invitationToken');
  });
  it('preserves the sign-in fallback for clients receiving no session tokens', async () => {
    state.register.mockResolvedValue({ data: { emailVerificationRequired: false } });
    renderToStaticMarkup(<StudentRegistrationPage />);
    state.props.formButtonsProps.onNext();
    await vi.waitFor(() => expect(state.navigate).toHaveBeenCalledWith('/auth/signin?redirect=%2Fjoin%2Ftoken'));
    expect(state.dispatch).not.toHaveBeenCalled();
  });
});
