// Date formatting utilities for the Student Hub
import i18n from '../lib/i18n';

// Locale mapping for toLocaleDateString
const localeMap: { [key: string]: string } = {
  en: 'en-US',
  ru: 'ru-RU',
  uz: 'uz-UZ',
  kk: 'ru-RU', // Use Russian locale for Karakalpak as fallback
};

export const formatDateTime = (dateString: string | Date, locale?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const lang = locale || i18n.language || 'en';
  const mappedLocale = localeMap[lang] || 'en-US';
  
  return date.toLocaleDateString(mappedLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateString: string | Date, locale?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const lang = locale || i18n.language || 'en';
  const mappedLocale = localeMap[lang] || 'en-US';
  
  return date.toLocaleDateString(mappedLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (dateString: string | Date, locale?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const lang = locale || i18n.language || 'en';
  const mappedLocale = localeMap[lang] || 'en-US';
  
  return date.toLocaleDateString(mappedLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTimeShort = (dateString: string | Date, locale?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const lang = locale || i18n.language || 'en';
  const mappedLocale = localeMap[lang] || 'en-US';
  
  return date.toLocaleDateString(mappedLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeAgo = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

/**
 * Formats a date string or Date object to a locale-specific date string.
 * Uses the provided locale or falls back to the current i18n language.
 * @param dateString The date string or Date object to format.
 * @param locale The locale to use for formatting (e.g., 'en-US', 'ru-RU', 'uz-UZ'). Defaults to i18n.language.
 * @param options Intl.DateTimeFormatOptions for formatting.
 * @returns Formatted date string.
 */
export const formatLocaleDate = (
  dateString: string | Date,
  locale: string = i18n.language,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return '';

  // Map i18n language codes to standard locale codes if necessary
  const effectiveLocale = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'uz': 'uz-UZ', // Uzbek (Latin)
    'kk': 'ru-RU', // Karakalpak often uses Russian locale for date formatting
  }[locale] || locale || 'en-US';

  return date.toLocaleDateString(effectiveLocale, options);
};