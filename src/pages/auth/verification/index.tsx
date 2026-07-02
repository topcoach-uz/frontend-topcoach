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
  const token = searchParams.get('token') ?? '';

  const isVerified = verified ?? false;

  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationError, setVerificationError] = useState('');

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

  // Handle token verification
  useEffect(() => {
    if (token && !isVerified && !isProcessing) {
      setIsProcessing(true);
      setVerificationError('');
      
      // Call the backend verification endpoint using the API
      api.auth
        .verifyEmail({ token })
        .then((response: any) => {
          // Success - use redirectUrl from response if available, otherwise use default
          const redirectUrl = response?.data?.redirectUrl || '/?verified=true';
          window.location.href = redirectUrl;
        })
        .catch((error) => {
          console.error('Verification error:', error);
          setVerificationError(error?.response?.data?.message || 'Verification failed. Please try again.');
          setIsProcessing(false);
        });
    }
  }, [token, isVerified, isProcessing]);

  // After the email is verified, show the success state briefly then send the
  // user to sign in. Must live in an effect — doing it in render queued a new
  // timer (and navigation) on every re-render.
  useEffect(() => {
    if (!verified) return;
    const timer = setTimeout(() => navigate('/auth/signin'), 5000);
    return () => clearTimeout(timer);
  }, [verified, navigate]);

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
          {isProcessing 
            ? 'Verifying Email...' 
            : isVerified 
              ? t('signUp.verified') 
              : verificationError 
                ? 'Verification Failed' 
                : t('signUp.emailSend')}
        </CustomText>
        <CustomText
          color={colors.colorTextDescription}
          lineHeight="22px"
          mb={24}
        >
          {isProcessing 
            ? 'Please wait while we verify your email address...'
            : isVerified
              ? t('signUp.rediredToLogin')
              : verificationError
                ? verificationError
                : t('signUp.emailVerification').replace('{{email}}', email)}
        </CustomText>
        {isProcessing ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ marginBottom: '10px' }}>Processing...</div>
          </div>
        ) : isVerified ? (
          ''
        ) : verificationError ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <CustomText
              color={colors.colorError || '#ff4d4f'}
              style={{ marginBottom: '20px' }}
            >
              {verificationError}
            </CustomText>
            <Button
              type="primary"
              onClick={() => window.location.reload()}
              style={{ marginRight: '10px' }}
            >
              Try Again
            </Button>
            <Button onClick={() => navigate('/auth/signin')}>
              Go to Login
            </Button>
          </div>
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
