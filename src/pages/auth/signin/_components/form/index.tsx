import { useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
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

export default function SigninForm() {
  const { form } = useSignInForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
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
          dispatch(
            login({
              access: access_token,
              refresh: refresh_token,
            })
          );
          api.instance.defaults.headers['Authorization'] =
            `Bearer ${access_token}`;
          
          // Return to where the user came from, but never an auth page.
          const redirectUrl = localStorage.getItem('redirectAfterLogin');
          localStorage.removeItem('redirectAfterLogin');
          window.location.href =
            redirectUrl && !redirectUrl.startsWith('/auth') ? redirectUrl : '/';
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
