import { Form, message } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomButton, CustomText } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import { Logo } from 'src/components/logos';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { useSubmitFormMutation } from 'src/app/services/contactApi';

export default function MailForm() {
  const colors = useColors();
  const { t } = useTranslation();

  const [form] = Form.useForm();
  const [submitForm, { isLoading }] = useSubmitFormMutation();

  const handleSubmit = async () => {
    try {
      const formValues = form.getFieldsValue();
      const { name, email, message: msg } = formValues;

      // Validate required fields
      if (!name || !name.trim()) {
        message.error(t('contact.formValidationError') || 'Please enter your name');
        return;
      }

      if (!email || !email.trim()) {
        message.error(t('contact.formValidationError') || 'Please enter your email address');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        message.error(t('contact.formValidationError') || 'Please enter a valid email address');
        return;
      }

      const submitData = {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        additionalMessage: msg?.trim() || '',
      };

      const result = await submitForm(submitData).unwrap();

      message.success(result.message || t('contact.formSuccessMessage') || 'Message sent successfully!');
      form.resetFields();
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      message.error(error?.data?.message || t('contact.formErrorMessage') || 'Failed to send message. Please try again.');
    }
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
      required: true,
    },
    {
      name: 'email',
      label: t('contact.contactUsEmail') || 'Email',
      type: 'input',
      inputType: 'text',
      htmlType: 'email',
      placeholder: t('contact.contactUsEmailPlaceholder') || 'your.email@example.com',
      message: 'Please, enter your email',
      col: 24,
      required: true,
    },
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
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <FormMaker formItems={formItems} />
        <Form.Item>
          <CustomButton type="primary" width="100%" htmlType="submit" loading={isLoading}>
            {t('btn.send')}
          </CustomButton>
        </Form.Item>
      </Form>
    </div>
  );
}
