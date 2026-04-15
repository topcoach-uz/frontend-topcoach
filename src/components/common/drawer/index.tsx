import { ConfigProvider, Drawer, DrawerProps } from 'antd';
import { XCircle } from 'lucide-react';
import { colors } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface Props extends DrawerProps {
  bg?: string;
}

export default function CustomDrawer({ bg, ...rest }: Props) {
  const colors = useColors();

  return (
    <ConfigProvider
      theme={{
        token: {
          // colorBgElevated: bg || colors.dark_bg,
        },
        components: {
          Drawer: {},
        },
      }}
    >
      <Drawer
        closeIcon={<XCircle color={colors.colorText} size={16} />}
        {...rest}
      />
    </ConfigProvider>
  );
}
