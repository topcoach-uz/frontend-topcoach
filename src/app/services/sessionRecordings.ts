import { RtkApi } from './api';

export type RecordingSource = 'platform' | 'full-support' | 'course-class';
export type SessionRecording = {
  id: string;
  status: 'pending' | 'scheduled' | 'joining' | 'recording' | 'processing' | 'saving' | 'ready' | 'failed' | 'cancelled';
  startsAt: string;
  errorCode: string | null;
  playbackPath: string | null;
};
const api = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getSessionRecordings: build.query<SessionRecording[], { source: RecordingSource; sessionId: string }>({
      query: ({ source, sessionId }) => `/session-recordings/${source}/${sessionId}`,
    }),
  }),
});
export const { useGetSessionRecordingsQuery } = api;
