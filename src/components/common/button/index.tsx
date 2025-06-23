import { Button, ButtonProps, ConfigProvider } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { MarginTypes, PaddingTypes, themeColors } from 'src/constants/theme';

type CombinedProps = ButtonProps & MarginTypes & PaddingTypes;

export interface CustomButtonProps extends CombinedProps {
  bg?: string;
  width?: React.CSSProperties['width'];
  height?: number;
  borderColor?: React.CSSProperties['borderColor'];
  textColor?: React.CSSProperties['color'];
  darkMode?: boolean;
}

export default function CustomButton({
  bg,
  width,
  height = 40,
  textColor,
  m,
  mt,
  mb,
  ml,
  mr,
  p,
  pt,
  pb,
  pl,
  pr,
  style,
  type,
  darkMode,
  ...rest
}: CustomButtonProps) {
  const { colors, darkMode: isDark } = useTypedSelector(
    (state) => state.layout
  );
  // If the darkMode prop is not provided, use the darkMode from the store
  darkMode = darkMode ?? isDark;

  return type == 'link' ? (
    <ConfigProvider>
      <Button
        type={type}
        style={{
          width,
          height,
          margin: m,
          marginTop: mt,
          marginBottom: mb,
          marginLeft: ml,
          marginRight: mr,
          padding: p,
          paddingTop: pt,
          paddingBottom: pb,
          paddingLeft: pl,
          paddingRight: pr,
          ...style,
        }}
        {...rest}
      />
    </ConfigProvider>
  ) : (
    <ConfigProvider
      theme={{
        token: darkMode
          ? {
              ...themeColors.dark,
              colorBgBase: bg,
            }
          : {
              ...themeColors.light,
            },
        components: {
          Button: {
            controlHeight: height || 40,
            paddingContentHorizontal: 30,
            colorText: textColor ?? colors.colorText,
            defaultColor: textColor ?? colors.colorText,
          },
        },
      }}
    >
      <Button
        type={type}
        style={{
          width,
          margin: m,
          marginTop: mt,
          marginBottom: mb,
          marginLeft: ml,
          marginRight: mr,
          padding: p,
          paddingTop: pt,
          paddingBottom: pb,
          paddingLeft: pl,
          paddingRight: pr,
          ...style,
        }}
        {...rest}
      />
    </ConfigProvider>
  );
}
