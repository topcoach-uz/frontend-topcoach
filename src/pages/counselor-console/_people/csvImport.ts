/* ── Counselor Console — CSV roster import ────────────────────────────────────
   Parsing and validation for the bulk student import, kept out of the modal so
   the rules are testable and readable on their own.

   WHY VALIDATE CLIENT-SIDE AT ALL: `POST /invitations/bulk` is one request. A
   single row the backend's ValidationPipe rejects fails the WHOLE request with
   a 400, not just that row — so a counselor uploading 300 students and one
   malformed grade gets nothing, with a message they cannot map back to a line
   of their spreadsheet. Every constraint the backend enforces is therefore
   mirrored here, per row, before anything is sent, and a bad row is simply left
   out of the payload. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors `@IsInt() @Min(1) @Max(13)` on `gradeLevel` server-side. */
export const GRADE_MIN = 1;
export const GRADE_MAX = 13;

export interface ParsedCsvRow {
  key: string;
  name: string;
  email: string;
  /** Exactly what was in the cell — shown back to the counselor as-is. */
  grade: string;
  /** `grade`, coerced to the smallint the API wants. `null` when blank. */
  gradeLevel: number | null;
  graduationYear: string;
  phone: string;
  valid: boolean;
  error: string | null;
}

/** The five columns a row can carry, as parsed field names. */
type CsvField = 'name' | 'email' | 'grade' | 'graduationYear' | 'phone';

/**
 * RFC-4180-ish CSV reader. papaparse is not a dependency and this is not worth
 * one: it handles quoted fields, escaped double-quotes and embedded
 * commas/newlines, which is the whole of what a spreadsheet export emits.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // flush trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const HEADER_ALIASES: Record<string, CsvField> = {
  name: 'name',
  'full name': 'name',
  email: 'email',
  'email address': 'email',
  grade: 'grade',
  'grade level': 'grade',
  gradelevel: 'grade',
  graduationyear: 'graduationYear',
  'graduation year': 'graduationYear',
  gradyear: 'graduationYear',
  phone: 'phone',
  'phone number': 'phone',
};

const NUMERIC_HEADER_ORDER: CsvField[] = [
  'name',
  'email',
  'grade',
  'graduationYear',
  'phone',
];

/**
 * Coerce a grade cell to the integer the API wants.
 *
 * Counselors export from student information systems that write grades as
 * "11", "11th", "Grade 11" or "G11" — `Number("11th")` is NaN, and sending NaN
 * failed `@IsInt()` and took the entire bulk request down with it. Pull the
 * first run of digits instead, and report anything that still isn't a grade as
 * a row-level error so the rest of the file still imports.
 *
 * Returns `undefined` when the cell is unusable (distinct from `null`, blank).
 */
export function parseGradeCell(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/\d+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  if (!Number.isInteger(n) || n < GRADE_MIN || n > GRADE_MAX) return undefined;
  return n;
}

/** Parse + validate the raw CSV text into preview rows. */
export function buildPreviewRows(text: string): ParsedCsvRow[] {
  const table = parseCsv(text).filter(
    (r) => r.length > 0 && r.some((c) => c.trim() !== ''),
  );
  if (table.length === 0) return [];

  // Detect a header row: if the first row's cells map to known aliases.
  const first = table[0]!.map((c) => c.trim().toLowerCase());
  const looksLikeHeader = first.some((c) => c in HEADER_ALIASES);

  let colMap: (CsvField | null)[];
  let dataRows: string[][];
  if (looksLikeHeader) {
    colMap = first.map((c) => HEADER_ALIASES[c] ?? null);
    dataRows = table.slice(1);
  } else {
    // No header — assume the canonical column order.
    colMap = NUMERIC_HEADER_ORDER;
    dataRows = table;
  }

  const seenEmails = new Set<string>();

  return dataRows.map((cells, idx) => {
    const rec: Record<CsvField, string> = {
      name: '',
      email: '',
      grade: '',
      graduationYear: '',
      phone: '',
    };
    colMap.forEach((field, ci) => {
      if (field) rec[field] = (cells[ci] ?? '').trim();
    });

    const email = rec.email.toLowerCase();
    const gradeLevel = parseGradeCell(rec.grade);

    let error: string | null = null;
    if (!email) {
      error = 'Missing email';
    } else if (!EMAIL_RE.test(email)) {
      error = 'Invalid email';
    } else if (seenEmails.has(email)) {
      error = 'Duplicate in file';
    } else if (rec.graduationYear && !/^\d{4}$/.test(rec.graduationYear)) {
      error = 'Graduation year must be a 4-digit year';
    } else if (gradeLevel === undefined) {
      error = `Grade must be a number ${GRADE_MIN}–${GRADE_MAX}`;
    }
    if (email && !error) seenEmails.add(email);

    return {
      key: `${idx}-${email || 'row'}`,
      name: rec.name,
      email: rec.email,
      grade: rec.grade,
      gradeLevel: gradeLevel ?? null,
      graduationYear: rec.graduationYear,
      phone: rec.phone,
      valid: !error,
      error,
    };
  });
}
