import { theme, type ThemeConfig } from 'antd';

/** Shared Ant Design theme for admin shell + portaled surfaces (drawers, modals). */
export function getAdminConsoleAntdTheme(): ThemeConfig {
  return {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#10b981',
      colorLink: '#5eead4',
      colorLinkHover: '#99f6e4',
      colorBgContainer: '#252a35',
      colorBgElevated: '#2d3340',
      colorBgLayout: '#1c1f28',
      colorBorder: 'rgba(255,255,255,0.1)',
      colorBorderSecondary: 'rgba(255,255,255,0.06)',
      colorText: '#f4f4f5',
      colorTextSecondary: '#d1d5e0',
      colorTextTertiary: '#a8b4c8',
      colorTextQuaternary: '#8b96ab',
      colorFillSecondary: 'rgba(255,255,255,0.08)',
      colorFillTertiary: 'rgba(255,255,255,0.05)',
      borderRadiusLG: 12,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    },
    components: {
      Table: {
        headerBg: '#202531',
        headerColor: '#c5cad6',
        rowHoverBg: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(255,255,255,0.08)',
      },
      Card: {
        colorBgContainer: '#252a35',
        headerFontSize: 15,
        colorTextHeading: '#f4f4f5',
      },
      Button: {
        defaultColor: '#e5e7eb',
        defaultBorderColor: 'rgba(255,255,255,0.18)',
        defaultHoverBg: 'rgba(255,255,255,0.08)',
        defaultHoverColor: '#fff',
        defaultHoverBorderColor: 'rgba(255,255,255,0.28)',
        colorTextDisabled: 'rgba(255,255,255,0.35)',
      },
      Typography: {
        colorTextSecondary: '#d1d5e0',
        colorTextDescription: '#a8b4c8',
      },
      Alert: {
        colorInfo: '#38bdf8',
        colorInfoBorder: 'rgba(56, 189, 248, 0.45)',
        colorInfoBg: 'rgba(56, 189, 248, 0.12)',
      },
      Select: {
        optionSelectedBg: 'rgba(16, 185, 129, 0.2)',
        selectorBg: '#2d3340',
        colorTextPlaceholder: '#a8b4c8',
        colorBgElevated: '#252a35',
      },
      Input: {
        activeBorderColor: '#10b981',
        hoverBorderColor: 'rgba(16, 185, 129, 0.5)',
        colorTextPlaceholder: '#a8b4c8',
      },
      DatePicker: {
        colorBgContainer: '#2d3340',
        colorTextPlaceholder: '#a8b4c8',
        colorBgElevated: '#252a35',
        cellHoverBg: 'rgba(16, 185, 129, 0.12)',
        cellActiveWithRangeBg: 'rgba(16, 185, 129, 0.18)',
      },
      Modal: {
        contentBg: '#252a35',
        headerBg: '#252a35',
        titleColor: '#f4f4f5',
        titleFontSize: 16,
        colorIcon: '#a8b4c8',
        colorIconHover: '#f4f4f5',
      },
      Empty: {
        colorText: '#d1d5e0',
        colorTextDisabled: '#a8b4c8',
      },
      Breadcrumb: {
        itemColor: '#9aa3b2',
        lastItemColor: '#f4f4f5',
        linkColor: '#9aa3b2',
        linkHoverColor: '#5eead4',
        separatorColor: '#6b7280',
      },
      Pagination: {
        itemActiveBg: 'rgba(16, 185, 129, 0.2)',
      },
    },
  };
}
