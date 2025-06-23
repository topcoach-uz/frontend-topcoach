import { useNavigate } from 'react-router-dom';
import { themeFontSize } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { CustomButton, CustomText } from '../common';
import { useTranslation } from 'react-i18next';

export default function DontHaveAccount() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <CustomText
      fontSize={themeFontSize.fontSizeTitle8}
      mt={24}
      color={colors.colorText}
      centered
      style={{ justifyContent: 'center' }}
    >
      {t('signIn.noAccount')}
      <CustomButton
        style={{ fontSize: themeFontSize.fontSizeTitle8 }}
        type="link"
        onClick={() => navigate('/auth/signup')}
      >
        {t('signIn.createAcc')}
      </CustomButton>
    </CustomText>
  );
}
