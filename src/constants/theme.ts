export const themeFontSize = {
  fontSizeTitle1: 60,
  fontSizeTitle2: 48,
  fontSizeTitle3: 36,
  fontSizeTitle4: 24,
  fontSizeTitle5: 20,
  fontSizeTitle6: 18,
  fontSizeTitle7: 16,
  fontSizeTitle8: 14,
  fontSizeTitle9: 12,
};

export const themeFontWeight = {
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtrabold: 800,
  fontWeightBlack: 900,
};

export const themeColors: { light: IThemeColor; dark: IThemeColor } = {
  light: {
    colorPaymentActive: '#fef2f2',
    colorLink: '#1677FF',
    colorLinkHover: '#69B1FF',
    colorLinkActive: '#0958D9',
    colorIcon: 'rgba(0, 0, 0, 0.45)',
    colorIconHover: 'rgba(0, 0, 0, 0.88)',

    colorTextLight: '#FFFFFF',
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
    colorTextPlaceholder: 'rgba(0, 0, 0, 0.25)',
    colorTextDescription: 'rgba(0, 0, 0, 0.45)',
    colorTextHeading: 'rgba(0, 0, 0, 0.88)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextBase: '#000000',

    colorBgBase: '#FFFFFF',
    colorBgContainer: '#FFFFFF',
    // colorBgContainer: '#8b0000',
    colorBgContainerDark: '#26262C',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    colorBgTextHover: 'rgba(0, 0, 0, 0.06)',
    colorBgTextActive: 'rgba(0, 0, 0, 0.15)',
    colorBgContainerDisabled: 'rgba(0, 0, 0, 0.04)',
    colorBgHeroGradient: 'rgba(255, 255, 255, 0.8)',

    colorFill: 'rgba(0, 0, 0, 0.15)',
    colorFillSecondary: 'rgba(0, 0, 0, 0.06)',
    colorFillTertiary: 'rgba(0, 0, 0, 0.04)',
    colorFillQuaternary: 'rgba(0, 0, 0, 0.02)',
    colorFillContent: 'rgba(0, 0, 0, 0.06)',
    colorFillAlter: 'rgba(0, 0, 0, 0.02)',

    colorBorder: '#D9D9D9',
    colorBorderSecondary: '#F0F0F0',
    colorSplit: '#F0F0F0',

    controlItemBgHover: 'rgba(0, 0, 0, 0.04)',
    controlItemBgActive: '#E6F4FF',
    controlItemBgActiveHover: '#BAE0FF',

    colorPrimaryTextActive: '#000000',
    colorPrimaryText: '#222222',
    colorPrimaryTextHover: '#222222',

    // colorPrimaryActive: '#222222',
    // colorPrimary: '#222222',
    // colorPrimaryHover: '#333333',
    // colorPrimaryBorderHover: '#D9D9D9',
    // colorPrimaryBorder: '#E9E9E9',
    // colorPrimary: '#8b0000',

    colorPrimaryActive: '#8B0000', // Dark Red
    colorPrimary: '#8B0000', // Dark Red
    colorPrimaryHover: '#A90000', // Lighter Dark Red
    colorPrimaryBorderHover: '#E27B7B', // Light Red/Coral
    colorPrimaryBorder: '#D5A0A0', // Muted Light Red

    colorPrimaryBgHover: '#F5F5F5',
    colorPrimaryBg: '#F7F7F7',

    colorSecondaryTextActive: '#0D0004',
    colorSecondaryText: '#33010E',
    colorSecondaryTextHover: '#590618',
    colorSecondaryActive: '#800F24',
    colorSecondary: '#A61D31',
    colorSecondaryHover: '#B33B49',
    colorSecondaryBorderHover: '#BF5E66',
    colorSecondaryBorder: '#BF5E66',
    colorSecondaryBgHover: '#D9B0B0',
    colorSecondaryBg: '#E6D8D8',

    colorTertiaryActive: '#800F24',

    colorSuccessBg: '#F6FFED',
    colorSuccessBgHover: '#D9F7BE',
    colorSuccessBorder: '#B7EB8F',
    colorSuccessBorderHover: '#95DE64',
    colorSuccessHover: '#73D13D',
    colorSuccess: '#52C41A',
    colorSuccessActive: '#389E0D',
    colorSuccessTextHover: '#237804',
    colorSuccessText: '#135200',
    colorSuccessTextActive: '#092B00',

    colorWarningBg: '#FFFBE6',
    colorWarningBgHover: '#FFF1B8',
    colorWarningBorder: '#FFE58F',
    colorWarningBorderHover: '#FFD666',
    colorWarningHover: '#FFC53D',
    colorWarning: '#FAAD14',
    colorWarningActive: '#D48806',
    colorWarningTextHover: '#AD6800',
    colorWarningText: '#874D00',
    colorWarningTextActive: '#613400',

    colorErrorBg: '#FFF1F0',
    colorErrorBgHover: '#FFCCC7',
    colorErrorBorder: '#FFA39E',
    colorErrorBorderHover: '#FF7875',
    colorErrorHover: '#FF4D4F',
    colorError: '#F5222D',
    colorErrorActive: '#CF1322',
    colorErrorTextHover: '#A8071A',
    colorErrorText: '#820014',
    colorErrorTextActive: '#5C0011',

    cyan1: '#E6FFFB',
    cyan2: '#B5F5EC',
    cyan3: '#87E8DE',
    cyan4: '#5CDBD3',
    cyan5: '#36CFC9',
    cyan6: '#13C2C2',
    cyan7: '#08979C',
    cyan8: '#006D75',
    cyan9: '#00474F',
    cyan10: '#002329',

    blue1: '#E6F4FF',
    blue2: '#BAE0FF',
    blue3: '#91CAFF',
    blue4: '#69B1FF',
    blue5: '#4096FF',
    blue6: '#1677FF',
    blue7: '#0958D9',
    blue8: '#003EB3',
    blue9: '#002C8C',
    blue10: '#001D66',

    purple1: '#F9F0FF',
    purple2: '#EFDBFF',
    purple3: '#D3ADF7',
    purple4: '#B37FEB',
    purple5: '#9254DE',
    purple6: '#722ED1',
    purple7: '#531DAB',
    purple8: '#391085',
    purple9: '#22075E',
    purple10: '#120338',

    green1: '#F6FFED',
    green2: '#D9F7BE',
    green3: '#B7EB8F',
    green4: '#95DE64',
    green5: '#73D13D',
    green6: '#52C41A',
    green7: '#389E0D',
    green8: '#237804',
    green9: '#135200',
    green10: '#092B00',

    magenta1: '#FFF0F6',
    magenta2: '#FFD6E7',
    magenta3: '#FFADD2',
    magenta4: '#FF85C0',
    magenta5: '#F759AB',
    magenta6: '#EB2F96',
    magenta7: '#C41D7F',
    magenta8: '#9E1068',
    magenta9: '#780650',
    magenta10: '#520339',

    red1: '#FFF1F0',
    red2: '#FFCCC7',
    red3: '#FFA39E',
    red4: '#FF7875',
    red5: '#FF4D4F',
    red6: '#F5222D',
    red7: '#CF1322',
    red8: '#A8071A',
    red9: '#820014',
    red10: '#5C0011 ',

    orange1: '#FFF7E6',
    orange2: '#FFE7BA',
    orange3: '#FFD591',
    orange4: '#FFC069',
    orange5: '#FFA940',
    orange6: '#FA8C16',
    orange7: '#D46B08',
    orange8: '#AD4E00',
    orange9: '#873800',
    orange10: '#612500',

    yellow1: '#FEFFE6',
    yellow2: '#FFFFB8',
    yellow3: '#FFFB8F',
    yellow4: '#FFF566',
    yellow5: '#FFEC3D',
    yellow6: '#FADB14',
    yellow7: '#D4B106',
    yellow8: '#AD8B00',
    yellow9: '#876800',
    yellow10: '#614700',

    volcano1: '#FFF2E8',
    volcano2: '#FFD8BF',
    volcano3: '#FFBB96',
    volcano4: '#FF9C6E',
    volcano5: '#FF7A45',
    volcano6: '#FA541C',
    volcano7: '#D4380D',
    volcano8: '#AD2102',
    volcano9: '#871400',
    volcano10: '#610B00',

    geekblue1: '#F0F5FF',
    geekblue2: '#D6E4FF',
    geekblue3: '#ADC6FF',
    geekblue4: '#85A5FF',
    geekblue5: '#597EF7',
    geekblue6: '#2F54EB',
    geekblue7: '#1D39C4',
    geekblue8: '#10239E',
    geekblue9: '#061178',
    geekblue10: '#030852',

    lime1: '#FCFFE6',
    lime2: '#F4FFB8',
    lime3: '#EAFF8F',
    lime4: '#D3F261',
    lime5: '#BAE637',
    lime6: '#A0D911',
    lime7: '#7CB305',
    lime8: '#5B8C00',
    lime9: '#3F6600',
    lime10: '#254000',

    gold1: '#FFFBE6',
    gold2: '#FFF1B8',
    gold3: '#FFE58F',
    gold4: '#FFD666',
    gold5: '#FFC53D',
    gold6: '#FAAD14',
    gold7: '#D48806',
    gold8: '#AD6800',
    gold9: '#874D00',
    gold10: '#613400',
  },

  dark: {
    colorPaymentActive: '',
    colorLink: '#1668DC',
    colorLinkHover: '#15417E',
    colorLinkActive: '#1554AD',
    colorIcon: '#FFFFFF',
    colorIconHover: '#FFFFFF',

    colorTextLight: '#FFFFFF',
    colorTextDisabled: 'rgba(255, 255, 255, 0.25)',
    colorTextPlaceholder: 'rgba(255, 255, 255, 0.25)',
    colorTextDescription: 'rgba(255, 255, 255, 0.65)',
    colorTextHeading: 'rgba(255, 255, 255, 0.85)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextBase: '#FFFFFF',

    colorBgBase: '#131316',
    colorBgContainer: '#26262C',
    colorBgContainerDark: '#26262C',
    colorBgElevated: '#2F2F37',
    colorBgLayout: '#131316',
    colorBgSpotlight: '#50505D',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    colorBgTextHover: 'rgba(255, 255, 255, 0.06)',
    colorBgTextActive: 'rgba(255, 255, 255, 0.15)',
    colorBgContainerDisabled: 'rgba(255, 255, 255, 0.04)',
    colorBgHeroGradient: 'rgba(0, 0, 0, 0.4)',

    colorFill: 'rgba(255, 255, 255, 0.15)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.06)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.04)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.02)',
    colorFillContent: 'rgba(255, 255, 255, 0.06)',
    colorFillAlter: 'rgba(255, 255, 255, 0.02)',

    colorBorder: '#50505D',
    colorBorderSecondary: '#40404A',
    colorSplit: '#40404A',

    controlItemBgHover: 'rgba(0, 0, 0, 0.04)',
    controlItemBgActive: '#16122C',
    controlItemBgActiveHover: '#1D1545',

    colorPrimaryTextActive: '#1554AD',
    colorPrimaryText: '#1668DC',
    colorPrimaryTextHover: '#3C89E8',
    colorPrimaryActive: '#1554AD',
    colorPrimary: '#1668DC',
    colorPrimaryHover: '#3C89E8',
    colorPrimaryBorderHover: '#15417E',
    colorPrimaryBorder: '#15325B',
    colorPrimaryBgHover: '#112545',
    colorPrimaryBg: '#111A2C',

    colorSecondaryTextActive: '#1554AD',
    colorSecondaryText: '#1668DC',
    colorSecondaryTextHover: '#3C89E8',
    colorSecondaryActive: '#1554AD',
    colorSecondary: '#1668DC',
    colorSecondaryHover: '#3C89E8',
    colorSecondaryBorderHover: '#15417E',
    colorSecondaryBorder: '#15325B',
    colorSecondaryBgHover: '#112545',
    colorSecondaryBg: '#111A2C',

    colorTertiaryActive: '#800F24',

    colorSuccessBg: '#162312',
    colorSuccessBgHover: '#1D3712',
    colorSuccessBorder: '#274916',
    colorSuccessBorderHover: '#306317',
    colorSuccessHover: '#6ABE39',
    colorSuccess: '#49AA19',
    colorSuccessActive: '#3C8618',
    colorSuccessTextHover: '#6ABE39',
    colorSuccessText: '#49AA19',
    colorSuccessTextActive: '#3C8618',

    colorWarningBg: '#2B2111',
    colorWarningBgHover: '#443111',
    colorWarningBorder: '#594214',
    colorWarningBorderHover: '#7C5914',
    colorWarningHover: '#E8B339',
    colorWarning: '#D89614',
    colorWarningActive: '#AA7714',
    colorWarningTextHover: '#E8B339',
    colorWarningText: '#D89614',
    colorWarningTextActive: '#AA7714',

    colorErrorBg: '#2A1215',
    colorErrorBgHover: '#431418',
    colorErrorBorder: '#58181C',
    colorErrorBorderHover: '#791A1F',
    colorErrorHover: '#E84749',
    colorError: '#D32029',
    colorErrorActive: '#A61D24',
    colorErrorTextHover: '#E84749',
    colorErrorText: '#D32029',
    colorErrorTextActive: '#A61D24',

    cyan1: '#112123',
    cyan2: '#113536',
    cyan3: '#144848',
    cyan4: '#146262',
    cyan5: '#33BCB7',
    cyan6: '#13A8A8',
    cyan7: '#138585',
    cyan8: '#33BCB7',
    cyan9: '#13A8A8',
    cyan10: '#138585',

    blue1: '#151E2C',
    blue2: '#1A2C45',
    blue3: '#213B5B',
    blue4: '#284F7E',
    blue5: '#61A1E8',
    blue6: '#3983DC',
    blue7: '#3169AD',
    blue8: '#61A1E8',
    blue9: '#3983DC',
    blue10: '#3169AD',

    purple1: '#1D1727',
    purple2: '#2B1E3D',
    purple3: '#3A2751',
    purple4: '#4D316F',
    purple5: '#A374D6',
    purple6: '#7F4AC0',
    purple7: '#663E97',
    purple8: '#A374D6',
    purple9: '#7F4AC0',
    purple10: '#663E97',

    green1: '#162312',
    green2: '#1D3712',
    green3: '#274916',
    green4: '#306317',
    green5: '#6ABE39',
    green6: '#49AA19',
    green7: '#3C8618',
    green8: '#6ABE39',
    green9: '#49AA19',
    green10: '#3C8618',

    magenta1: '#291321',
    magenta2: '#40162F',
    magenta3: '#551C3B',
    magenta4: '#75204F',
    magenta5: '#E0529C',
    magenta6: '#CB2B83',
    magenta7: '#A02669',
    magenta8: '#E0529C',
    magenta9: '#CB2B83',
    magenta10: '#A02669',

    red1: '#2A1215',
    red2: '#431418',
    red3: '#58181C',
    red4: '#791A1F',
    red5: '#E84749',
    red6: '#D32029',
    red7: '#A61D24',
    red8: '#E84749',
    red9: '#D32029',
    red10: '#A61D24',

    orange1: '#2B1D11',
    orange2: '#442A11',
    orange3: '#593815',
    orange4: '#7C4A15',
    orange5: '#E89A3C',
    orange6: '#D87A16',
    orange7: '#AA6215',
    orange8: '#E89A3C',
    orange9: '#D87A16',
    orange10: '#AA6215',

    yellow1: '#2B2611',
    yellow2: '#443B11',
    yellow3: '#595014',
    yellow4: '#7C6E14',
    yellow5: '#E8D639',
    yellow6: '#D8BD14',
    yellow7: '#AA9514',
    yellow8: '#E8D639',
    yellow9: '#D8BD14',
    yellow10: '#AA9514',

    volcano1: '#2B1611',
    volcano2: '#441D12',
    volcano3: '#592716',
    volcano4: '#7C3118',
    volcano5: '#E87040',
    volcano6: '#D84A1B',
    volcano7: '#AA3E19',
    volcano8: '#E87040',
    volcano9: '#D84A1B',
    volcano10: '#AA3E19',

    geekblue1: '#131629',
    geekblue2: '#161D40',
    geekblue3: '#1C2755',
    geekblue4: '#203175',
    geekblue5: '#5273E0',
    geekblue6: '#2B4ACB',
    geekblue7: '#263EA0',
    geekblue8: '#5273E0',
    geekblue9: '#2B4ACB',
    geekblue10: '#263EA0',

    lime1: '#1F2611',
    lime2: '#2E3C10',
    lime3: '#3E4F13',
    lime4: '#536D13',
    lime5: '#A9D134',
    lime6: '#8BBB11',
    lime7: '#6F9412',
    lime8: '#A9D134',
    lime9: '#8BBB11',
    lime10: '#6F9412',

    gold1: '#2B2111',
    gold2: '#443111',
    gold3: '#594214',
    gold4: '#7C5914',
    gold5: '#E8B339',
    gold6: '#D89614',
    gold7: '#AA7714',
    gold8: '#E8B339',
    gold9: '#D89614',
    gold10: '#AA7714  ',
  },
};

export interface IThemeColor {
  colorPaymentActive: string;
  colorLink: string;
  colorLinkHover: string;
  colorLinkActive: string;
  colorIcon: string;
  colorIconHover: string;

  colorTextLight: string;
  colorTextDisabled: string;
  colorTextPlaceholder: string;
  colorTextDescription: string;
  colorTextHeading: string;
  colorTextQuaternary: string;
  colorTextTertiary: string;
  colorTextSecondary: string;
  colorText: string;
  colorTextBase: string;

  colorBgBase: string;
  colorBgContainer: string;
  colorBgContainerDark: string;
  colorBgElevated: string;
  colorBgLayout: string;
  colorBgSpotlight: string;
  colorBgMask: string;
  colorBgTextHover: string;
  colorBgTextActive: string;
  colorBgContainerDisabled: string;
  colorBgHeroGradient: string;

  colorFill: string;
  colorFillSecondary: string;
  colorFillTertiary: string;
  colorFillQuaternary: string;
  colorFillContent: string;
  colorFillAlter: string;

  colorBorder: string;
  colorBorderSecondary: string;
  colorSplit: string;

  controlItemBgHover: string;
  controlItemBgActive: string;
  controlItemBgActiveHover: string;

  colorPrimaryTextActive: string;
  colorPrimaryText: string;
  colorPrimaryTextHover: string;
  colorPrimaryActive: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryBorderHover: string;
  colorPrimaryBorder: string;
  colorPrimaryBgHover: string;
  colorPrimaryBg: string;

  colorSecondaryTextActive: string;
  colorSecondaryText: string;
  colorSecondaryTextHover: string;
  colorSecondaryActive: string;
  colorSecondary: string;
  colorSecondaryHover: string;
  colorSecondaryBorderHover: string;
  colorSecondaryBorder: string;
  colorSecondaryBgHover: string;
  colorSecondaryBg: string;

  colorTertiaryActive: string;

  colorSuccessBg: string;
  colorSuccessBgHover: string;
  colorSuccessBorder: string;
  colorSuccessBorderHover: string;
  colorSuccessHover: string;
  colorSuccess: string;
  colorSuccessActive: string;
  colorSuccessTextHover: string;
  colorSuccessText: string;
  colorSuccessTextActive: string;

  colorWarningBg: string;
  colorWarningBgHover: string;
  colorWarningBorder: string;
  colorWarningBorderHover: string;
  colorWarningHover: string;
  colorWarning: string;
  colorWarningActive: string;
  colorWarningTextHover: string;
  colorWarningText: string;
  colorWarningTextActive: string;

  colorErrorBg: string;
  colorErrorBgHover: string;
  colorErrorBorder: string;
  colorErrorBorderHover: string;
  colorErrorHover: string;
  colorError: string;
  colorErrorActive: string;
  colorErrorTextHover: string;
  colorErrorText: string;
  colorErrorTextActive: string;

  cyan1: string;
  cyan2: string;
  cyan3: string;
  cyan4: string;
  cyan5: string;
  cyan6: string;
  cyan7: string;
  cyan8: string;
  cyan9: string;
  cyan10: string;

  blue1: string;
  blue2: string;
  blue3: string;
  blue4: string;
  blue5: string;
  blue6: string;
  blue7: string;
  blue8: string;
  blue9: string;
  blue10: string;

  purple1: string;
  purple2: string;
  purple3: string;
  purple4: string;
  purple5: string;
  purple6: string;
  purple7: string;
  purple8: string;
  purple9: string;
  purple10: string;

  green1: string;
  green2: string;
  green3: string;
  green4: string;
  green5: string;
  green6: string;
  green7: string;
  green8: string;
  green9: string;
  green10: string;

  magenta1: string;
  magenta2: string;
  magenta3: string;
  magenta4: string;
  magenta5: string;
  magenta6: string;
  magenta7: string;
  magenta8: string;
  magenta9: string;
  magenta10: string;

  red1: string;
  red2: string;
  red3: string;
  red4: string;
  red5: string;
  red6: string;
  red7: string;
  red8: string;
  red9: string;
  red10: string;

  orange1: string;
  orange2: string;
  orange3: string;
  orange4: string;
  orange5: string;
  orange6: string;
  orange7: string;
  orange8: string;
  orange9: string;
  orange10: string;

  yellow1: string;
  yellow2: string;
  yellow3: string;
  yellow4: string;
  yellow5: string;
  yellow6: string;
  yellow7: string;
  yellow8: string;
  yellow9: string;
  yellow10: string;

  volcano1: string;
  volcano2: string;
  volcano3: string;
  volcano4: string;
  volcano5: string;
  volcano6: string;
  volcano7: string;
  volcano8: string;
  volcano9: string;
  volcano10: string;

  geekblue1: string;
  geekblue2: string;
  geekblue3: string;
  geekblue4: string;
  geekblue5: string;
  geekblue6: string;
  geekblue7: string;
  geekblue8: string;
  geekblue9: string;
  geekblue10: string;

  lime1: string;
  lime2: string;
  lime3: string;
  lime4: string;
  lime5: string;
  lime6: string;
  lime7: string;
  lime8: string;
  lime9: string;
  lime10: string;

  gold1: string;
  gold2: string;
  gold3: string;
  gold4: string;
  gold5: string;
  gold6: string;
  gold7: string;
  gold8: string;
  gold9: string;
  gold10: string;
}

// -------------------------------------
export const colors = {
  primary: '#0445b1',
  primaryLight: '#0c57a6',
  textPrimary: '#131d2d',
  gray: '#eef2f8',
  gray2: '#f4f7fb',
  gray3: '#e5e9ee',
  gray4: '#c3c9d2',
  gray5: '#9fa7b3',
  gray6: '#565b65',
  sliderColor: '#7384a0',
  inputColor: '#f7f9fb',
  red: '#d62020',
  blue: '#1c5bd5',
  black: '#000',
  // white: '#fff',
  info: '#0445b1',
  warning: '#997f21',
  success: '#21994a',
  danger: '#992121',
  white: '#fff',
};

export const shadows = {
  card: '0px 10px 20px 0px rgba(0, 0, 0, 0.06)',
};

export const flexStyles = {
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  flexWrap: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  flexRowCenter: {
    display: 'flex',
    alignItems: 'center',
  },
  flexColumnCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  flexRowSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  flexRowSpaceAround: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  flexRowSpaceEvenly: {
    display: 'flex',
    justifyContent: 'space-evenly',
  },
  flexColumnSpaceBetween: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  flexColumnSpaceAround: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  flexColumnSpaceEvenly: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  flexRowCenterSpaceBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexColumnCenterSpaceBetween: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexColumnCenterSpaceAround: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  flexColumnCenterSpaceEvenly: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  flexRowCenterSpaceAround: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  flexRowCenterSpaceEvenly: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  flexRowCenterWrap: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  flexColumnCenterWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  flexRowCenterSpaceBetweenWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  flexColumnCenterSpaceBetweenWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  flexColumnCenterSpaceAroundWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
};

export type MarginTypes = {
  m?: React.CSSProperties['margin'];
  mt?: React.CSSProperties['marginTop'];
  mb?: React.CSSProperties['marginBottom'];
  ml?: React.CSSProperties['marginLeft'];
  mr?: React.CSSProperties['marginRight'];
};

export type PaddingTypes = {
  p?: React.CSSProperties['padding'];
  pt?: React.CSSProperties['paddingTop'];
  pb?: React.CSSProperties['paddingBottom'];
  pl?: React.CSSProperties['paddingLeft'];
  pr?: React.CSSProperties['paddingRight'];
};
