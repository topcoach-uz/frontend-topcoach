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
      loadPath: '/locales/{{lng}}.json', // Path to translation files
      allowMultiLoading: false,
      requestOptions: {
        cache: 'no-cache',
      },
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  });

export default i18n;
