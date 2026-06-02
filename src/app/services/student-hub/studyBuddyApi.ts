import { RtkApi } from '../api';

export type StudyBuddyOverlapItem = { field: string; value: string; label: string };

export type StudyBuddyDiscoverItem = {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  overlap: StudyBuddyOverlapItem[];
  overlapCount: number;
  overlapScore: number;
  matchExplanation?: string;
  requestStatus: 'none' | 'outgoing_pending' | 'incoming_pending' | 'connected';
  outgoingRequestId?: string;
  incomingRequestId?: string;
  conversationId?: string;
};

export type StudyBuddyRequestRow = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  note?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
  peerConversationId?: string | null;
  requester?: {
    id: string;
    email?: string;
    profile?: { name: string; username?: string | null; media?: Array<{ url?: string; createdAt?: string; type?: string; tags?: string[] }> };
  };
  addressee?: {
    id: string;
    email?: string;
    profile?: { name: string; username?: string | null; media?: Array<{ url?: string; createdAt?: string; type?: string; tags?: string[] }> };
  };
};

export type StudyBuddyConsentStatus = {
  consented: boolean;
  acceptedAt: string | null;
  version: number;
  currentVersion: number;
};

export const studyBuddyApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    studyBuddyConsentStatus: build.query<StudyBuddyConsentStatus, void>({
      query: () => ({ url: '/study-buddy/consent' }),
      providesTags: ['StudyBuddy'],
    }),
    studyBuddyAcceptConsent: build.mutation<StudyBuddyConsentStatus, void>({
      query: () => ({ url: '/study-buddy/consent', method: 'POST' }),
      invalidatesTags: ['StudyBuddy'],
    }),
    studyBuddyDiscover: build.query<
      { items: StudyBuddyDiscoverItem[]; nextCursor: number | null },
      { cursor?: number } | void
    >({
      query: (arg) => {
        const cursor = arg && typeof arg === 'object' && 'cursor' in arg ? arg.cursor : undefined;
        const params = new URLSearchParams();
        if (typeof cursor === 'number' && cursor > 0) params.set('cursor', String(cursor));
        const q = params.toString();
        return { url: `/study-buddy/discover${q ? `?${q}` : ''}` };
      },
      providesTags: ['StudyBuddy'],
    }),
    studyBuddyRequests: build.query<
      { requests: StudyBuddyRequestRow[] },
      { direction: 'in' | 'out'; status?: string }
    >({
      query: ({ direction, status }) => {
        const params = new URLSearchParams({ direction });
        if (status) params.set('status', status);
        return { url: `/study-buddy/requests?${params.toString()}` };
      },
      providesTags: ['StudyBuddy'],
    }),
    studyBuddySendRequest: build.mutation<
      { request: StudyBuddyRequestRow },
      { targetUserId: string; note?: string }
    >({
      query: (body) => ({ url: '/study-buddy/requests', method: 'POST', body }),
      invalidatesTags: ['StudyBuddy', 'ChatConversations'],
    }),
    studyBuddyCancelRequest: build.mutation<{ request: StudyBuddyRequestRow }, string>({
      query: (id) => ({ url: `/study-buddy/requests/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['StudyBuddy'],
    }),
    studyBuddyAcceptRequest: build.mutation<
      { request: StudyBuddyRequestRow; conversationId: string },
      string
    >({
      query: (id) => ({ url: `/study-buddy/requests/${id}/accept`, method: 'POST' }),
      invalidatesTags: ['StudyBuddy', 'ChatConversations'],
    }),
    studyBuddyRejectRequest: build.mutation<{ request: StudyBuddyRequestRow }, string>({
      query: (id) => ({ url: `/study-buddy/requests/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['StudyBuddy'],
    }),
    studyBuddyPeerPreviews: build.mutation<{ previews: Record<string, string[]> }, { userIds: string[] }>({
      query: (body) => ({ url: '/study-buddy/peer-previews', method: 'POST', body }),
    }),
  }),
});

export const {
  useStudyBuddyConsentStatusQuery,
  useStudyBuddyAcceptConsentMutation,
  useStudyBuddyDiscoverQuery,
  useStudyBuddyRequestsQuery,
  useStudyBuddySendRequestMutation,
  useStudyBuddyCancelRequestMutation,
  useStudyBuddyAcceptRequestMutation,
  useStudyBuddyRejectRequestMutation,
  useStudyBuddyPeerPreviewsMutation,
} = studyBuddyApi;
