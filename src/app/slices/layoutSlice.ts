import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { language } from 'src/constants/storage';
import {
  IThemeColor,
  themeColors,
  themeFontSize,
  themeFontWeight,
} from 'src/constants/theme';
// import { isSidebarFixed } from 'src/static/constants';

export interface ILayoutState {
  language: string;
  collapsed?: boolean;
  darkMode: boolean;
  colors: IThemeColor;
  screenMode?: 'enter' | 'exit';
}

export const THEME_COLOR = 'TOP_COACH_THEME_COLOR';
export const LANGUAGE = 'i18nextLng';

export const isDarkTheme = localStorage.getItem(THEME_COLOR) === 'dark';
export const selectedLanguage = localStorage.getItem(LANGUAGE) || 'en';

const initialState: ILayoutState = {
  //   collapsed: isSidebarFixed ? true : false,
  language: selectedLanguage || 'en',
  darkMode: isDarkTheme,
  colors: isDarkTheme ? themeColors.dark : themeColors.light,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    changeCollapsed: (state) => {
      state.collapsed = !state.collapsed;
    },
    changeScreenMode: (
      state,
      action: PayloadAction<ILayoutState['screenMode']>
    ) => {
      state.screenMode = action.payload;
    },
    changeTheme: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload === 'light') {
        state.darkMode = false;
      } else if (action.payload === 'dark') {
        state.darkMode = true;
      } else {
        state.darkMode = !state.darkMode;
      }

      let cssColors: IThemeColor;

      if (state.darkMode) {
        localStorage.setItem(THEME_COLOR, 'dark');
        state.colors = themeColors.dark;
        cssColors = themeColors.dark;
      } else {
        localStorage.setItem(THEME_COLOR, 'light');
        state.colors = themeColors.light;
        cssColors = themeColors.light;
      }

      const styleElementId = 'theme-styles';
      let styleElement = document.getElementById(
        styleElementId
      ) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        document.head.appendChild(styleElement);
      }

      let cssVariables = '';

      for (const key in cssColors) {
        cssVariables += `--${key}: ${cssColors[key as keyof IThemeColor]};\n`;
      }

      for (const key in themeFontSize) {
        cssVariables += `--${key}: ${themeFontSize[key as keyof typeof themeFontSize]}px;\n`;
      }

      for (const key in themeFontWeight) {
        cssVariables += `--${key}: ${themeFontWeight[key as keyof typeof themeFontWeight]};\n`;
      }

      styleElement.textContent = `:root {\n${cssVariables}}`;
    },
    setTheme: (state) => {
      const styleElementId = 'theme-styles';
      let styleElement = document.getElementById(
        styleElementId
      ) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        document.head.appendChild(styleElement);
      }

      let cssColors: any;

      if (state.darkMode) {
        cssColors = themeColors.dark;
      } else {
        cssColors = themeColors.light;
      }

      let cssVariables = '';

      for (const key in cssColors) {
        cssVariables += `--${key}: ${cssColors[key]};\n`;
      }

      styleElement.textContent = `:root {\n${cssVariables}}`;
    },
  },
});

export const { changeCollapsed } = layoutSlice.actions;
export const { changeScreenMode } = layoutSlice.actions;
export const { changeTheme } = layoutSlice.actions;
export const { setTheme } = layoutSlice.actions;

export default layoutSlice.reducer;
