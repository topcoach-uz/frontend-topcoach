import { Col, Form, Upload } from "antd";
import { FormItemProps, UploadProps } from "antd/lib";
import { DocumentUpload } from "iconsax-react";
import { useState } from "react";
import { CustomButton } from "src/components/common";
import { colors } from "src/constants/theme";

interface Props {
  title?: string;
  reUploadTitle?: string;
}

export type UploadFormItemProps = UploadProps &
  Props &
  FormItemProps & {
    col?: number;
    message?: string;
    label?: string;
    formItemProps?: FormItemProps;
  };

export default function UploadFormItem({
  col,
  label,
  message,
  formItemProps,
  title = "Click to Upload",
  reUploadTitle = "Re-upload",
  ...rest
}: UploadFormItemProps) {
  const [buttonTitle, setButtonTitle] = useState(title);

  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.fileList.length > 0) {
      setButtonTitle(reUploadTitle);
    } else {
      setButtonTitle(title);
    }
  };

  return (
    <Col span={col}>
      <Form.Item
        name={rest.name}
        label={label}
        rules={[{ required: !!message, message }]}
        shouldUpdate
        {...formItemProps}
      >
        <Upload
          {...rest}
          beforeUpload={() => false}
          onChange={handleChange}
        >
          <CustomButton
            type="primary"
            icon={<DocumentUpload size="24" color={colors.white} />}
          >
            {buttonTitle}
          </CustomButton>
        </Upload>
      </Form.Item>
    </Col>
  );
}
