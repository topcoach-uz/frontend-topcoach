import { Mail } from 'lucide-react';
import { Button, Divider, Flex } from 'antd';
import { CustomText } from 'src/components/common';
import RegisterGoogleButton from 'src/components/RegisterGoogleButton';
import useColors from 'src/hooks/useColors';
import TitleDescriptionPair from '../signin/_components/title_description_pair';
import { Link, useNavigate } from 'react-router-dom';
import styles from './signup.module.scss';
import { useTranslation } from 'react-i18next';
import AlreadyHaveAccount from 'src/components/AlreadyHaveAccount';
import { Logo } from 'src/components/logos';

// Role choice used to happen here (RoleChoiceStep) before the student vs.
// mentor registration endpoint was picked. It now happens post-login, in
// the /onboarding wizard's Step 1 — every email signup always registers as
// a student first (see ONBOARDING_DESIGN.md). Mentor applicants pick
// "Mentor" in onboarding, which routes them into /auth/signup/mentor.
export default function SignupPage() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleViaEmail = () => {
    navigate('student');
  };

  return (
    <div>
      <Flex gap={10} vertical>
        <Link to="/">
          <Logo />
        </Link>
        <TitleDescriptionPair
          title={t('signIn.know')}
          description={t('signIn.description')}
        />
      </Flex>

      <RegisterGoogleButton text={t('signUp.google')} />

      <Divider type="horizontal">
        <CustomText color={colors.colorTextDescription}>
          {t('signIn.or')}
        </CustomText>
      </Divider>

      <Button
        size="large"
        icon={<Mail size={16} />}
        style={{ width: '100%', marginBottom: 10 }}
        onClick={handleViaEmail}
        className={styles.signUpViaEmailButton}
      >
        {t('signIn.mail')}
      </Button>
      <AlreadyHaveAccount />
    </div>
  );
}
