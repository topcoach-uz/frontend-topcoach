import { Flex, Form } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { InputFormItem } from 'src/components/form';
import FormButtons from '../buttons';
import { MentorRegistrationFormProps } from '../../mentor';
import { useTranslation } from 'react-i18next';
import styles from './background.module.scss';
import { Link } from 'react-router-dom';

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
