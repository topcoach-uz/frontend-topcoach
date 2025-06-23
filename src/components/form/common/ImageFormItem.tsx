import { PlusOutlined } from '@ant-design/icons';
import {
  Col,
  Form,
  FormInstance,
  FormItemProps,
  Image,
  Upload,
  UploadFile,
  UploadProps,
} from 'antd';
import { useEffect, useState } from 'react';
import { baseFormItemCol } from 'src/constants/form';
import { colors } from 'src/constants/theme';
import { FileType, getBase64 } from 'src/utils';

type CombinedType = FormItemProps & UploadProps;

export interface ImageFormItemProps extends CombinedType {
  col?: number;
  message?: string;
  form: FormInstance<any>;
  uploadText?: string;
  uploadVisibleInMaxCount?: boolean;
  formItemProps?: FormItemProps;
}

function ImageFormItem({
  col = baseFormItemCol,
  name,
  label,
  message,
  maxCount = 1,
  form,
  uploadText = 'Upload',
  uploadVisibleInMaxCount = false,
  formItemProps,
  ...rest
}: ImageFormItemProps) {
  // Upload image
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(
    form.getFieldValue(name) || []
  );

  useEffect(() => {
    setFileList(form.getFieldValue(name));
  }, [form.getFieldValue(name)]);

  const handlePreview = async (file: UploadFile) => {
    if (!file?.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType);
    }

    setPreviewImage(file?.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    form.setFieldsValue({ [name]: newFileList });
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none', width: 102 }} type="button">
      <PlusOutlined style={{ color: colors.white }} />
      <div style={{ marginTop: 8, color: colors.white }}>{uploadText}</div>
    </button>
  );

  return (
    <Col span={col}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required: !!message, message }]}
        className="form-item-image"
        valuePropName="fileList"
        {...formItemProps}
      >
        <Upload
          listType="picture-card"
          fileList={fileList}
          onPreview={handlePreview}
          onChange={handleChange}
          beforeUpload={() => false}
          maxCount={maxCount}
          accept="image/*"
          {...rest}
        >
          {!(!uploadVisibleInMaxCount && fileList?.length >= maxCount) &&
            uploadButton}
        </Upload>
      </Form.Item>

      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
    </Col>
  );
}

export default ImageFormItem;
