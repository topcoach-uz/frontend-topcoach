import { Flex, Form } from 'antd';
import { UploadFile } from 'antd/lib';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { InputFormItem } from 'src/components/form';
import AvatarFormItem from 'src/components/form/common/AvatarFormItem';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import { MentorRegistrationFormProps } from '../../mentor';
import FormButtons from '../buttons';
import { useTranslation } from 'react-i18next';

interface Props extends MentorRegistrationFormProps {
  formError: string | null;
}

function DetailedInfo({ form, formButtonsProps, formError }: Props) {
  const { colors } = useTypedSelector((status) => status.layout);
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const { t } = useTranslation();
  const formItems: IFormItemType[] = [
    // {
    //   inputType: 'text',
    //   type: 'input',
    //   name: 'phone_number',
    //   label: t('signUp.phoneNumber'),
    //   placeholder: t('signUp.phoneNumberPlaceholder'),
    //   col: 24,
    // },
    {
      name: 'socials',
      type: 'input',
      inputType: 'text',
      htmlType: 'text',
      label: t('shared.linkedIn'),
      placeholder: t('shared.linkedInPlaceholder'),
      message: t('signUp.linkedInError'),
      col: 24,
    },
  ];

  return (
    <div>
      <TitleDescriptionPair
        title={t('signIn.know')}
        description={t('signIn.description')}
      />
      <Form form={form} layout="vertical">
        {isAuthenticated && (
          <InputFormItem
            name="name"
            type="input"
            inputType="text"
            htmlType="text"
            label="Full name"
            message="Please enter your full name"
            placeholder="John Doe"
            col={24}
          />
        )}
        <Flex
          justify="space-between"
          align="flex-start"
          style={{ height: 'max-content' }}
        >
          <span style={{ color: colors.colorError }}>*</span>
          <AvatarFormItem
            form={form}
            message={t('signUp.imgUploadError')}
            name="avatar"
            accept="image/*"
            uploadText={t('shared.uploadText')}
            replaceText={t('shared.replaceText')}
          />
          <CustomText
            fontSize={14}
            fontWeight={400}
            ml={10}
            color={colors.colorTextDescription}
          >
            {t('shared.imgUpload')}
          </CustomText>
        </Flex>

        <FormMaker formError={formError ?? ''} formItems={formItems} />

        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}

export default DetailedInfo;
