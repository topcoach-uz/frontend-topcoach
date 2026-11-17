import { subjectKey } from 'src/pages/student-hub/applicant/universityFieldOptions';

export const universityListParams = ({
  page = 1,
  limit = 20,
  search,
  major,
  majorName,
  country,
  majorType,
  view,
}: {
  page?: number;
  limit?: number;
  search?: string;
  major?: string;
  majorName?: string;
  country?: string;
  majorType?: "undergraduate" | "graduate";
  view?: "card";
}) => ({
  _start: Math.max(0, page - 1) * limit,
  _end: Math.max(1, page) * limit,
  _sort: 'rankings',
  ...(search?.trim() ? { name: search.trim() } : {}),
  ...(major ? { majors: [major] } : {}),
  ...(majorName ? { majorName } : {}),
  ...(country ? { country } : {}),
  ...(majorType ? { majorType } : {}),
  ...(view ? { view } : {}),
});

export const normalizeUniversityList = <T>(
  response: T[] | { data?: T[]; total?: number } | null | undefined,
) => {
  const data = Array.isArray(response) ? response : (response?.data ?? []);
  return {
    data,
    total: Array.isArray(response)
      ? data.length
      : (response?.total ?? data.length),
  };
};

type ListRow = {
  id: string;
  majors?: Array<{ name?: unknown; type?: string | null } | string> | null;
  ugMajorKeys?: string[] | null;
  gradMajorKeys?: string[] | null;
  media?: Array<{ tags?: string[] | null }> | null;
  location?: { country?: unknown } | null;
};

const enName = (value: unknown): string =>
  typeof value === 'string' ? value : ((value as { en?: string | null } | null | undefined)?.en ?? '');
const normalise = (value: string) => value.trim().toLowerCase();

/** Lower-cased undergraduate subject names, used to filter the cached catalogue locally. */
export const undergraduateMajorKeys = (row: ListRow): string[] =>
  // `view=card` responses carry the index already; older APIs ignore the param and send full majors.
  Array.isArray(row.ugMajorKeys) ? row.ugMajorKeys : Array.from(new Set(
    (row.majors ?? [])
      .filter((major): major is { name?: unknown; type?: string | null } => typeof major === 'object' && major !== null && major.type === 'undergraduate')
      .map((major) => normalise(enName(major.name)))
      .filter(Boolean),
  ));

/**
 * The list endpoint returns every major, degree and fee for each university
 * (~1.3 MB, of which majors are ~96%). The Find universities page needs none of
 * that, so keep only what it renders plus a compact subject index.
 */
export const slimUniversityRow = <T extends ListRow>(row: T): T & { ugMajorKeys: string[] } => {
  const { majors: _majors, degrees: _degrees, tuitionFees: _fees, ...rest } = row as T & { degrees?: unknown; tuitionFees?: unknown };
  return {
    ...(rest as unknown as T),
    media: (row.media ?? []).filter((item) => item?.tags?.some((tag) => String(tag).toLowerCase() === 'official-logo')),
    majors: [],
    ugMajorKeys: undergraduateMajorKeys(row),
    ...(Array.isArray(row.gradMajorKeys) || (row.majors ?? []).some((m) => typeof m === 'object' && m?.type === 'graduate') ? { gradMajorKeys: graduateMajorKeys(row) } : {}),
  } as T & { ugMajorKeys: string[] };
};

/** Lower-cased graduate subject names. Card-view rows carry no graduate index, so this needs full majors. */
export const graduateMajorKeys = (row: ListRow & { gradMajorKeys?: string[] | null }): string[] =>
  Array.isArray(row.gradMajorKeys) ? row.gradMajorKeys : Array.from(new Set(
    (row.majors ?? [])
      .filter((major): major is { name?: unknown; type?: string | null } => typeof major === 'object' && major !== null && major.type === 'graduate')
      .map((major) => normalise(enName(major.name)))
      .filter(Boolean),
  ));

type Degree = 'undergraduate' | 'graduate';
const subjectKeyCache = { undergraduate: new WeakMap<object, Set<string>>(), graduate: new WeakMap<object, Set<string>>() };
const rowSubjectKeys = (row: ListRow & { ugMajorKeys?: string[] }, degree: Degree): Set<string> => {
  let keys = subjectKeyCache[degree].get(row);
  if (!keys) {
    const names = degree === 'graduate' ? graduateMajorKeys(row) : undergraduateMajorKeys(row);
    keys = new Set(names.map((name) => subjectKey(name, degree)).filter(Boolean));
    subjectKeyCache[degree].set(row, keys);
  }
  return keys;
};

/** Country is exact (case-insensitive); the field matches any major of the applicant's degree type with the same subject key. */
export const filterUniversityRows = <T extends ListRow & { ugMajorKeys?: string[] }>(rows: T[], filters: { country?: string; majorName?: string; degree?: Degree }): T[] => {
  const degree = filters.degree ?? 'undergraduate';
  const country = filters.country ? normalise(filters.country) : '';
  const major = filters.majorName ? subjectKey(filters.majorName, degree) : '';
  if (!country && !major) return rows;
  return rows.filter((row) => (!country || normalise(enName(row.location?.country)) === country) && (!major || rowSubjectKeys(row, degree).has(major)));
};
