import { Row } from 'antd';
import {
  DateFormItem,
  InputFormItem,
  SelectFormItem,
} from 'src/components/form';
import UploadFormItem from 'src/components/form/common/UploadFormItem';
import AvatarFormItem from './common/AvatarFormItem';
import FormError from './common/FormError';
import ImageFormItem from './common/ImageFormItem';
import RangePickerFormItem from './common/RangePickerFormItem';

interface Props {
  formItems: any;
  formError?: string;
  formGutter?: number;
}

export default function FormMaker({
  formItems,
  formError,
  formGutter = 24,
}: Props) {
  return (
    <>
      <Row gutter={formGutter}>
        {formItems.map((item: any) =>
          item.type === 'select' ? (
            <SelectFormItem
              col={formGutter}
              key={item.name}
              showSearch
              optionFilterProp="label"
              {...item}
            />
          ) : item.type == 'datePicker' ? (
            <DateFormItem col={formGutter} key={item.name} {...item} />
          ) : item.type == 'upload' ? (
            <UploadFormItem
              {...item}
              col={formGutter}
              key={item.name}
              beforeUpload={() => false}
            />
          ) : item.type == 'rangePicker' ? (
            <RangePickerFormItem {...item} key={item.name} />
          ) : item.type == 'imageUpload' ? (
            <ImageFormItem key={item.name} {...item} />
          ) : item.type == 'avatarUpload' ? (
            <AvatarFormItem key={item.name} {...item} />
          ) : (
            <InputFormItem
              col={item?.col || formGutter}
              key={item.name}
              {...item}
            />
          )
        )}
      </Row>
      <FormError formError={formError} />
    </>
  );
}
