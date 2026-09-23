export const universityListParams = ({
  page = 1,
  limit = 20,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => ({
  _start: Math.max(0, page - 1) * limit,
  _end: Math.max(1, page) * limit,
  ...(search?.trim() ? { name: search.trim() } : {}),
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
