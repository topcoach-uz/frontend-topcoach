import { FC, useEffect, useState } from 'react';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import styles from './forgotPassword.module.scss';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { Button, Col, Flex, Form, Input, message } from 'antd';
import { api } from 'src/app/api';
import { InputFormItem } from 'src/components/form';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from 'src/components/logos';
import { Lock } from 'iconsax-react';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordPageProps {}

const ForgotPasswordPage: FC<ForgotPasswordPageProps> = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const colors = useColors();

  const handleSubmit = (values: any) => {
    form.validateFields().then(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (values && emailRegex.test(values.email)) {
        setLoading(true);
        api.auth
          // @ts-ignore
          .resetPassword({ email: values.email.trim() })
          .then(() => {
            navigate('/auth/forgot-password/sent');
          })
          .catch((err: any) => setError(err?.response?.data?.message))
          .finally(() => setLoading(false));
      } else {
        form.setFields([
          {
            name: 'email',
            errors: ['Please enter a valid email address!'],
          },
        ]);
      }
    });
  };

  return (
    <>
      <Link to="/" className={styles.logo}>
        <Logo />
      </Link>
      <Form onFinish={handleSubmit} form={form} layout="vertical">
        <Flex gap={20} align="center">
          <div className={styles.icon}>
            <Lock size="100%" color={colors.orange5} />
          </div>
          <CustomText
            color={colors.colorText}
            fontWeight={themeFontWeight.fontWeightSemibold}
            fontSize={themeFontSize.fontSizeTitle5}
          >
            {t('auth.forgotPassword')}
          </CustomText>
        </Flex>
        <CustomText
          color={colors.colorTextDescription}
          fontSize={themeFontSize.fontSizeTitle8}
          mt={8}
          mb={20}
        >
          {t('auth.forgotPasswordDescription')}
        </CustomText>
        <InputFormItem
          name="email"
          type="email"
          inputType="text"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          message="Please input your email!"
          required
        />

        {error && (
          <Col span={24} style={{ marginTop: 5 }}>
            <span
              style={{
                color: colors.colorErrorText,
              }}
            >
              {error}
            </span>
          </Col>
        )}

        <CustomButton
          className={styles.sendButton}
          type="primary"
          size="middle"
          htmlType="submit"
          width="100%"
          mb={15}
          loading={loading}
        >
          {t('auth.sendResetEmail')}
        </CustomButton>
        <Button
          size="middle"
          style={{ width: '100%' }}
          onClick={() => navigate('/auth/signin')}
        >
          {t('auth.backToLogin')}
        </Button>
      </Form>
    </>
  );
};

export default ForgotPasswordPage;
