import { useForm } from 'antd/es/form/Form';
import { api } from 'src/app/api';
import { UserRole } from 'src/app/api/Api';
import PersonalInfo from '../_components/personalInfo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const onFinish = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      await api.auth
        .registerStudentByEmail({
          email: values.email?.trim(),
          password: values.password?.trim(),
          name: values.name?.trim(),
        } as any)
        .then((res) => {
          navigate(`/auth/verification?email=${values.email}`);
        })
        .catch((err) => {
          if (
            err?.response?.data.message ===
            'User already registered with this email'
          ) {
            setErrorMessage(t('signUp.emailAreadyExists'));
            message.error('dsdsds');
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
      />
      <AlreadyHaveAccount />
    </div>
  );
}
