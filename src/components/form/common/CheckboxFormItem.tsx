import { CheckboxProps, Col, Form, FormItemProps } from 'antd';
import { CustomCheckbox } from 'src/components/common';
import { baseFormItemCol } from 'src/constants/form';

type CombinedType = FormItemProps & CheckboxProps;

export interface Props extends CombinedType {
  col?: number;
  message?: string;
}

function CheckboxFormItem({
  col = baseFormItemCol,
  name,
  label,
  message,
  ...rest
}: Props) {
  return (
    <Col span={col}>
      <Form.Item
        name={name}
        rules={!!message ? [{ required: true, message }] : []}
        valuePropName="checked"
      >
        <CustomCheckbox {...rest}>{label}</CustomCheckbox>
      </Form.Item>
    </Col>
  );
}

export default CheckboxFormItem;
