import type { YouthLeadersDraft } from './types';

export const SUBMISSIONS_STORAGE_KEY = 'topcoach_youth_leaders_submissions';

export type YouthLeadersApplicationStatus = 'pending' | 'approved' | 'rejected';

/** Base64 (no data: prefix) + metadata — stored on submit for admin download (mock until backend). */
export interface StoredSubmissionFile {
  base64: string;
  mime: string;
  name: string;
}

export interface YouthLeadersSubmissionAttachments {
  idPhoto?: StoredSubmissionFile;
  portrait?: StoredSubmissionFile;
  passport?: StoredSubmissionFile;
  resume?: StoredSubmissionFile;
}

export type YouthLeadersSubmitFileRefs = {
  idPhoto?: File | null;
  portrait?: File | null;
  passport?: File | null;
  resume?: File | null;
};

export interface YouthLeadersSubmission {
  id: string;
  submittedAt: string;
  status: YouthLeadersApplicationStatus;
  draft: YouthLeadersDraft;
  /** Populated when applicant still had File objects in this browser at submit time. */
  attachments?: YouthLeadersSubmissionAttachments;
  adminNote?: string;
  reviewedAt?: string;
}

function readFileAsBase64Payload(file: File): Promise<StoredSubmissionFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? (result.split(',')[1] ?? '') : result;
      resolve({
        base64,
        mime: file.type || 'application/octet-stream',
        name: file.name || 'upload',
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function encodeAttachments(files?: YouthLeadersSubmitFileRefs): Promise<YouthLeadersSubmissionAttachments | undefined> {
  if (!files) return undefined;
  const out: YouthLeadersSubmissionAttachments = {};
  if (files.idPhoto) out.idPhoto = await readFileAsBase64Payload(files.idPhoto);
  if (files.portrait) out.portrait = await readFileAsBase64Payload(files.portrait);
  if (files.passport) out.passport = await readFileAsBase64Payload(files.passport);
  if (files.resume) out.resume = await readFileAsBase64Payload(files.resume);
  return Object.keys(out).length ? out : undefined;
}

function safeParse(raw: string | null): YouthLeadersSubmission[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadSubmissions(): YouthLeadersSubmission[] {
  try {
    return safeParse(localStorage.getItem(SUBMISSIONS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveSubmissions(rows: YouthLeadersSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('topcoach-youth-leaders-submissions-updated'));
  } catch (e) {
    throw e instanceof Error ? e : new Error('Could not save submissions to storage');
  }
}

export async function appendSubmission(
  draft: YouthLeadersDraft,
  files?: YouthLeadersSubmitFileRefs,
): Promise<YouthLeadersSubmission> {
  const attachments = await encodeAttachments(files);
  const row: YouthLeadersSubmission = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `yl-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    draft: JSON.parse(JSON.stringify(draft)) as YouthLeadersDraft,
    ...(attachments ? { attachments } : {}),
  };
  const next = [row, ...loadSubmissions()];
  saveSubmissions(next);
  return row;
}

/** Trigger a browser download from a stored attachment (admin UI). */
export function downloadStoredSubmissionFile(stored: StoredSubmissionFile): void {
  try {
    const binary = atob(stored.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: stored.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = stored.name || 'download';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

export function updateSubmission(
  id: string,
  patch: Partial<Pick<YouthLeadersSubmission, 'status' | 'adminNote' | 'reviewedAt'>>,
): boolean {
  const all = loadSubmissions();
  const i = all.findIndex((r) => r.id === id);
  if (i < 0) return false;
  all[i] = { ...all[i], ...patch };
  try {
    saveSubmissions(all);
  } catch {
    return false;
  }
  return true;
}
