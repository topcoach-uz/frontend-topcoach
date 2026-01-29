import { Divider } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { CustomButton, CustomText } from 'src/components/common';
import { Logo } from 'src/components/logos';
import RegisterGoogleButton from 'src/components/RegisterGoogleButton';
import { themeFontSize } from 'src/constants/theme';
import SigninForm from './_components/form';
import TitleDescriptionPair from './_components/title_description_pair';
import styles from './signin.module.scss';
import DontHaveAccount from 'src/components/DontHaveAccount';
import { useTranslation } from 'react-i18next';

export default function SignInPage() {
  const colors = useTypedSelector((state) => state.layout.colors);
  const { t } = useTranslation();

  return (
    <div>
      <Link to="/">
        <Logo className={styles.logo} />
      </Link>
      <TitleDescriptionPair
        title={t('signIn.title')}
        description={t('signIn.backText')}
      />

      <RegisterGoogleButton text={t('signIn.googleText')} />

      <Divider type="horizontal">
        <CustomText color={colors.colorTextDescription}>
          {t('signIn.emailOffer')}
        </CustomText>
      </Divider>
      {/* Form */}
      <SigninForm />
      {/* Form */}
      <DontHaveAccount />
    </div>
  );
}
