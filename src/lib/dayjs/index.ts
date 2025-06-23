import dayjs from 'dayjs';
import i18n from '../i18n';

// Import all dayjs locales
import 'dayjs/locale/en';
import 'dayjs/locale/ru';
import 'dayjs/locale/uz-latn';
import '../../../src/locales/dayjs-kaa.js'; // Custom Karakalpak locale

// Locale mapping
const localeMap: { [key: string]: string } = {
  en: 'en',
  ru: 'ru',
  uz: 'uz-latn',
  kk: 'kaa', // Custom Karakalpak locale
};

// Set initial dayjs locale based on current i18n language
const setDayjsLocale = (language: string) => {
  const dayjsLocale = localeMap[language] || 'en';
  dayjs.locale(dayjsLocale);
};

// Set initial locale
setDayjsLocale(i18n.language);

// Listen for language changes and update dayjs locale accordingly
i18n.on('languageChanged', (language: string) => {
  setDayjsLocale(language);
});

export default dayjs;
export { setDayjsLocale };
