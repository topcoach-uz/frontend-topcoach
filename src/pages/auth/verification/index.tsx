import { Button, message } from 'antd';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import useParamsHook from 'src/hooks/params';
import useColors from 'src/hooks/useColors';
import styles from './verification.module.scss';
import { Logo } from 'src/components/logos';
import { InfoIcon, Tick2Icon } from 'src/components/icons';
import { CustomText } from 'src/components/common';
import { themeFontWeight } from 'src/constants/theme';

export default function VerificationPage() {
  const colors = useColors();
  const { searchParams } = useParamsHook();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const verified =
    searchParams.get('verified') && !!searchParams.get('verified');
  const email = searchParams.get('email') ?? '';

  const isVerified = verified ?? false;

  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (isResendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResendDisabled(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isResendDisabled]);

  if (verified) {
    setTimeout(() => {
      navigate('/auth/signin');
    }, 5000);
  }

  const handleResend = () => {
    setIsResendDisabled(true);
    api.auth
      .resendEmail({ email })
      .then(() => {
        message.success('Email has been sent successfully');
      })
      .catch((err) => {
        message.error(err?.response?.data?.message);
      });
  };
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logo_wrapper}>
          <Link className={styles.logo} to="/">
            <Logo />
          </Link>
        </div>
        <div className={styles.tick_wrapper}>
          {isVerified ? (
            <Tick2Icon width={120} height={120} fill={colors.colorSuccess} />
          ) : (
            ''
          )}
        </div>{' '}
        <CustomText
          color={colors.colorText}
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={32}
        >
          {isVerified ? t('signUp.verified') : t('signUp.emailSend')}
        </CustomText>
        <CustomText
          color={colors.colorTextDescription}
          lineHeight="22px"
          mb={24}
        >
          {isVerified
            ? t('signUp.rediredToLogin')
            : t('signUp.emailVerification').replace('{{email}}', email)}
        </CustomText>
        {isVerified ? (
          ''
        ) : (
          <>
            <div className={styles.info_message}>
              <InfoIcon />
              <div className={styles.info_description}>
                <CustomText
                  color={colors.colorTextBase}
                  fontWeight={themeFontWeight.fontWeightMedium}
                  mb={8}
                >
                  {t('signUp.noEmailText')}
                </CustomText>
                <ul className={styles.list}>
                  <li>{t('signUp.detail1')}</li>
                  <li>{t('signUp.detail2')}</li>
                </ul>
              </div>
            </div>
            <CustomText
              style={{ display: 'block' }}
              color={colors.colorTextSecondary}
              lineHeight="22px"
            >
              {t('signUp.trouble')}
              <Button
                type="link"
                className={styles.link}
                onClick={handleResend}
                disabled={isResendDisabled}
              >
                {isResendDisabled
                  ? `${t('signUp.resend')} (${countdown}s)`
                  : t('signUp.resend')}
              </Button>
              {t('signIn.or')}
              <Button
                type="link"
                href="https://t.me/topcoach_support_dev_bot"
                target="_blank"
                className={styles.link}
              >
                {t('signUp.support')}
              </Button>
            </CustomText>
          </>
        )}
      </div>
    </div>
  );
}
