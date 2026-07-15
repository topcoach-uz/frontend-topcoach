import { Checkbox, Divider, Form } from 'antd';
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
  /** Overrides the default heading/subheading (e.g. for an invite signup). */
  title?: string;
  description?: string;
  /** Fixed invitation email — prefilled and not editable. */
  lockedEmail?: string;
}

export default function PersonalInfo({
  form,
  formButtonsProps,
  registrationType = UserRole.Mentor,
  loading,
  error,
  title,
  description,
  lockedEmail,
}: MentorRegistrationFormProps) {
  const { formItems } = usePersonalInfo({ form, lockedEmail });
  const { t } = useTranslation();

  const isMentor = registrationType === UserRole.Mentor;

  return (
    <div>
      <TitleDescriptionPair
        title={title ?? t('signIn.know')}
        /* `signIn.description2` reads "Start your journey as a mentor…". This
           component backs BOTH the mentor and student signups, so students were
           being told they were becoming mentors. Only mentors see it now. */
        description={
          description ?? (isMentor ? t('signIn.description2') : t('signUp.studentDescription'))
        }
      />

      <Form form={form} layout="vertical" onFinish={formButtonsProps?.onNext}>
        <FormMaker formItems={formItems} formError={error} />

        {/* Mentor-only. It was rendering on the student signup too, asking
            students whether they were applying as a UzCombinator mentor. */}
        {isMentor ? (
          <Form.Item
            name="isUzCombinatorMentor"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Checkbox>
              <CustomText fontSize={14} fontWeight={400}>
                Are you applying as a UzCombinator mentor?
              </CustomText>
            </Checkbox>
          </Form.Item>
        ) : null}

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
