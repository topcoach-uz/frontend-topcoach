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
    debug: true, // Set to false in production
    lng: localStorage.getItem('i18nextLng') || 'en', // Load from localStorage
    backend: {
      loadPath: '/locales/{{lng}}.json', // Path to translation files
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
