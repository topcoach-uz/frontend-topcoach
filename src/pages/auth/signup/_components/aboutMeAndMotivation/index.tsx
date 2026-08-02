import { Form } from 'antd';
import React from 'react';
import { InputFormItem } from 'src/components/form';
import { MentorRegistrationFormProps } from '../../mentor';
import FormButtons from '../buttons';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import { useTranslation } from 'react-i18next';

export default function AboutMeAndMotivation({
  form,
  formButtonsProps,
}: MentorRegistrationFormProps) {
  const { t } = useTranslation();

  return (
    <div>
      <TitleDescriptionPair
        title={t('signUp.aboutMeTitle') || "About Me & Motivation"}
        description={t('signUp.aboutMeDescription') || "Tell us about yourself and your motivation for mentoring"}
      />
      <Form layout="vertical" form={form}>
        <InputFormItem
          col={24}
          name="summary"
          label={t('signUp.aboutMe') || "About Me"}
          placeholder={t('signUp.aboutMePlaceholder') || "Introduce yourself briefly. This will appear at the top of your mentor profile. (150-300 words)"}
          height={40}
          textarea
          row={6}
          message={t('signUp.aboutMeError') || "Please provide a brief introduction"}
          inputType="textarea"
          required
        />
        <InputFormItem
          name="whyDoICoach"
          col={24}
          label={t('signUp.whyDoICoach') || "Why do I coach?"}
          placeholder={t('signUp.whyDoICoachPlaceholder') || "Share your motivation for mentoring students. What drives you to help others? (200-500 words)"}
          height={40}
          textarea
          row={6}
          message={t('signUp.whyDoICoachError') || "Please share your motivation"}
          inputType="textarea"
          required
        />
        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}

