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
