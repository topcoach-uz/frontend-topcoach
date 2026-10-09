export const IELTS_BASE = "/student-hub/ielts-prep";

/** Adapt the preserved practice renderer's routes to TopCoach's router. */
export function toIeltsPath(path: string): string {
  if (path === IELTS_BASE || path === `${IELTS_BASE}/`) return "/";
  if (!path.startsWith(`${IELTS_BASE}/`)) return "/not-found";
  const relative = path.slice(IELTS_BASE.length);
  if (relative.startsWith("/practice/") || relative.startsWith("/vocabulary")) {
    return `/ielts${relative}`;
  }
  return relative;
}

export function toTopCoachPath(path: string): string {
  if (path === "/") return IELTS_BASE;
  if (path === "/settings/account")
    return "/student-hub?section=account&target=settings";
  if (path === "/privacy") return "/privacy-policy";
  if (path === "/terms") return "/terms-and-conditions";
  if (path.startsWith("/ielts/"))
    return `${IELTS_BASE}${path.slice("/ielts".length)}`;
  if (path.startsWith("/student-hub") || path === "/help") return path;
  return `${IELTS_BASE}${path}`;
}

export function ieltsStoragePrefix(userId: string): string {
  return `topcoach:ielts:v1:${encodeURIComponent(userId)}:`;
}
