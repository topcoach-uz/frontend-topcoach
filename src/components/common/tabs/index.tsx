import { ConfigProvider, Tabs, TabsProps } from 'antd';
import { useTypedSelector } from 'src/app/store';

interface Props extends TabsProps {
  fontSize?: number;
  gap?: 50 | 30;
  inkBarColor?: string;
  margin?: number;
}

function CustomTabs({
  fontSize = 20,
  gap = 50,
  inkBarColor,
  margin = 16,
  ...rest
}: Props) {
  const { colors } = useTypedSelector((state) => state.layout);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colors.colorPrimary,
          colorPrimaryBorder: 'red',
          lineWidth: 2,
        },
        components: {
          Tabs: {
            fontSize,
            colorText: colors.colorText,
            inkBarColor: inkBarColor || colors.colorPrimary,
            horizontalItemGutter: gap,
            colorBorder: colors.colorPrimaryBg,
            margin: margin,
            verticalItemPadding: '0px',
            itemHoverColor: 'red',
            itemSelectedColor: 'yellow',
          },
        },
      }}
    >
      <Tabs {...rest} />
    </ConfigProvider>
  );
}

export default CustomTabs;
