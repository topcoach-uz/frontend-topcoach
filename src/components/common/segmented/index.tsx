import { ConfigProvider, Segmented, SegmentedProps } from 'antd';
import { colors } from 'src/constants/theme';

interface Props extends Omit<SegmentedProps, 'ref'> {
  colorText?: string;
  colorTextLabel?: string;
  itemSelectedBg?: string;
}

export default function CustomSegmented({
  colorText = colors.white,
  colorTextLabel = colors.white,
  itemSelectedBg = colors.primary,
  ...rest
}: Props) {
  return (
    <ConfigProvider
      theme={{
        token: {},
        components: {
          Segmented: {
            controlHeight: 44,
            colorText,
            colorTextLabel,
            colorPrimaryTextHover: colorTextLabel,
            itemSelectedBg,
          },
        },
      }}
    >
      <Segmented {...rest} />
    </ConfigProvider>
  );
}
