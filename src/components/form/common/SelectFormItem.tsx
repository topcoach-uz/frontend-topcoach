import { Col, Form, FormItemProps, Select, SelectProps } from 'antd';
import { ArrowDownIcon } from 'src/components/icons';
import { baseFormItemCol } from 'src/constants/form';
import '../form_item.scss';
import useColors from 'src/hooks/useColors';
import CustomSelect from 'src/components/common/select';

type CombinedType = FormItemProps & SelectProps;

export interface SelectFormItemProps extends CombinedType {
  col?: number;
  message?: string;
  formItemProps?: FormItemProps;
}

function SelectFormItem({
  col = baseFormItemCol,
  name,
  label,
  message,
  placeholder,
  disabled,
  onChange,
  options,
  formItemProps,
  ...rest
}: SelectFormItemProps) {
  const colors = useColors();

  return (
    <Col span={col}>
      <Form.Item
        name={name}
        label={label}
        rules={!!message ? [{ required: true, message }] : []}
        {...formItemProps}
      >
        <CustomSelect
          placeholder={placeholder}
          allowClear
          options={options}
          onChange={onChange}
          disabled={disabled}
          suffixIcon={<ArrowDownIcon color={colors.colorText} />}
          {...rest}
        />
      </Form.Item>
    </Col>
  );
}

export default SelectFormItem;
