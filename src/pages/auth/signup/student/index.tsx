import { useForm } from 'antd/es/form/Form';
import { api } from 'src/app/api';
import { UserRole } from 'src/app/api/Api';
import PersonalInfo from '../_components/personalInfo';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from 'src/components/logos';
import AlreadyHaveAccount from 'src/components/AlreadyHaveAccount';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';

export default function StudentRegistrationPage() {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  /**
   * Organization-invitation signup.
   *
   * `/join/<token>` sends invitees straight here with `?email=` (and `?org=`),
   * skipping the Student/Mentor chooser — a counselor being asked to pick
   * "Student or Mentor" is nonsense, and the org role comes from the invitation
   * regardless of the profile role chosen here.
   *
   * The email is fixed and NOT editable: membership is granted server-side by
   * matching the INVITED address, so a typo or a different address would
   * silently leave them out of the organization that invited them.
   */
  const invitedEmail = useMemo(
    () => searchParams.get('email')?.trim() || undefined,
    [searchParams],
  );
  const invitedOrg = searchParams.get('org')?.trim() || undefined;
  /**
   * The invitation's ORG role (owner/counselor/student) — used for copy only.
   * Account creation always goes through /auth/student/register/email (the only
   * email-signup endpoint), so an invited counselor still gets
   * `profile.role === 'Student'`; their console access comes from the org
   * membership, not from this. Aligning the profile role needs a backend change.
   */
  const invitedRole = searchParams.get('role')?.trim().toLowerCase() || undefined;
  /** Same-site only — this is echoed into a navigation after verification. */
  const redirectTo = useMemo(() => {
    const raw = searchParams.get('redirect');
    return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : undefined;
  }, [searchParams]);

  useEffect(() => {
    if (invitedEmail) form.setFieldsValue({ email: invitedEmail });
  }, [invitedEmail, form]);

  // Re-arm the post-login redirect here as well as on /join. Someone who opens
  // the invite link on their phone and the signup on a laptop never ran
  // JoinPage's write in this browser, so without this the token is lost the
  // moment they finish verifying.
  useEffect(() => {
    if (!redirectTo) return;
    try {
      localStorage.setItem('redirectAfterLogin', redirectTo);
    } catch {
      /* ignore private-mode write failures */
    }
  }, [redirectTo]);

  const onFinish = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      // A disabled field can still be absent from `values`; the invited address
      // is the source of truth when present.
      const email = (invitedEmail ?? values.email)?.trim();
      await api.auth
        .registerStudentByEmail({
          email,
          password: values.password?.trim(),
          name: values.name?.trim(),
        } as any)
        .then(() => {
          const params = new URLSearchParams({ email });
          if (redirectTo) params.set('redirect', redirectTo);
          navigate(`/auth/verification?${params.toString()}`);
        })
        .catch((err) => {
          if (
            err?.response?.data.message ===
            'User already registered with this email'
          ) {
            setErrorMessage(t('signUp.emailAreadyExists'));
            message.error('Email aready exists');
          }

          if (
            Array.isArray(err?.response?.data.message) &&
            err.response.data.message[0] === 'email must be an email'
          ) {
            setErrorMessage(t('signUp.emailMust'));
            message.error(t('signUp.emailMust'));
          }
          // setErrorMessage(err?.response?.data?.message);
          console.log(err.response.data.message);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  const formButtonsProps = {
    onNext: onFinish,
  };

  return (
    <div>
      <Link to="/">
        <Logo />
      </Link>
      <PersonalInfo
        form={form}
        registrationType={UserRole.Student}
        formButtonsProps={formButtonsProps}
        loading={loading}
        error={errorMessage ?? undefined}
        lockedEmail={invitedEmail}
        title={invitedEmail ? 'Create your account' : undefined}
        description={
          invitedEmail
            ? `Set a password to accept your invitation${
                invitedOrg ? ` to ${invitedOrg}` : ''
              }${
                invitedRole && invitedRole !== 'student'
                  ? ` as a ${invitedRole}`
                  : ''
              }. We'll take you there as soon as you're in.`
            : undefined
        }
      />
      <AlreadyHaveAccount />
    </div>
  );
}
