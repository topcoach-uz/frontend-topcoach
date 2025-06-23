import { Form } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomButton, CustomText } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import { Logo } from 'src/components/logos';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

export default function MailForm() {
  const colors = useColors();
  const { t } = useTranslation();

  const [form] = Form.useForm();
  const [mailtoLink, setMailtoLink] = useState('');

  const handleSubmit = () => {
    const formValues = form.getFieldsValue();
    const { name, message } = formValues;

    const subject = 'Form Submission';
    const body = `
      Name: ${name}
      Message: ${message}
    `;
    const newMailtoLink = `mailto:support@topcoach.uz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailtoLink(newMailtoLink);
    console.log('formValues', formValues);

    // clear the form fields
    form.resetFields();
  };

  const formItems: IFormItemType[] = [
    {
      name: 'name',
      label: t('contact.contactUsName'),
      type: 'input',
      inputType: 'text',
      placeholder: t('contact.contactUsNamePlaceholder'),
      message: 'Please, enter your name',
      col: 24,
    },
    // {
    //   name: 'email',
    //   label: 'Mail',
    //   type: 'input',
    //   inputType: 'text',
    //   htmlType: 'email',
    //   placeholder: 'example@gmail.com',
    //   message: 'Please, enter your email',
    //   col: 24,
    // },
    {
      name: 'message',
      label: t('contact.contactUsMessage'),
      placeholder: t('contact.contactUsMessagePlaceholder'),
      type: 'input',
      inputType: 'textarea',
      message: 'Please, enter your message',
      col: 24,
    },
  ];
  return (
    <div>
      <Logo />
      <CustomText
        fontSize={32}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorText}
        mt={24}
        mb={8}
      >
        {t('contact.contactUsTitle')}
      </CustomText>
      <CustomText
        color={colors.colorTextTertiary}
        fontSize={themeFontSize.fontSizeTitle8}
        lineHeight={1.4}
        mb={24}
      >
        {t('contact.contactUsSubtitle')}
      </CustomText>
      <Form form={form} layout="vertical">
        <FormMaker formItems={formItems} />
        <Form.Item>
          <a href={mailtoLink} onClick={handleSubmit}>
            <CustomButton type="primary" width="100%">
              {t('btn.send')}
            </CustomButton>
          </a>
        </Form.Item>
      </Form>
    </div>
  );
}
