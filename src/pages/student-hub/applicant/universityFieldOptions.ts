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
const TRAILING_PAREN = /\s*[([]((?:[^()[\]]|[([][^()[\]]*[)\]])*)[)\]]\s*$/;
const DEGREE_LABEL_TOKENS = new Set([
  "bsc", "ba", "bs", "beng", "bba", "llb", "mb", "chb", "mbchb", "mbbs", "bmus", "bfa", "bed", "barch", "bcom", "hons", "honours", "honors", "tripos",
  "bachelor", "bachelors", "degree", "and",
  "msc", "ma", "mba", "meng", "llm", "mphil", "mres", "mfa", "mpa", "mph", "ms",
]);

/** True when a bracket's content is only degree/award labels, e.g. "BSc (Hons)", "B.A./B.S.", "Tripos". */
function isDegreeLabel(content: string): boolean {
  const tokens = content.toLowerCase().replace(/\./g, "").split(/[\s/,&+\-–()]+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => DEGREE_LABEL_TOKENS.has(token));
}

/** Removes trailing brackets only while they are degree labels; other qualifiers stay part of the subject. */
function stripDegreeBrackets(value: string): string {
  let name = value;
  for (;;) {
    const match = TRAILING_PAREN.exec(name);
    if (!match || !isDegreeLabel(match[1])) return name;
    name = name.slice(0, match.index).trim();
  }
}
const DEGREE_PREFIX = /^(?:bachelor'?s?\s+(?:of\s+)?(?:science|arts|engineering|applied science|fine arts|business administration)?\s*(?:\(hons\.?\)\s*)?(?:in|degree in)?|b\.?\s?sc\.?|b\.?\s?eng\.?|b\.?\s?a\.?|b\.?\s?s\.?)\s+(?:in\s+)?/i;

const cleanSpaces = (value: string) => value.replace(ZERO_WIDTH, "").replace(/\s+/g, " ").trim();

export type SubjectDegreeType = "undergraduate" | "graduate";

const BACHELOR = /\b(?:bsc|b\.?sc|beng|b\.?eng|bachelor'?s?|bachelors)\b/i;
const MASTER_LABEL = "(?:mba|msc|m\\.?sc|ma|m\\.?a|meng|m\\.?eng|llm|mphil|mres|mfa|mpa|mph|ms|m\\.?s)";
const MASTER_PREFIX = new RegExp(`^(?:master'?s?\\s+(?:of\\s+)?(?:science|arts|engineering|business administration|laws)?\\s*(?:degree\\s+)?(?:in\\s+)?|${MASTER_LABEL}\\s+(?:in\\s+)?)(?=\\S)`, "i");
const MASTER_SUFFIX = new RegExp(`\\s*[-–,]?\\s*\\(?\\b${MASTER_LABEL}\\b\\)?\\s*$`, "i");
const MASTER_PAREN = new RegExp(`\\s*[([]\\s*(?:${MASTER_LABEL}|master'?s?[^)\\]]*)\\s*[)\\]]`, "gi");

/** Display form: zero-width stripped, qualifiers and degree prefixes removed. Empty when unusable. */
function subjectDisplay(raw: string, degree: SubjectDegreeType = "undergraduate"): string {
  let name = cleanSpaces(raw);
  if (!name || !isUsableUniversityFieldName(name)) return "";
  if (degree === "graduate") {
    // Master's labels are qualifiers on the subject, not a reason to drop it; bachelor-only labels are dropped.
    if (BACHELOR.test(name)) return "";
    name = name.replace(MASTER_PAREN, "").replace(MASTER_PREFIX, "").replace(MASTER_SUFFIX, "").trim();
    name = stripDegreeBrackets(name);
    return name && /[\p{L}\p{N}]/u.test(name) ? name : "";
  }
  if (GRAD.test(name)) return "";
  name = stripDegreeBrackets(name);
  name = name.replace(DEGREE_PREFIX, "").replace(/\s*[-–,]?\s*\(?\b(?:hons|honours)\b\.?\)?\s*$/i, "").trim();
  return name && /[\p{L}\p{N}]/u.test(name) ? name : "";
}

/** Normalised grouping key ("" when the name is not a usable undergraduate subject). */
export function subjectKey(raw: string, degree: SubjectDegreeType = "undergraduate"): string {
  const display = subjectDisplay(raw, degree);
  if (!display) return "";
  return display.toLowerCase().replace(/&|\+/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

export type UniversitySubjectOption = { value: string; label: string; variants: string[] };

export function buildUniversitySubjectOptions(majors: UniversityMajor[], degree: SubjectDegreeType = "undergraduate"): UniversitySubjectOption[] {
  const groups = new Map<string, Set<string>>();
  majors
    .filter((item) => item.type === degree)
    .map((item) => typeof item.name === "string" ? item.name : item.name?.en ?? "")
    .forEach((raw) => {
      const key = subjectKey(raw, degree);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(cleanSpaces(raw));
    });
  return [...groups.entries()].map(([value, set]) => {
    const variants = [...set].sort((a, b) => a.localeCompare(b));
    const display = new Map(variants.map((variant) => [variant, subjectDisplay(variant, degree)]));
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

/**
 * Finds the catalogue option that best matches a free-text major name (for example an AI Major Match
 * result). Exact subject key first, then the closest option that contains or is contained by it.
 * Returns undefined when nothing plausible exists, so callers can open Find universities unfiltered.
 */
export function matchSubjectOption<T extends { value: string }>(options: T[], majorName: string, degree: SubjectDegreeType = "undergraduate"): T | undefined {
  const key = subjectKey(majorName, degree);
  if (!key) return undefined;
  const exact = options.find((option) => option.value === key);
  if (exact) return exact;
  const padded = ` ${key} `;
  const related = options.filter((option) => option.value.length > 2 && (` ${option.value} `.includes(padded) || padded.includes(` ${option.value} `)));
  return related.sort((a, b) => Math.abs(a.value.length - key.length) - Math.abs(b.value.length - key.length))[0];
}
