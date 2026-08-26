import { useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { login } from 'src/app/slices/authSlice';
import { useAppDispatch } from 'src/app/store';
import { CustomButton } from 'src/components/common';
import { themeFontSize } from 'src/constants/theme';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import styles from './signin_form.module.scss';
import useSignInForm from './useSignInForm';
import FormError from 'src/components/form/common/FormError';
import { LoginDto } from 'src/app/api/Api';
import { trackLogin } from 'src/lib/meta-pixel';

export default function SigninForm() {
  const { form } = useSignInForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isUnverifiedEmail = !!error?.toLowerCase().includes('verify your email');

  const formItems: IFormItemType[] = [
    {
      name: 'email',
      type: 'input',
      inputType: 'text',
      htmlType: 'email',
      label: t('signIn.email'),
      placeholder: t('signIn.emailPlaceholder'),
      message: t('signIn.emailError'),
      col: 24,
      formItemProps: {
        rules: [
          { required: true, message: t('signIn.emailError') },
          { type: 'email', message: t('signIn.emailFormatError') },
        ],
      },
    },
    {
      name: 'password',
      type: 'input',
      inputType: 'password',
      htmlType: 'password',
      label: t('signIn.password'),
      placeholder: t('signIn.passwordPlaceholder'),
      col: 24,
      formItemProps: {
        rules: [{ required: true, message: t('signIn.passwordError') }],
      },
      rootClassName: styles.password_input,
      style: { marginBottom: '20px' },
      message: t('signIn.passwordError'),
    },
  ];

  const handleSubmit = (values: LoginDto) => {
    setLoading(true);
    api.auth
      .login({ email: values.email.trim(), password: values.password.trim() })
      .then((res: any) => {
        const access_token = res.data?.user?.access;
        const refresh_token = res.data?.user?.refresh;
        if (!!access_token && !!refresh_token) {
          // Meta Pixel: only here, where tokens actually came back — a 200 with
          // no tokens is not a signed-in user.
          trackLogin('email');
          dispatch(
            login({
              access: access_token,
              refresh: refresh_token,
            })
          );
          api.instance.defaults.headers['Authorization'] =
            `Bearer ${access_token}`;
          
          // Return to where the user came from, but never an auth page.
          // Client-side navigation, NOT window.location.href: a hard reload
          // re-bootstrapped the entire app (all chunks, all queries, the
          // full loader chain) on every sign-in. With SPA navigation the
          // router's bootstrap overlay covers the transition and the
          // landing page renders as soon as getMe resolves.
          //
          // `?redirect=` wins over the stored value: it is the explicit intent
          // of the link that sent the user here (e.g. `/join/<token>`), and it
          // is the ONLY carrier that survives a cross-device or private-window
          // hop, where localStorage was never written. Query-param targets are
          // restricted to same-site paths so the param can't be used as an
          // open redirect.
          const paramUrl = searchParams.get('redirect');
          const safeParamUrl =
            paramUrl &&
            paramUrl.startsWith('/') &&
            !paramUrl.startsWith('//') &&
            !paramUrl.startsWith('/auth')
              ? paramUrl
              : null;
          const redirectUrl =
            safeParamUrl ?? localStorage.getItem('redirectAfterLogin');
          localStorage.removeItem('redirectAfterLogin');
          const target =
            redirectUrl && !redirectUrl.startsWith('/auth') ? redirectUrl : '/';
          if (/^https?:\/\//.test(target)) {
            window.location.href = target;
          } else {
            navigate(target, { replace: true });
          }
        }
      })
      .catch((err: any) => {
        const errMsg = err?.response?.data?.message || 'An error occurred';
        setError(errMsg);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <FormMaker formItems={formItems}></FormMaker>

      <CustomButton
        style={{
          padding: 0,
          height: 32,
          fontSize: themeFontSize.fontSizeTitle8,
          marginLeft: 'auto',
          display: 'block',
        }}
        type="link"
        onClick={() => navigate('/auth/forgot-password')}
      >
        {t('signIn.forgotPassword')}
      </CustomButton>

      <FormError formError={error} />
      {isUnverifiedEmail && (
        <CustomButton
          type="link"
          onClick={async () => {
            const email = form.getFieldValue('email')?.trim();
            if (!email) {
              message.warning(t('signIn.emailError', 'Please enter your email'));
              return;
            }
            setResending(true);
            try {
              await api.auth.resendEmail({ email });
              message.success(t('signIn.resendSuccess', 'Verification email sent! Check your inbox.'));
              setError('');
            } catch (err: any) {
              message.error(err?.response?.data?.message || t('signIn.resendFailed', 'Failed to resend. Try again.'));
            } finally {
              setResending(false);
            }
          }}
          loading={resending}
          disabled={resending}
          style={{ padding: 0, marginTop: 4, display: 'block' }}
        >
          {t('signIn.resendVerification', 'Resend verification email')}
        </CustomButton>
      )}

      <CustomButton
        type="primary"
        htmlType="submit"
        block
        style={{ marginTop: 8 }}
        loading={loading} // Disable button while loading
      >
        {t('signIn.logIn')}
      </CustomButton>
    </Form>
  );
}
