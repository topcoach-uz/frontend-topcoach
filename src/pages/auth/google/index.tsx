import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { CustomButton } from 'src/components/common';
import Loader from 'src/components/loader';
import { Logo } from 'src/components/logos';
import { ACCESS_TOKEN, REFRESH_TOKEN } from 'src/constants/storage';
import useParamsHook from 'src/hooks/params';
import TitleDescriptionPair from '../signin/_components/title_description_pair';
import RoleCard from '../signup/_components/role_card';
import styles from './AuthGoogle.module.scss';
import { useAppDispatch } from 'src/app/store';
import {
  loginCheck,
  setProfile,
  updateProfile,
} from 'src/app/slices/authSlice';
import { UserRole } from 'src/app/api/Api';
import { UserType } from 'src/app/type';
import { message, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';

export default function GoogleAuthenticationPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { searchParams } = useParamsHook();
  const exchangeToken = searchParams.get('exchangeToken') || '';
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [step, setStep] = useState<'role' | 'phone'>('role');
  const [selectedRole, setSelectedRole] = useState<UserType | undefined>(undefined);
  const [phoneForm] = Form.useForm();

  const { data, isLoading, refetch } = useGetMeQuery(undefined, {
    skip: !exchangeSuccess,
  });

  // Handle user data when it's loaded
  useEffect(() => {
    if (data?.id) {
      dispatch(loginCheck());
    }
  }, [data?.id, dispatch]);

  useEffect(() => {
    if (exchangeSuccess) {
      refetch();
    }
  }, [exchangeSuccess, refetch]);

  const handleRoleChange = (key: UserType) => {
    setSelectedRole(key);
  };

  const handleRoleSubmit = () => {
    if (!selectedRole) {
      message.error('Please select a role');
      return;
    }
    setStep('phone');
  };

  const handlePhoneSubmit = async () => {
    try {
      const values = await phoneForm.validateFields();
      setSubmitting(true);
      
      // Update user profile with phone number
      await dispatch(
        updateProfile({
          phoneNumber: values.phoneNumber,
        })
      ).unwrap();

      // Continue with role-specific flow
      if (selectedRole === UserRole.Mentor) {
        navigate('/auth/signup/mentor?step=1');
      } else {
        await dispatch(
          updateProfile({
            // @ts-ignore
            profile: { profileComplete: true },
          })
        ).unwrap();
        navigate('/');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to update phone number', 10);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    api.auth
      .exchangeTokens({ code: exchangeToken })
      .then((res) => {
        setExchangeSuccess(true);
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        api.instance.defaults.headers['Authorization'] =
          `Bearer ${res.data.access}`;
      })
      .catch((err) => {
        message.error(err.response.data.message, 10);
      });
  }, [exchangeToken]);

  // Show loader while exchanging tokens or loading user data
  if (isLoading || !exchangeSuccess) {
    return <Loader />;
  }

  return (
    <div>
      <Link className={styles.logo} to="/">
        <Logo />
      </Link>
      
      {step === 'role' ? (
        <>
          <TitleDescriptionPair
            title="Welcome!"
            description="Are you a mentor or a student?"
          />

          <div className={styles.container}>
            <RoleCard handleChange={handleRoleChange} selected={selectedRole as UserType} />
            <CustomButton
              onClick={handleRoleSubmit}
              type="primary"
              width="100%"
              disabled={!selectedRole}
            >
              {t('btn.continue')}
            </CustomButton>
          </div>
        </>
      ) : (
        <>
          <TitleDescriptionPair
            title="Complete Your Profile"
            description="Please provide your phone number to continue"
          />

          <div className={styles.container}>
            <Form form={phoneForm} layout="vertical">
              <Form.Item
                name="phoneNumber"
                label={t('signUp.phoneNumber')}
                rules={[
                  { required: true, message: t('signUp.phoneNumberError') },
                  { pattern: /^\+?\d{9,15}$/, message: t('signUp.phoneNumberFormatError') },
                ]}
              >
                <Input
                  placeholder={t('signUp.phoneNumberPlaceholder')}
                  size="large"
                />
              </Form.Item>
            </Form>
            
            <CustomButton
              onClick={handlePhoneSubmit}
              type="primary"
              width="100%"
              loading={submitting}
            >
              {t('btn.continue')}
            </CustomButton>
          </div>
        </>
      )}
    </div>
  );
}
