import { Checkbox, Flex, Form } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useEffect, useState } from 'react';
import { api } from 'src/app/api';
import CustomSelect from 'src/components/common/select';
import {
  DateFormItem,
  InputFormItem,
  SelectFormItem,
} from 'src/components/form';
import useApi from 'src/hooks/useApi';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import languageSelectOptions from '../../../../../../public/JSON/languageSelectOptions.json';
import { MentorRegistrationFormProps } from '../../mentor';
import FormButtons from '../buttons';
import { useTranslation } from 'react-i18next';

export default function AcademicInfo({
  form,
  formButtonsProps,
}: MentorRegistrationFormProps) {
  // getting university list
  const [showManualUniversity, setShowManualUniversity] = useState<boolean>(
    form.getFieldValue('customUniversity')
  );
  const { t } = useTranslation();
  const { response } = useApi(() => api.university.getUnivsList());
  const universityList = response?.data;

  if (showManualUniversity) {
    form.setFieldValue('selectedUniversities', undefined);
  }

  const handleCheckboxChange = (value: CheckboxChangeEvent) => {
    setShowManualUniversity(value.target.checked);
  };

  useEffect(() => {
    form.setFieldValue('customUniversity', showManualUniversity);
  }, [showManualUniversity]);

  return (
    <div>
      <TitleDescriptionPair
        title={t('signUp.academicBackground')}
        description={t('signUp.academicBackgroundText')}
      />
      <Form layout="vertical" form={form}>
        <Form.Item
          label={t('signUp.language')}
          name="languages"
          rules={[{ required: true, message: t('signUp.languageError') }]}
          required={true}
        >
          <CustomSelect
            mode="multiple"
            placeholder={t('signUp.languagePlaceholder')}
            optionFilterProp="label"
            options={languageSelectOptions}
          />
        </Form.Item>
        <InputFormItem
          name="major"
          col={24}
          label={t('shared.major')}
          placeholder={t('shared.majorPlaceholder')}
          height={40}
          message={t('signUp.majorError')}
          inputType="text"
        />

        <SelectFormItem
          name="selectedUniversities"
          label={t('shared.university')}
          placeholder={t('shared.universityPlaceholder')}
          optionFilterProp="label"
          col={24}
          allowClear
          showSearch
          message={!showManualUniversity ? t('signUp.universityError') : ''}
          required={!showManualUniversity}
          disabled={showManualUniversity}
          // @ts-ignore
          options={
            universityList?.map((uni) => ({
              // @ts-ignore
              label: uni.name, // Ensure label is always a string
              value: uni.id,
            })) || []
          }
        />

        <Form.Item name="customUniversity" valuePropName="checked">
          <Flex gap={10} style={{ cursor: 'pointer' }}>
            <Checkbox
              defaultChecked={showManualUniversity}
              onChange={handleCheckboxChange}
            >
              {t('shared.notListed')}
            </Checkbox>
          </Flex>
        </Form.Item>

        {showManualUniversity && (
          <InputFormItem
            name="university"
            col={24}
            label={t('shared.universityType')}
            placeholder={t('shared.universityTypePlaceholder')}
            message={t('signUp.universityTypeError')}
            inputType="text"
          />
        )}

        {/* <RangePicker defaultValue={dayjs('2015-01-01', 'YYYY-MM-DD')} /> */}
        <Flex justify="space-between">
          <DateFormItem
            col={11}
            label={t('signUp.startData')}
            name="university_end_date"
            format="month"
            mode="month"
            message={t('signUp.dateError')}
            formItemProps=""
          />

          <DateFormItem
            col={11}
            label={t('signUp.endData')}
            name="university_start_date"
            format="month"
            mode="month"
            message={t('signUp.dateError')}
            formItemProps=""
          />
        </Flex>
        <FormButtons {...formButtonsProps} />
      </Form>
    </div>
  );
}
