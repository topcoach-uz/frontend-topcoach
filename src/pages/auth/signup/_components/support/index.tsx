import { Form } from 'antd';
import React from 'react';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { InputFormItem } from 'src/components/form';
import { MentorRegistrationFormProps } from '../../mentor';
import FormButtons from '../buttons';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import { useTranslation } from 'react-i18next';

export default function Support({
  form,
  formButtonsProps,
}: MentorRegistrationFormProps) {
  const { t } = useTranslation();
  return (
    <div>
      <TitleDescriptionPair
        title={t('signUp.supportTitle')}
        description={t('signUp.supportText')}
      />
      <Form layout="vertical" form={form}>
        <InputFormItem
          col={24}
          name="mentorshipValue"
          label={t('signUp.value')}
          placeholder={t('signUp.valuePlaceholder')}
          height={40}
          textarea
          row={4}
          message={t('signUp.valueError')}
          inputType="textarea"
        />
        <InputFormItem
          name="mentoringExperience"
          col={24}
          label={t('signUp.experience')}
          placeholder={t('signUp.experiencePlaceholder')}
          height={40}
          textarea
          row={4}
          message={t('signUp.experienceError')}
          inputType="textarea"
        />
        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}
