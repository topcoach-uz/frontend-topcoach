import { ConfigProvider } from 'antd';
import { PropsWithChildren } from 'react';
import { useTypedSelector } from 'src/app/store';
import useAntdProvider from './useAntdProvider';

function AntdProvider({ children }: PropsWithChildren) {
  const { colors, darkMode } = useTypedSelector((state) => state.layout);
  const { locale } = useAntdProvider();

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          ...colors,
        },
        components: {
          Input: {
            borderRadius: 12,
            controlHeight: 40,
            fontSize: 16,
            activeShadow: darkMode
              ? '0px 0px 0px 2px rgba(24, 144, 255, 0.20)'
              : '0px 0px 0px 2px rgba(51, 51, 51, 0.2)',
          },
          DatePicker: {
            borderRadius: 12,
            controlHeight: 40,
            fontSize: 15,
            paddingInline: 18,
          },
          Select: {
            // borderRadius: 12,
            // controlHeight: 44,
            // fontSize: 15,
            // optionPadding: '12px 118px',
            optionSelectedBg: colors.colorPrimary,
            optionSelectedColor: colors.colorTextLight,
          },
          Form: {
            labelFontSize: 14,
            itemMarginBottom: 16,
          },
          Breadcrumb: {
            // separatorColor: colors.black,
            // linkColor: colors.black,
            separatorMargin: 6,
            fontSize: 16,
          },
          Switch: {
            innerMaxMargin: 4,
            trackHeight: 16,
            trackMinWidth: 28,
            handleSize: 12,
          },
          Button: {
            borderRadius: 12,
            defaultColor: colors.colorText,
          },
          Collapse: {
            headerBg: colors.colorBgContainer,
            contentBg: 'transparent',
            paddingContentHorizontal: 0,
          },
          Steps: {
            descriptionMaxWidth: 64,
            dotSize: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default AntdProvider;
