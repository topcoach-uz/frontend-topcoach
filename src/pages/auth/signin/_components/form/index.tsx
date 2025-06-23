import { Form, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { LoginDto } from 'src/app/api/Api';
import { login } from 'src/app/slices/authSlice';
import { useAppDispatch } from 'src/app/store';
import { CustomButton } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import { themeFontSize } from 'src/constants/theme';
import styles from './signin_form.module.scss';
import useSignInForm from './useSignInForm';
import FormError from 'src/components/form/common/FormError';
import { useTranslation } from 'react-i18next';

export default function SigninForm() {
  const { form } = useSignInForm();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const formItems: IFormItemType[] = [
    {
      name: 'email',
      type: 'input',
      inputType: 'text',
      label: t('signIn.email'),
      placeholder: 'example@gmail.com',
      message: t('signIn.emailError'),
      col: 24,
    },
    {
      col: 24,
      name: 'password',
      type: 'input',
      inputType: 'password',
      label: t('signIn.password'),
      placeholder: t('signIn.paswordPlaceholder'),
      rootClassName: styles.password_input,
      style: { marginBottom: '20px' },
      formItemProps: { style: { marginBottom: 0 } },
      message: t('signIn.passwordError'),
      htmlType: 'password',
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
          window.location.href = '/';
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message);
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
