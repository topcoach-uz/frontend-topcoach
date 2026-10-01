import { RtkApi } from "./api";
import type { TranslationDto } from "src/app/api/Api";

export type GraduateProgramFact = Record<string, unknown> | null;

export interface GraduateProgram {
  id: string;
  programName: string;
  universityId: string;
  university: { id: string; name: TranslationDto | string };
  intake: string | null;
  deadline: string | null;
  eligibility: GraduateProgramFact;
  funding: GraduateProgramFact;
  languageEvidence: GraduateProgramFact;
  officialSourceUrl: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GraduateProgramList {
  data: GraduateProgram[];
  total: number;
  page: number;
  limit: number;
}

const normalizeList = (response: GraduateProgram[] | Partial<GraduateProgramList>): GraduateProgramList => {
  const data = Array.isArray(response) ? response : response.data ?? [];
  return {
    data,
    total: Array.isArray(response) ? data.length : response.total ?? data.length,
    page: Array.isArray(response) ? 1 : response.page ?? 1,
    limit: Array.isArray(response) ? data.length : response.limit ?? data.length,
  };
};

export const graduateProgramsApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getGraduatePrograms: builder.query<GraduateProgramList, {
      q?: string;
      universityId?: string;
      intake?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ q, universityId, intake, page = 1, limit = 20 }) => ({
        url: "/graduate-programs",
        method: "GET",
        params: { q, universityId, intake, page, limit },
      }),
      transformResponse: normalizeList,
      keepUnusedDataFor: 300,
    }),
    getGraduateProgram: builder.query<GraduateProgram, string>({
      query: (id) => ({ url: `/graduate-programs/${id}`, method: "GET" }),
      transformResponse: (response: GraduateProgram | { data: GraduateProgram }) =>
        "data" in response ? response.data : response,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetGraduateProgramsQuery, useGetGraduateProgramQuery } = graduateProgramsApi;
