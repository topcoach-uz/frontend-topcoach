import useColors from 'src/hooks/useColors';
import { CustomButton, CustomText } from '../common';
import { themeFontSize } from 'src/constants/theme';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AlreadyHaveAccount() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <CustomText
      fontSize={themeFontSize.fontSizeTitle8}
      //   mt={24}
      color={colors.colorText}
      centered
      style={{ justifyContent: 'center' }}
    >
      {t('signUp.haveAccount')}
      <CustomButton
        style={{ fontSize: themeFontSize.fontSizeTitle8 }}
        type="link"
        onClick={() => navigate('/auth/signin')}
      >
        {t('signUp.login')}
      </CustomButton>
    </CustomText>
  );
}
