import { Col, DatePicker, DatePickerProps, Form, FormItemProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'src/components/icons';
import { baseFormItemCol } from 'src/constants/form';
import useColors from 'src/hooks/useColors';

export type DateFormItemProps = DatePickerProps &
  FormItemProps & {
    col?: number;
    message?: string;
    format?: 'date' | 'month' | 'year';
    formItemProps?: FormItemProps;
  };

function DateFormItem({
  col = baseFormItemCol,
  name = 'date',
  label = 'Sana',
  message = 'Choose a date!',
  format = 'date',
  formItemProps,
  ...rest
}: DateFormItemProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Col span={col}>
      <Form.Item
        name={name}
        label={label}
        rules={!!message ? [{ required: true, message }] : []}
        {...formItemProps}
      >
        <DatePicker
          picker={format}
          placeholder={t('signUp.datePlaceholder')}
          style={{ width: '100%' }}
          suffixIcon={<CalendarIcon color={colors.colorTextBase} />}
          {...rest}
        />
      </Form.Item>
    </Col>
  );
}

export default DateFormItem;
