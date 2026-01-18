import { Form } from 'antd';
import React from 'react';
import { useWatch } from 'antd/es/form/Form';
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
  const isUzCombinatorMentor = useWatch('isUzCombinatorMentor', form) || form.getFieldValue('isUzCombinatorMentor') || false;
  
  return (
    <div>
      <TitleDescriptionPair
        title={isUzCombinatorMentor 
          ? "Your startup mentoring experience" 
          : t('signUp.supportTitle')}
        description={isUzCombinatorMentor
          ? "Help founders understand what they can gain from sessions with you"
          : t('signUp.supportText')}
      />
      <Form layout="vertical" form={form}>
        {isUzCombinatorMentor ? (
          <>
            <InputFormItem
              name="mentoringExperience"
              col={24}
              label="What's your background or experience in startups or mentoring?"
              placeholder='Example: "Founded 2 startups and mentored 100+ founders through accelerators."'
              height={40}
              textarea
              row={4}
              message="Please share your background or experience"
              inputType="textarea"
              required
            />
            <InputFormItem
              col={24}
              name="mentorshipValue"
              label="What can founders expect to gain from sessions with you?"
              placeholder='Example: "Clear action plans, investor-ready pitches, and proven growth frameworks."'
              height={40}
              textarea
              row={4}
              message="Please describe what founders can expect to gain"
              inputType="textarea"
              required
            />
          </>
        ) : (
          <>
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
          </>
        )}
        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}
