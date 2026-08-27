declare const __LOCALE_VERSION__: string;

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  .use(HttpBackend) // Load translations from files
  .use(LanguageDetector) // Detect browser language
  .use(initReactI18next) // Bind to React
  .init({
    fallbackLng: 'en', // Default language
    debug: false, // Set to false in production
    lng: localStorage.getItem('i18nextLng') || 'en', // Load from localStorage
    backend: {
      // The locale files live in public/ so their names are NOT content-hashed.
      // `cache: 'no-cache'` used to force a revalidation on every single visit,
      // which meant re-downloading 237 KB (en) or 320 KB (ru) before any text
      // could render. Instead we let the browser cache them normally and bust
      // that cache with a build stamp, so a deploy still ships new strings.
      loadPath: `/locales/{{lng}}.json?v=${__LOCALE_VERSION__}`,
      allowMultiLoading: false,
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  });

export default i18n;
