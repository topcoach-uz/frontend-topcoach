import { Flex, Form } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { InputFormItem, SelectFormItem } from 'src/components/form';
import FormButtons from '../buttons';
import { MentorRegistrationFormProps } from '../../mentor';
import { useTranslation } from 'react-i18next';
import styles from './background.module.scss';
import { Link } from 'react-router-dom';

// Tag options for mentor specializations
const TAG_OPTIONS = [
  { label: 'Business & MBA', value: 'business' },
  { label: 'Computer Science & Engineering', value: 'computer-science' },
  { label: 'Medicine & Health Sciences', value: 'medicine' },
  { label: 'Law', value: 'law' },
  { label: 'Humanities & Social Sciences', value: 'humanities' },
  { label: 'Arts & Design', value: 'arts' },
  { label: 'Natural Sciences', value: 'natural-sciences' },
  { label: 'Mathematics & Statistics', value: 'mathematics' },
  { label: 'Economics & Finance', value: 'economics' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Education', value: 'education' },
  { label: 'International Relations', value: 'international-relations' },
];

export default function Background({
  form,
  formButtonsProps,
}: MentorRegistrationFormProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const { t } = useTranslation();
  return (
    <div>
      <CustomText
        fontSize={32}
        fontWeight={600}
        color={colors.colorText}
        mt={24}
        mb={24}
      >
        {t('signUp.backgroundTitle')}
      </CustomText>

      <Form form={form} layout="vertical">
        <SelectFormItem
          name="tags"
          label={t('signUp.tags') || 'Specializations'}
          placeholder={t('signUp.tagsPlaceholder') || 'Select your areas of specialization (optional)'}
          options={TAG_OPTIONS}
          mode="multiple"
          col={24}
          message={t('signUp.tagsError')}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <InputFormItem
          name="background"
          label={
            <Flex vertical>
              {t('signUp.background')}
              <Link
                to={`/faq?questionNumber=4`}
                className={styles.seeFaq}
                target="_blank"
              >
                {t('signUp.seeFaq')}
              </Link>
            </Flex>
          }
          placeholder={t('signUp.backgroundPlaceholder')}
          inputType="textarea"
          message={t('signUp.backgroundError')}
          height={40}
          col={24}
          row={4}
          required
          textarea
        />
        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}
