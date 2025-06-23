import { Collapse, CollapseProps, ConfigProvider } from 'antd';
import { themeColors } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface Props extends CollapseProps {
  contentPadding?: string;
  headerPadding?: string;
}

function CustomCollapse({ contentPadding, headerPadding, ...rest }: Props) {
  const colors = useColors();
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 16,
        },
        components: {
          Collapse: {
            borderRadius: 30,
            // headerBg: colors.colorBgContainer,
            // headerBg: 'red !important',
            // contentBg: 'green !important',
            headerPadding: headerPadding || '16px 24px',
            contentPadding: contentPadding || '16px 24px',
          },
        },
      }}
    >
      <Collapse {...rest} />
    </ConfigProvider>
  );
}

export default CustomCollapse;
