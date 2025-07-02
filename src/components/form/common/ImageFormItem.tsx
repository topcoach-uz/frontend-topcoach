import { PlusOutlined } from "@ant-design/icons";
import type {
  FormInstance,
  GetProp,
  UploadFile,
  UploadProps,
} from "antd";
import { Col, Form, FormItemProps, Image, Upload } from "antd";
import { useWatch } from "antd/es/form/Form";
import { useState } from "react";
import { baseFormItemCol } from "src/constants/form";
import { colors } from "src/constants/theme";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// Helper function to normalize the value from Upload's onChange event
const normFile = (e: unknown): UploadFile[] => {
  if (Array.isArray(e)) {
    return e;
  }
  return (e as { fileList?: UploadFile[] })?.fileList || [];
};

type CombinedType = FormItemProps & UploadProps;

export interface ImageFormItemProps
  extends Omit<CombinedType, "fileList" | "onChange"> {
  col?: number;
  message?: string;
  form: FormInstance;
  uploadText?: string;
  uploadVisibleInMaxCount?: boolean;
  formItemProps?: Omit<
    FormItemProps,
    "name" | "valuePropName" | "getValueFromEvent"
  >;
}

function ImageFormItem({
  col = baseFormItemCol,
  name,
  label,
  message,
  maxCount = 1,
  form,
  uploadText = "Upload",
  uploadVisibleInMaxCount = false,
  formItemProps,
  ...rest
}: ImageFormItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<
    string | undefined
  >(undefined);
  // Watch the value to conditionally render the button
  const fileListValue = useWatch(name, form) as
    | UploadFile[]
    | undefined;

  const handlePreview = async (file: UploadFile) => {
    let previewUrl = file.url;
    if (!previewUrl && file.originFileObj) {
      try {
        // Generate preview only if necessary
        previewUrl = await getBase64(file.originFileObj as FileType);
      } catch (error) {
        console.error("Error generating base64 preview:", error);
        return;
      }
    } else if (!previewUrl && file.preview) {
      // Fallback to existing preview string if already generated elsewhere
      previewUrl = file.preview as string;
    }

    if (previewUrl) {
      setPreviewImage(previewUrl);
      setPreviewOpen(true);
    } else {
      console.warn("Cannot preview file:", file);
    }
  };

  // Prevent the Upload component's default upload behavior
  const handleBeforeUpload = () => {
    return false; // or Upload.LIST_IGNORE
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
        width: 102,
        cursor: "pointer",
      }}
      type="button"
    >
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>{uploadText}</div>
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
        getValueFromEvent={normFile} // Use normFile to extract fileList from onChange event
        {...formItemProps}
      >
        <Upload
          listType="picture-card"
          onPreview={handlePreview}
          beforeUpload={handleBeforeUpload}
          maxCount={maxCount}
          accept="image/*"
          action="" // Explicitly set action to prevent default POST
          {...rest}
        >
          {!(
            !uploadVisibleInMaxCount &&
            (fileListValue || []).length >= maxCount
          ) && uploadButton}
        </Upload>
      </Form.Item>

      {previewImage && (
        <Image
          style={{ display: "none" }} // Hide the placeholder image
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) =>
              !visible && setPreviewImage(undefined), // Clean up preview state
            src: previewImage, // Source for the preview modal
          }}
        />
      )}
    </Col>
  );
}

export default ImageFormItem;
