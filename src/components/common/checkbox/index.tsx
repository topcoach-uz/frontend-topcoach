import { Checkbox, CheckboxProps, ConfigProvider } from 'antd';
import { colors } from 'src/constants/theme';

interface Props extends CheckboxProps {
  size?: number;
}

function CustomCheckbox({ size = 28, ...rest }: Props) {
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 6,
          controlInteractiveSize: size,
          colorText: colors.textPrimary,
        },
        components: {
          Checkbox: {
            colorPrimary: colors.inputColor,
            colorPrimaryHover: colors.inputColor,
            colorBorder: colors.gray4,
            colorWhite: colors.textPrimary,
            colorBgTextActive: colors.primary,
          },
        },
      }}
    >
      <Checkbox {...rest} />
    </ConfigProvider>
  );
}

export default CustomCheckbox;
