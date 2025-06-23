import { TranslationDto } from 'src/app/api/Api';
import i18n from './index';

export type SupportedLanguage = 'en' | 'ru' | 'kk' | 'uz';

/**
 * Safely extracts a translated string from a TranslationDto object
 */
export function getTranslation(
  translation: TranslationDto | string | null | undefined,
  fallbackLang: SupportedLanguage = 'en'
): string {
  if (!translation) return '';
  if (typeof translation === 'string') return translation;

  const currentLang = i18n.language as SupportedLanguage;

  if (translation[currentLang]) return translation[currentLang];
  if (translation[fallbackLang]) return translation[fallbackLang];

  // Try any available language
  const languages: SupportedLanguage[] = ['en', 'ru', 'kk', 'uz'];
  for (const lang of languages) {
    if (translation[lang]) return translation[lang];
  }

  return '';
}
