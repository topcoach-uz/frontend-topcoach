import { FormInstance } from "antd";
import { Rule } from "antd/es/form";
import { FormItemProps } from "antd/lib";
import { HTMLInputTypeAttribute } from "react";

export interface IFormItemTypePart {
  name: string;
  label: string;
  type:
    | "upload"
    | "select"
    | "input"
    | "datePicker"
    | "rangePicker"
    | "imageUpload"
    | "avatarUpload"
    | "checkbox"
    | "button";
  rootClassName?: string;
  style?: React.CSSProperties;
  textarea?: boolean;
  message?: string;
  isFile?: boolean; // Optional flag for file upload inputs
  placeholder?: string;
  options?: Array<{ label: string; value: string }>; // Optional options for select inputs
  picker?: "date" | "week" | "year" | "month" | "quarter";
  mode?: "tags" | "multiple";
  form?: FormInstance;
  listType?: "text" | "picture" | "picture-card" | "picture-circle";
  maxCount?: number;
  col?: number;
  row?: number;
  filterOption?: boolean;
  showSearch?: boolean;
  htmlType?: HTMLInputTypeAttribute;
  inputType?: InputType;
  formItemProps?: FormItemProps;
  mask?: string;
  rules?: Rule[];
}

export type IFormItemType = IFormItemTypePart | undefined;

export type InputType =
  | "password"
  | "otp"
  | "mask"
  | "textarea"
  | "text"
  | "number";

// export interface IFormItemType extends CombinedProps {}

// type CombinedProps = SelectFormItemProps &
//   DateFormItemProps &
//   ImageFormItemProps &
//   UploadFormItemProps &
//   RangePickerFormItem &
//   InputFormItemProps;
