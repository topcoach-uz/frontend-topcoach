import { MailOutlined } from '@ant-design/icons';
import { Button, Divider, Flex } from 'antd';
import { FormInstance } from 'antd/lib';
import { useEffect, useState } from 'react';
import { UserRole } from 'src/app/api/Api';
import { UserType } from 'src/app/type';
import { CustomText } from 'src/components/common';
import RegisterGoogleButton from 'src/components/RegisterGoogleButton';
import useParamsHook from 'src/hooks/params';
import useColors from 'src/hooks/useColors';
import TitleDescriptionPair from '../signin/_components/title_description_pair';
import { FormButtonsProps } from './_components/buttons';
import RoleChoiceStep from './_components/RoleChoiceStep';
import { Link, useNavigate } from 'react-router-dom';
import styles from './signup.module.scss';
import { useTranslation } from 'react-i18next';
import AlreadyHaveAccount from 'src/components/AlreadyHaveAccount';
import { Logo } from 'src/components/logos';

export interface MentorRegistrationFormProps {
  form: FormInstance;
  formButtonsProps: FormButtonsProps;
  checkEmail?: string;
}

export default function SignupPage() {
  const { searchParams, handleMakeParams } = useParamsHook();
  const colors = useColors();
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(
    Number(searchParams.get('step')) || 0
  );
  const [selected, setSelected] = useState<UserType>(UserRole.Student);
  const { t } = useTranslation();
  const handleChange = (role: UserType) => {
    setSelected(role);
  };

  const handleSubmit = () => {
    navigate(selected.toLowerCase());
  };

  const handleViaEmail = () => {
    handleMakeParams('step', String(step + 1));
  };

  useEffect(() => {
    setStep(Number(searchParams.get('step')));
  }, [searchParams]);

  return (
    <div>
      {step === 0 ? (
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
            icon={<MailOutlined />}
            style={{ width: '100%', marginBottom: 10 }}
            onClick={handleViaEmail}
            className={styles.signUpViaEmailButton}
          >
            {t('signIn.mail')}
          </Button>
          <AlreadyHaveAccount />
        </div>
      ) : (
        <RoleChoiceStep
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          selected={selected}
        />
      )}
    </div>
  );
}
