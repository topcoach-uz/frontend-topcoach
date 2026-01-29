import { TranslationDto } from "src/app/api/Api";

export function getLocalizedText(
  text: string | null | TranslationDto,
  currentLanguage: string
): string {
  if (!text) return "";

  if (typeof text === "string") {
    return text;
  }

  // If it's a TranslationDto, get the text for the current language
  const locale = currentLanguage as keyof TranslationDto;
  return text[locale] || text.en || "";
}
