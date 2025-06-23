import { ConfigProvider, Select } from 'antd';
import { SelectProps } from 'antd/lib';

interface Props extends SelectProps {
  fontSize?: number;
  height?: number;
  borderRadius?: number;
}

export default function CustomSelect({
  fontSize,
  height = 40,
  borderRadius = 12,
  ...rest
}: Props) {
  return (
    <ConfigProvider
      theme={{
        token: {},
        components: {
          Select: {
            fontSize: fontSize ?? 15,
            borderRadius,
          },
        },
      }}
    >
      <Select style={{ height }} {...rest} />
    </ConfigProvider>
  );
}
