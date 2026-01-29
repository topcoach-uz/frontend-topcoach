import {
  Col,
  DatePicker,
  Form,
  FormItemProps,
  TimeRangePickerProps,
} from 'antd';
import { CalendarIcon } from 'src/components/icons';
import { baseFormItemCol } from 'src/constants/form';

type RangePickerFormItem = TimeRangePickerProps &
  FormItemProps & {
    col?: number;
    message?: string;
    format?: 'date' | 'month' | 'year';
    formItemProps?: FormItemProps;
  };

function RangePickerFormItem({
  col = baseFormItemCol,
  name = 'date',
  label = 'Sana',
  message = 'Sanani tanlang!',
  format = 'date',
  formItemProps,
  ...rest
}: RangePickerFormItem) {
  const { RangePicker } = DatePicker;
  return (
    <Col span={col}>
      <Form.Item
        name={name}
        label={label}
        rules={!!message ? [{ required: true, message }] : []}
        {...formItemProps}
      >
        <RangePicker
          picker={format}
          style={{ width: '100%' }}
          suffixIcon={<CalendarIcon color="rgba(255,255,255,0.7)" />}
          {...rest}
        />
      </Form.Item>
    </Col>
  );
}

export default RangePickerFormItem;
