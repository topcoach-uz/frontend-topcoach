type UniversityMajor = {
  name?: string | { en?: string | null } | null;
  type?: string | null;
};

export function isUsableUniversityFieldName(value: string): boolean {
  const name = value.trim();
  if (!name || name.length > 120) return false;
  if (/^[('"“”‘’\[]/.test(name) || /[:,]$/.test(name)) return false;
  if (/^(?:faculty|department|school|college|division)\s+(?:of|for)\b/i.test(name)) return false;
  if (/^department$/i.test(name)) return false;
  if (/^(?:includes?\b|and more\b)/i.test(name)) return false;
  if (/\bplease refer to (?:the )?official\b/i.test(name)) return false;
  return true;
}

const ZERO_WIDTH = /[\u200B-\u200F\u2060\uFEFF\u00AD]/g;
const GRAD = /\b(?:mba|msc|m\.?sc|ma|m\.?a|meng|llm|phd|ph\.?d|dphil|master'?s?|masters|doctor(?:ate)?)\b/i;
const TRAILING_PAREN = /\s*[([][^()[\]]*[)\]]\s*$/;
const DEGREE_PREFIX = /^(?:bachelor'?s?\s+(?:of\s+)?(?:science|arts|engineering|applied science|fine arts|business administration)?\s*(?:\(hons\.?\)\s*)?(?:in|degree in)?|b\.?\s?sc\.?|b\.?\s?eng\.?|b\.?\s?a\.?|b\.?\s?s\.?)\s+(?:in\s+)?/i;

const cleanSpaces = (value: string) => value.replace(ZERO_WIDTH, "").replace(/\s+/g, " ").trim();

/** Display form: zero-width stripped, qualifiers and degree prefixes removed. Empty when unusable. */
function subjectDisplay(raw: string): string {
  let name = cleanSpaces(raw);
  if (!name || GRAD.test(name) || !isUsableUniversityFieldName(name)) return "";
  while (TRAILING_PAREN.test(name)) name = name.replace(TRAILING_PAREN, "").trim();
  name = name.replace(DEGREE_PREFIX, "").replace(/\s*[-–,]?\s*\(?\b(?:hons|honours)\b\.?\)?\s*$/i, "").trim();
  return name && /[\p{L}\p{N}]/u.test(name) ? name : "";
}

/** Normalised grouping key ("" when the name is not a usable undergraduate subject). */
export function subjectKey(raw: string): string {
  const display = subjectDisplay(raw);
  if (!display) return "";
  return display.toLowerCase().replace(/&|\+/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

export type UniversitySubjectOption = { value: string; label: string; variants: string[] };

export function buildUniversitySubjectOptions(majors: UniversityMajor[]): UniversitySubjectOption[] {
  const groups = new Map<string, Set<string>>();
  majors
    .filter((item) => item.type === "undergraduate")
    .map((item) => typeof item.name === "string" ? item.name : item.name?.en ?? "")
    .forEach((raw) => {
      const key = subjectKey(raw);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(cleanSpaces(raw));
    });
  return [...groups.entries()].map(([value, set]) => {
    const variants = [...set].sort((a, b) => a.localeCompare(b));
    const display = new Map(variants.map((variant) => [variant, subjectDisplay(variant)]));
    const bracketless = variants.filter((variant) => display.get(variant) === variant);
    const pool = bracketless.length ? bracketless : variants.map((variant) => display.get(variant) as string);
    const label = [...pool].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    return { value, label, variants };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export function buildUniversityFieldOptions(majors: UniversityMajor[]) {
  const names = majors
    .filter((item) => item.type === "undergraduate")
    .map((item) => typeof item.name === "string" ? item.name : item.name?.en ?? "")
    .map((name) => cleanSpaces(name))
    .filter(isUsableUniversityFieldName);

  const uniqueNames = new Map<string, string>();
  names.forEach((name) => {
    const key = name.toLocaleLowerCase();
    if (!uniqueNames.has(key)) uniqueNames.set(key, name);
  });

  return [...uniqueNames.values()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: name, label: name }));
}
