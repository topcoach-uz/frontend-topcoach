import { Divider, Form } from 'antd';
import { FormInstance } from 'antd/lib';
import { useNavigate } from 'react-router-dom';
import { CustomButton, CustomText } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import RegisterGoogleButton from 'src/components/RegisterGoogleButton';
import { themeFontSize } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import { FormButtonsProps } from '../buttons';
import usePersonalInfo from './usePersonalInfo';
import { UserType } from 'src/app/type';
import { UserRole } from 'src/app/api/Api';
import { useTranslation } from 'react-i18next';

export interface MentorRegistrationFormProps {
  form: FormInstance;
  formButtonsProps?: FormButtonsProps;
  registrationType?: UserType;
  loading?: boolean;
  error?: string;
}

export default function PersonalInfo({
  form,
  formButtonsProps,
  registrationType = UserRole.Mentor,
  loading,
  error,
}: MentorRegistrationFormProps) {
  const { formItems } = usePersonalInfo({ form });
  const { t } = useTranslation();

  return (
    <div>
      <TitleDescriptionPair
        title={t('signIn.know')}
        description={t('signIn.description2')}
      />

      <Form form={form} layout="vertical" onFinish={formButtonsProps?.onNext}>
        <FormMaker formItems={formItems} formError={error} />

        <CustomButton
          type="primary"
          width="100%"
          mt={8}
          mb={18}
          htmlType="submit"
          loading={loading}
        >
          {registrationType == UserRole.Mentor
            ? t('btn.continue')
            : t('btn.signUp')}
        </CustomButton>
      </Form>
    </div>
  );
}
