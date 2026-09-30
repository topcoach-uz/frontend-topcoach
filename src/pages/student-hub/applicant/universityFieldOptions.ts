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

export function buildUniversityFieldOptions(majors: UniversityMajor[]) {
  const names = majors
    .filter((item) => item.type === "undergraduate")
    .map((item) => typeof item.name === "string" ? item.name : item.name?.en ?? "")
    .map((name) => name.trim())
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
