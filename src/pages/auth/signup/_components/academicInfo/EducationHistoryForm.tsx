import { Button, Form, Space, Checkbox, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { InputFormItem, SelectFormItem } from 'src/components/form';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

interface EducationHistoryFormProps {
  form: any;
  name: string;
}

const DEGREE_OPTIONS = [
  { label: 'BA', value: 'BA' },
  { label: 'BS', value: 'BS' },
  { label: 'MA', value: 'MA' },
  { label: 'MS', value: 'MS' },
  { label: 'MBA', value: 'MBA' },
  { label: 'PhD', value: 'PhD' },
  { label: 'JD', value: 'JD' },
  { label: 'MD', value: 'MD' },
  { label: 'Other', value: 'Other' },
];

export default function EducationHistoryForm({
  form,
  name,
}: EducationHistoryFormProps) {
  const { t } = useTranslation();

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div>
          {fields.length === 0 && (
            <Button
              type="dashed"
              onClick={() => add({ order: 0 })}
              block
              icon={<PlusOutlined />}
            >
              {t('signUp.educationHistory.addEducation') || 'Add Education Entry'}
            </Button>
          )}
          {fields.map((field, index) => (
            <div
              key={field.key}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                position: 'relative',
              }}
            >
              {fields.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(field.name)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                  }}
                />
              )}
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <InputFormItem
                  name={[field.name, 'university']}
                  label={t('signUp.educationHistory.university') || 'University'}
                  placeholder={t('signUp.educationHistory.universityPlaceholder') || 'Enter university name'}
                  inputType="text"
                  col={24}
                  required
                />
                <SelectFormItem
                  name={[field.name, 'degree']}
                  label={t('signUp.educationHistory.degree') || 'Degree'}
                  placeholder={t('signUp.educationHistory.degreePlaceholder') || 'Select degree'}
                  options={DEGREE_OPTIONS}
                  col={24}
                  required
                />
                <InputFormItem
                  name={[field.name, 'major']}
                  label={t('signUp.educationHistory.major') || 'Major'}
                  placeholder={t('signUp.educationHistory.majorPlaceholder') || 'Enter major'}
                  inputType="text"
                  col={24}
                  required
                />
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => {
                    const prevIsCurrent = prevValues[name]?.[field.name]?.isCurrent;
                    const currentIsCurrent = currentValues[name]?.[field.name]?.isCurrent;
                    return prevIsCurrent !== currentIsCurrent;
                  }}
                >
                  {({ getFieldValue }) => {
                    const isCurrent = getFieldValue([name, field.name, 'isCurrent']) || false;
                    return (
                      <>
                        {!isCurrent && (
                          <Form.Item
                            name={[field.name, 'dateRange']}
                            label={t('signUp.educationHistory.dateRange') || 'Date Range'}
                            rules={[
                              {
                                required: !isCurrent,
                                message: t('signUp.educationHistory.dateRangeError') || 'Please select date range',
                              },
                            ]}
                          >
                            <RangePicker
                              picker="month"
                              format="YYYY-MM"
                              style={{ width: '100%' }}
                              onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                  const startDate = dates[0].format('YYYY-MM');
                                  const endDate = dates[1].format('YYYY-MM');
                                  form.setFieldValue([name, field.name, 'startDate'], startDate);
                                  form.setFieldValue([name, field.name, 'endDate'], endDate);
                                }
                              }}
                            />
                          </Form.Item>
                        )}
                        {isCurrent && (
                          <Form.Item
                            name={[field.name, 'startDate']}
                            label={t('signUp.educationHistory.startDate') || 'Start Date'}
                            rules={[
                              {
                                required: true,
                                message: t('signUp.educationHistory.startDateError') || 'Please select start date',
                              },
                            ]}
                          >
                            <DatePicker
                              picker="month"
                              format="YYYY-MM"
                              style={{ width: '100%' }}
                              onChange={(date) => {
                                if (date) {
                                  form.setFieldValue([name, field.name, 'startDate'], date.format('YYYY-MM'));
                                  form.setFieldValue([name, field.name, 'endDate'], undefined);
                                }
                              }}
                            />
                          </Form.Item>
                        )}
                      </>
                    );
                  }}
                </Form.Item>
                <Form.Item
                  name={[field.name, 'isCurrent']}
                  valuePropName="checked"
                >
                  <Checkbox>
                    {t('signUp.educationHistory.isCurrent') || 'Currently studying here'}
                  </Checkbox>
                </Form.Item>
              </Space>
            </div>
          ))}
          {fields.length > 0 && (
            <Button
              type="dashed"
              onClick={() => add({ order: fields.length })}
              block
              icon={<PlusOutlined />}
              style={{ marginTop: '8px' }}
            >
              {t('signUp.educationHistory.addEducation') || 'Add Another Education'}
            </Button>
          )}
        </div>
      )}
    </Form.List>
  );
}

