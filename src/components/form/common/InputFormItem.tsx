import { Col, Form, FormItemProps, Input, InputNumber, InputProps } from 'antd';
import { MaskedInput } from 'antd-mask-input';
import {
  MaskedInputProps,
  MaskType,
} from 'antd-mask-input/build/main/lib/MaskedInput';
import { OTPProps } from 'antd/es/input/OTP';
import { InputNumberProps } from 'antd/lib';
import { PickerProps } from 'antd/lib/date-picker/generatePicker';
import '../form_item.scss';
import { InputType } from '../type';

type CombinedType = FormItemProps &
  InputProps &
  OTPProps &
  Partial<MaskedInputProps> &
  PickerProps;

export interface InputFormItemProps extends CombinedType {
  textarea?: boolean;
  password?: boolean;
  otp?: boolean;
  datePicker?: boolean;
  options?: any[];
  col?: number;
  message?: string;
  row?: number;
  isFile?: boolean;
  isMultiple?: boolean;
  formItemProps?: FormItemProps;
  htmlType?: string;
  inputType: InputType;
}

function InputFormItem({
  col = 24,
  name,
  label,
  message,
  mask,
  row = 2,
  placeholder,
  rules,
  formItemProps,
  htmlType,
  inputType,
  ...rest
}: InputFormItemProps) {
  return (
    <Col span={col}>
      <Form.Item
        name={name}
        label={label}
        required={!!message}
        rules={[{ required: !!message, message }, ...(rules || [])]}
        {...formItemProps}
      >
        {inputType == 'password' ? (
          <Input.Password type={htmlType} placeholder={placeholder} {...rest} />
        ) : inputType == 'otp' ? (
          <div className="form-item-input-otp">
            <Input.OTP length={5} {...rest} />
          </div>
        ) : inputType == 'textarea' ? (
          <Input.TextArea placeholder={placeholder} rows={row} />
        ) : inputType == 'mask' ? (
          <MaskedInput
            type={htmlType}
            className="form-item-input-mask"
            mask={mask as MaskType}
            {...rest}
          />
        ) : inputType == 'text' ? (
          <Input type={htmlType} placeholder={placeholder} {...rest} />
        ) : inputType == 'number' ? (
          <InputNumber type={htmlType} {...(rest as InputNumberProps)} />
        ) : (
          'Invalid inputType'
        )}
      </Form.Item>
    </Col>
  );
}

export default InputFormItem;
