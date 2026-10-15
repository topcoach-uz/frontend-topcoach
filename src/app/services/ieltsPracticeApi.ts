import { RtkApi } from "./api";
export type IeltsSubmission = {
  id: string;
  practiceKey: string;
  skill: "writing" | "speaking";
  text: string;
  prompt: string;
  state: "saved" | "processing" | "assessed" | "failed";
  error?: string;
  createdAt: string;
  feedback?: {
    estimatedBand: number | null;
    summary: string;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  recordings: { id: string; question: number; expiresAt: string }[];
};
export type CreateIeltsSubmission = {
  requestId: string;
  practiceKey: string;
  skill: "writing" | "speaking";
  text: string;
  prompt: string;
};
export const ieltsPracticeApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getIeltsSubmissions: builder.query<IeltsSubmission[], string>({
      query: (practiceKey) => ({
        url: "ielts-practice/submissions",
        params: { practiceKey },
      }),
    }),
    createIeltsSubmission: builder.mutation<
      IeltsSubmission,
      CreateIeltsSubmission
    >({
      query: (body) => ({
        url: "ielts-practice/submissions",
        method: "POST",
        body,
      }),
    }),
    uploadIeltsRecording: builder.mutation<
      { id: string },
      { id: string; question: number; blob: Blob }
    >({
      query: ({ id, question, blob }) => {
        const body = new FormData();
        body.append(
          "file",
          blob,
          blob.type.startsWith("audio/mp4")
            ? "recording.m4a"
            : "recording.webm",
        );
        return {
          url: `ielts-practice/submissions/${id}/recordings/${question}`,
          method: "POST",
          body,
        };
      },
    }),
    assessIeltsSubmission: builder.mutation<IeltsSubmission, string>({
      query: (id) => ({
        url: `ielts-practice/submissions/${id}/assess`,
        method: "POST",
        timeout: 75000,
      }),
    }),
    downloadIeltsRecording: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `ielts-practice/recordings/${id}`,
        responseHandler: (response) => response.blob(),
        cache: "no-store",
      }),
    }),
  }),
});
export const {
  useLazyGetIeltsSubmissionsQuery,
  useCreateIeltsSubmissionMutation,
  useUploadIeltsRecordingMutation,
  useAssessIeltsSubmissionMutation,
  useDownloadIeltsRecordingMutation,
} = ieltsPracticeApi;
