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
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

export default function GoogleAuthenticationPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { searchParams } = useParamsHook();
  const exchangeToken = searchParams.get('exchangeToken') || '';
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useGetMeQuery(undefined, {
    skip: !exchangeSuccess,
  });

  if (data?.id) {
    dispatch(loginCheck());
  }

  useEffect(() => {
    if (exchangeSuccess) {
      refetch();
    }
  }, [exchangeSuccess]);

  if (data?.profile.profileComplete) {
    window.location.href = '/';
  }

  const [selected, setSelected] = useState<UserType>(UserRole.Student);

  const handleChange = (key: UserType) => {
    setSelected(key);
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

  const handleSubmit = async () => {
    if (selected === UserRole.Mentor) {
      setSubmitting(true);
      // @ts-ignore
      dispatch(updateProfile({ profile: { role: UserRole.Mentor } }))
        .unwrap()
        .then(() => {
          navigate('/auth/signup/mentor?step=1');
        })
        .catch((err) => {
          message.error(err.message, 10);
        })
        .finally(() => setSubmitting(false));
    } else {
      setSubmitting(true);
      dispatch(
        updateProfile({
          // @ts-ignore
          profile: { profileComplete: true },
        })
      )
        .unwrap()
        .then((res) => {
          navigate('/');
        })
        .catch((err) => message.error(err.message, 10))
        .finally(() => setSubmitting(false));
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      <Link className={styles.logo} to="/">
        <Logo />
      </Link>
      <TitleDescriptionPair
        title="Welcome!"
        description="Are you a mentor or a student?"
      />

      <div className={styles.container}>
        <RoleCard handleChange={handleChange} selected={selected} />
        <CustomButton
          onClick={handleSubmit}
          type="primary"
          width="100%"
          loading={submitting}
        >
          {t('btn.continue')}
        </CustomButton>
      </div>
    </div>
  );
}
