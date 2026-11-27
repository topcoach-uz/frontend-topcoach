import type { ThemeConfig } from 'antd';

/**
 * antd theme for the student-facing app (auth, onboarding, /student-hub, /learning).
 * Applied by <StudentThemeProvider> as a nested ConfigProvider, so the mentor,
 * counselor and public areas keep the global theme (decision D1).
 *
 * Colours mirror the Sass tokens in src/styles/student-hub-design-system.scss
 * ($tc-colors). studentTheme.test.ts fails if they drift apart.
 */
const tc = {
  canvas: '#fbf9f6',
  surface: '#ffffff',
  surfaceTonal: '#f5f2ee',
  line: '#e7e2dc',
  lineStrong: '#d8d0c8',
  ink: '#221d1a',
  text: '#302b28',
  muted: '#6b625b',
  subtle: '#9a9089',
  brand: '#8b0000',
  brandHover: '#6e0000',
  brandPress: '#5a0000',
  blush: '#f7e6e4',
  blushStrong: '#f1d9d6',
  success: '#2f7a4b',
  successBg: '#eef5ef',
  warning: '#95580a',
  warningBg: '#fbf3e4',
  danger: '#b4372b',
  dangerBg: '#fdeceb',
  focus: 'rgba(139, 0, 0, 0.14)',
} as const;

const focusRing = `0 0 0 3px ${tc.focus}`;
const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';

export const studentTheme: ThemeConfig = {
  token: {
    fontFamily: "'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 16,

    colorPrimary: tc.brand,
    colorPrimaryHover: tc.brandHover,
    colorPrimaryActive: tc.brandPress,
    colorPrimaryBg: tc.blush,
    colorPrimaryBgHover: tc.blushStrong,
    colorPrimaryBorder: 'rgba(139, 0, 0, 0.24)',
    colorPrimaryBorderHover: tc.brand,
    colorPrimaryText: tc.brand,
    colorPrimaryTextHover: tc.brandHover,
    colorPrimaryTextActive: tc.brandPress,
    colorLink: tc.brand,
    colorLinkHover: tc.brandHover,
    colorLinkActive: tc.brandPress,

    colorTextBase: tc.text,
    colorText: tc.text,
    colorTextHeading: tc.ink,
    colorTextSecondary: tc.muted,
    colorTextTertiary: tc.muted,
    colorTextDescription: tc.muted,
    colorTextPlaceholder: tc.subtle,
    colorIcon: tc.muted,
    colorIconHover: tc.ink,

    colorBgLayout: tc.canvas,
    colorBgContainer: tc.surface,
    colorBgElevated: tc.surface,
    colorBorder: tc.line,
    colorBorderSecondary: tc.line,
    colorSplit: 'rgba(48, 43, 40, 0.08)',
    colorFillAlter: tc.surfaceTonal,

    controlItemBgHover: 'rgba(48, 43, 40, 0.04)',
    controlItemBgActive: tc.blush,
    controlItemBgActiveHover: tc.blushStrong,
    controlOutline: tc.focus,

    colorSuccess: tc.success,
    colorSuccessBg: tc.successBg,
    colorSuccessBorder: '#cfe3d4',
    colorWarning: tc.warning,
    colorWarningBg: tc.warningBg,
    colorWarningBorder: '#efdcb8',
    colorError: tc.danger,
    colorErrorBg: tc.dangerBg,
    colorErrorBorder: '#f3c9c5',
    colorInfo: tc.muted,
    colorInfoBg: tc.surfaceTonal,
    colorInfoBorder: tc.line,

    borderRadius: 12,
    borderRadiusLG: 20,
    borderRadiusSM: 8,

    motionEaseOut: ease,
    motionDurationFast: '0.12s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.32s',
  },
  components: {
    Button: {
      borderRadius: 999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      defaultBorderColor: tc.line,
      defaultColor: tc.text,
      defaultHoverBorderColor: tc.brand,
      defaultHoverColor: tc.brand,
    },
    Input: {
      borderRadius: 12,
      controlHeight: 40,
      activeBorderColor: tc.brand,
      hoverBorderColor: tc.lineStrong,
      activeShadow: focusRing,
    },
    InputNumber: {
      borderRadius: 12,
      activeBorderColor: tc.brand,
      hoverBorderColor: tc.lineStrong,
      activeShadow: focusRing,
    },
    DatePicker: {
      borderRadius: 12,
      controlHeight: 40,
      activeBorderColor: tc.brand,
      hoverBorderColor: tc.lineStrong,
      activeShadow: focusRing,
    },
    Select: {
      borderRadius: 12,
      optionSelectedBg: tc.blush,
      optionSelectedColor: tc.ink,
      optionActiveBg: 'rgba(48, 43, 40, 0.04)',
      // The focus ring colour comes from the global `controlOutline` token.
    },
    Tabs: {
      inkBarColor: tc.brand,
      itemColor: tc.muted,
      itemHoverColor: tc.ink,
      itemSelectedColor: tc.ink,
      itemActiveColor: tc.brandHover,
    },
    Segmented: {
      borderRadius: 999,
      borderRadiusSM: 999,
      borderRadiusLG: 999,
      trackBg: 'rgba(118, 107, 99, 0.09)',
      itemColor: tc.muted,
      itemHoverColor: tc.ink,
      itemSelectedBg: tc.surface,
      itemSelectedColor: tc.ink,
    },
    Pagination: { itemActiveBg: tc.blush },
    Tag: { defaultBg: tc.surfaceTonal, defaultColor: tc.text, borderRadiusSM: 999 },
    Progress: { defaultColor: tc.brand, remainingColor: 'rgba(48, 43, 40, 0.08)' },
    Badge: { colorError: tc.brand },
    Switch: { colorPrimary: tc.brand, colorPrimaryHover: tc.brandHover },
    Checkbox: { colorPrimary: tc.brand, colorPrimaryHover: tc.brandHover },
    Radio: { colorPrimary: tc.brand, buttonSolidCheckedBg: tc.brand, buttonSolidCheckedHoverBg: tc.brandHover },
    Modal: { borderRadiusLG: 24, contentBg: tc.surface, headerBg: tc.surface },
    Drawer: { colorBgElevated: tc.surface },
    Card: { borderRadiusLG: 20, colorBorderSecondary: tc.line },
    Alert: { borderRadiusLG: 14 },
    Collapse: { headerBg: 'transparent', contentBg: 'transparent' },
    Form: { labelFontSize: 14, itemMarginBottom: 16 },
  },
};
