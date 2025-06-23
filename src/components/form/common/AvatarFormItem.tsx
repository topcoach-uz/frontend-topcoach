import type { FormInstance, GetProp, UploadFile, UploadProps } from 'antd';
import { Form, Image, Upload } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { FormItemProps } from 'antd/lib';
import { useState } from 'react';
import { PlusSvg, SwapSvg } from 'src/components/icons';
import useColors from 'src/hooks/useColors';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// Helper function to normalize the value from Upload's onChange event
const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  // Handles event structure from Upload component
  // Ensures we always return the fileList, even if empty
  return e?.fileList;
};

interface AvatarFormItemProps
  extends Omit<UploadProps, 'fileList' | 'onChange' | 'maxCount'> {
  // Omit maxCount too as we set it internally
  col?: string;
  name: string;
  label?: string;
  message?: string;
  formItemProps?: Omit<
    FormItemProps,
    'name' | 'valuePropName' | 'getValueFromEvent'
  >;
  rules?: FormItemProps['rules'];
  form: FormInstance;
  uploadText?: string;
  replaceText?: string;
}

export default function AvatarFormItem({
  name,
  label,
  message,
  rules,
  formItemProps,
  form,
  uploadText = 'Upload',
  replaceText = 'Replace',
  ...rest // Pass remaining UploadProps (like listType, accept etc)
}: AvatarFormItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined
  );
  // Watch the value to conditionally render the button
  const fileListValue = useWatch(name, form) as UploadFile[] | undefined;
  const colors = useColors();

  const handlePreview = async (file: UploadFile) => {
    let previewUrl = file.url;
    if (!previewUrl && file.originFileObj) {
      try {
        // Generate preview only if necessary
        // Avoid re-assigning to file.preview directly if possible,
        // use the generated base64 string directly for the state.
        previewUrl = await getBase64(file.originFileObj as FileType);
      } catch (error) {
        console.error('Error generating base64 preview:', error);
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
      console.warn('Cannot preview file:', file);
    }
  };

  // Always prevent the Upload component's default upload behavior
  const handleBeforeUpload = () => {
    return false; // or Upload.LIST_IGNORE
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: 'none',
        cursor: 'pointer',
      }}
      type="button"
    >
      <PlusSvg color={colors.colorText} />
      <div style={{ marginTop: 8, color: colors.colorText }}>{uploadText}</div>
    </button>
  );

  const replaceButton = (
    <button
      style={{
        border: 0,
        background: 'none',
        cursor: 'pointer',
      }}
      type="button"
    >
      <SwapSvg color={colors.colorText} />
      <div style={{ color: colors.colorText }}>{replaceText}</div>
    </button>
  );

  return (
    <>
      <Form.Item
        name={name}
        label={label}
        required={!!message} // Set required based on message presence
        rules={[{ required: !!message, message }, ...(rules || [])]}
        valuePropName="fileList" // Bind to Upload's fileList
        getValueFromEvent={normFile} // Use normFile to extract fileList from onChange event
        className="form-item-avatar_upload"
        {...formItemProps}
      >
        <Upload
          accept="image/*" // Specify accepted file types
          listType="picture-circle"
          onPreview={handlePreview}
          action="" // Explicitly set action to prevent default POST
          beforeUpload={handleBeforeUpload} // Consistently prevent upload attempt
          maxCount={1} // IMPORTANT: Limits to one file and handles replacement in onChange's fileList
          showUploadList={{ showRemoveIcon: false }}
          {...rest} // Pass other Upload specific props
        >
          {/* Conditionally render button based on watched value */}
          {fileListValue && fileListValue.length >= 1
            ? replaceButton
            : uploadButton}
        </Upload>
      </Form.Item>

      {/* Use Ant Design's Image preview capability */}
      {/* The separate Image component for preview is less necessary */}
      {/* if Ant Design's built-in preview is sufficient. */}
      {/* Kept your original modal logic below for consistency */}
      {previewImage && (
        <Image
          // wrapperStyle={{ display: 'none' }} // Hide the placeholder image
          style={{ display: 'none' }} // Alternative way to hide placeholder
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) =>
              !visible && setPreviewImage(undefined), // Clean up preview state
            src: previewImage, // Source for the preview modal
          }}
          // No src needed here on the placeholder Image itself
        />
      )}
      {/* Consider removing the below Image component if AntD's default preview handled by onPreview is sufficient */}
      {/* It seems redundant with the onPreview={handlePreview} logic */}
      {/* If you keep it, ensure the src isn't causing issues */}
      {/* <Image
         width={200} // This might be rendering an unintended image
         preview={{ ... }} // Handled above
        // src={previewImage} // Potential issue: rendering image outside modal
       /> */}
    </>
  );
}
