import i18n from "i18next";

export function parseApplicantDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
}

export function displayApplicantDate(value?: string | null) {
  if (!value) return "Not set";
  const date = parseApplicantDate(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString(appLocale(), {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/** Dates follow the app's chosen language, not the browser's. */
function appLocale(): string {
  const lang = (i18n.language || "en").toLowerCase();
  if (lang.startsWith("ru")) return "ru-RU";
  if (lang.startsWith("uz")) return "uz-UZ";
  if (lang.startsWith("kk")) return "kk-KZ";
  return "en-GB";
}
