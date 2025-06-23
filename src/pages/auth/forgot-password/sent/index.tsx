import { Flex, message } from 'antd';
import { log } from 'console';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { Tick2Icon } from 'src/components/icons';
import Loader from 'src/components/loader';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

export default function EmailSentPage() {
  const colors = useColors();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, profile } = useTypedSelector((state) => state.auth);

  const { isSuccess } = useGetMeQuery(undefined, { skip: !!profile?.email });

  // ! if already authenticated, turn on reset the password mode, not forgot password mode
  const [success, setSuccess] = useState(!isAuthenticated);

  // Getting the reset token if the user is already logged in
  const sendResetEmail = () => {
    setLoading(true);
    api.auth
      // @ts-ignore
      .resetPassword({ email: profile?.email ?? '' })
      .then(() => {
        setSuccess(true);
      })
      .catch((err: any) => message.error(err?.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && profile?.email) {
      sendResetEmail();
    }
  }, [isSuccess, profile?.email]);

  if (loading) {
    return <Loader />;
  }

  if (success)
    return (
      <Flex vertical gap={10} justify="center" style={{ height: '100%' }}>
        <Tick2Icon width={120} height={120} fill={colors.colorSuccess} />

        <CustomText
          color={colors.colorText}
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle4}
        >
          {t('auth.emailSent')}
        </CustomText>
        <CustomText
          color={colors.colorTextDescription}
          lineHeight="22px"
          mb={24}
        >
          {t('auth.emailSentDescription')}
        </CustomText>
      </Flex>
    );
}
