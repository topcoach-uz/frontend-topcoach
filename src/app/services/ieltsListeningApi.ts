import { RtkApi } from "./api";
import { hostName } from "./api/const";

export const ieltsListeningApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getIeltsListening: builder.query<
      any,
      { type: string; book: string; test: number }
    >({
      query: ({ type, book, test }) =>
        `ielts-content/listening/${type}/${book}/${test}`,
      transformResponse: (data: any) => ({
        ...data,
        parts: data.parts.map((part: any) => ({
          ...part,
          audio: part.audio ? `${hostName}${part.audio}` : null,
          groups: part.groups.map((group: any) => ({
            ...group,
            image: group.image ? `${hostName}${group.image}` : null,
          })),
        })),
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});
export const { useGetIeltsListeningQuery } = ieltsListeningApi;
