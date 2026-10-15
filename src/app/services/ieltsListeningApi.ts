import { RtkApi } from "./api";
import { hostName } from "./api/const";

export const ieltsListeningApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getIeltsSpeaking: builder.query<any, { part: number; topic?: string }>({
      query: ({ part, topic }) =>
        `ielts-content/speaking/${part}${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`,
      transformResponse: (data: any) => ({
        ...data,
        topic: {
          ...data.topic,
          questions: data.topic.questions.map((question: any) => ({
            ...question,
            audio: question.audio ? `${hostName}${question.audio}` : null,
          })),
        },
      }),
      keepUnusedDataFor: 60,
    }),
    getIeltsWriting: builder.query<
      any,
      { type: string; book: string; test: number }
    >({
      query: ({ type, book, test }) =>
        `ielts-content/writing/${type}/${book}/${test}`,
      transformResponse: (data: any) => ({
        ...data,
        parts: data.parts.map((part: any) => ({
          ...part,
          chart: part.chart ? `${hostName}${part.chart}` : null,
        })),
      }),
      keepUnusedDataFor: 60,
    }),
    getIeltsReading: builder.query<
      any,
      { type: string; book: string; test: number }
    >({
      query: ({ type, book, test }) =>
        `ielts-content/reading/${type}/${book}/${test}`,
      transformResponse: (data: any) => ({
        ...data,
        parts: data.parts.map((part: any) => ({
          ...part,
          article: {
            ...part.article,
            blocks: part.article.blocks.map((block: any) => ({
              ...block,
              image: block.image ? `${hostName}${block.image}` : null,
            })),
          },
          groups: part.groups.map((group: any) => ({
            ...group,
            image: group.image ? `${hostName}${group.image}` : null,
          })),
        })),
      }),
      keepUnusedDataFor: 60,
    }),
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
export const {
  useGetIeltsListeningQuery,
  useGetIeltsReadingQuery,
  useGetIeltsWritingQuery,
  useGetIeltsSpeakingQuery,
} = ieltsListeningApi;
