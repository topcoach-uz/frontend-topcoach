export const universityListParams = ({
  page = 1,
  limit = 20,
  search,
  major,
  majorName,
  country,
  majorType,
}: {
  page?: number;
  limit?: number;
  search?: string;
  major?: string;
  majorName?: string;
  country?: string;
  majorType?: "undergraduate" | "graduate";
}) => ({
  _start: Math.max(0, page - 1) * limit,
  _end: Math.max(1, page) * limit,
  _sort: 'rankings',
  ...(search?.trim() ? { name: search.trim() } : {}),
  ...(major ? { majors: [major] } : {}),
  ...(majorName ? { majorName } : {}),
  ...(country ? { country } : {}),
  ...(majorType ? { majorType } : {}),
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
  media?: Array<{ tags?: string[] | null }> | null;
  location?: { country?: unknown } | null;
};

const enName = (value: unknown): string =>
  typeof value === 'string' ? value : ((value as { en?: string | null } | null | undefined)?.en ?? '');
const normalise = (value: string) => value.trim().toLowerCase();

/** Lower-cased undergraduate subject names, used to filter the cached catalogue locally. */
export const undergraduateMajorKeys = (row: ListRow): string[] =>
  Array.from(new Set(
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
  } as T & { ugMajorKeys: string[] };
};

/** Same semantics as the server's country / majorName filters (exact, case-insensitive, trimmed). */
export const filterUniversityRows = <T extends ListRow & { ugMajorKeys?: string[] }>(rows: T[], filters: { country?: string; majorName?: string }): T[] => {
  const country = filters.country ? normalise(filters.country) : '';
  const major = filters.majorName ? normalise(filters.majorName) : '';
  if (!country && !major) return rows;
  return rows.filter((row) => (!country || normalise(enName(row.location?.country)) === country) && (!major || (row.ugMajorKeys ?? []).includes(major)));
};
