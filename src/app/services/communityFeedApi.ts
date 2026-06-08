import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './api';

/**
 * Community Feed — RTK Query slice that mirrors `src/modules/community-feed`
 * on the backend. v1: posts + comments + likes + saves. Reports + admin
 * endpoints land in Phase 3.
 *
 * Keep the response types loose-but-honest: the backend doesn't yet emit
 * a strict Swagger response DTO, but the shapes returned by
 * CommunityFeedService are deterministic.
 */

export type CommunityCategory =
  | 'ADMISSIONS'
  | 'COLLEGE_LIFE'
  | 'STUDY_ABROAD'
  | 'EXAM_PREP'
  | 'WELLNESS'
  | 'RESEARCH'
  | 'GENERAL';

export type CommunityPostingPersona = 'SELF' | 'OFFICIAL' | 'COACH';

export type CommunityReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'OFF_TOPIC'
  | 'MISINFORMATION'
  | 'SAFETY'
  | 'OTHER';

export interface CommunityAuthor {
  id: string;
  name: string;
  managementRole: string;
  avatarUrl: string | null;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  category: CommunityCategory;
  postingPersona: CommunityPostingPersona;
  body: string;
  mediaUrls: string[];
  isPinned: boolean;
  pinnedAt: string | null;
  pinnedById: string | null;
  likeCount: number;
  commentCount: number;
  savedCount: number;
  viewCount: number;
  isHidden: boolean;
  hiddenReason: string | null;
  isAutoFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  /** Decorated by the server for the calling user. */
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  author: CommunityAuthor | null;
  /** Optional poll attached to this post (v1.1). */
  poll?: CommunityPoll | null;
  /** Post kind — drives the QUESTION/ANSWERED affordances (v1.2). */
  postKind?: CommunityPostKind;
  /** Comment id marked as the accepted answer (QUESTION posts only). */
  answeredCommentId?: string | null;
  /** Denormalised list of user ids mentioned in the body (v1.2). */
  mentionedUserIds?: string[] | null;
  /** Denormalised hashtags (lowercased, no #) extracted from the body (v1.3). */
  hashtags?: string[] | null;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string;
  body: string;
  likeCount: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  isLikedByMe?: boolean;
  author: CommunityAuthor | null;
  replies?: CommunityComment[];
}

export interface ListPostsResponse {
  items: CommunityPost[];
  nextCursor: string | null;
}

export interface ListPostsArgs {
  cursor?: string;
  limit?: number;
  category?: CommunityCategory;
  authorId?: string;
  /** Lowercased hashtag (no #). Use to power tag-filter pills. */
  hashtag?: string;
  /** Free-text search across the post body (≤ 80 chars). */
  q?: string;
}

export type CommunityPostKind = 'STANDARD' | 'QUESTION';

export interface CreatePostBody {
  body: string;
  category: CommunityCategory;
  mediaUrls?: string[];
  pin?: boolean;
  postingPersona?: CommunityPostingPersona;
  poll?: CreatePostPollPayload;
  kind?: CommunityPostKind;
}

/** Inline poll payload accepted by POST /community/posts. */
export interface CreatePostPollPayload {
  question?: string;
  /** 2–4 entries, each 1–80 chars. */
  options: string[];
  /** ISO-8601 close time. Omit for "open until manually closed". */
  closesAt?: string;
}

export interface CommunityPollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface CommunityPoll {
  id: string;
  postId: string;
  question: string | null;
  options: CommunityPollOption[];
  totalVotes: number;
  closesAt: string | null;
  isClosed: boolean;
  /** Decorated by the server for the calling user. */
  myVoteOptionId: string | null;
}

export interface UpdatePostBody {
  body?: string;
  category?: CommunityCategory;
  mediaUrls?: string[];
}

export interface CreateCommentBody {
  body: string;
  parentCommentId?: string;
}

export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface ToggleSaveResponse {
  saved: boolean;
  savedCount: number;
}

function postsQuery(args: ListPostsArgs): string {
  const params = new URLSearchParams();
  if (args.cursor) params.set('cursor', args.cursor);
  if (args.limit) params.set('limit', String(args.limit));
  if (args.category) params.set('category', args.category);
  if (args.authorId) params.set('authorId', args.authorId);
  if (args.hashtag) params.set('hashtag', args.hashtag);
  if (args.q) params.set('q', args.q);
  const qs = params.toString();
  return `community/posts${qs ? `?${qs}` : ''}`;
}

export const communityFeedApi = createApi({
  reducerPath: 'communityFeedApi',
  baseQuery,
  refetchOnReconnect: true,
  tagTypes: ['Post', 'Comments', 'AdminPosts', 'AdminReports', 'AdminStats'],
  endpoints: (builder) => ({
    /* ─── posts ──────────────────────────────────────────── */
    listPosts: builder.query<ListPostsResponse, ListPostsArgs | void>({
      query: (args) => postsQuery(args ?? {}),
      // Merge pages so infinite scroll appends naturally.
      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        // Same cache key regardless of cursor (the cursor drives `merge` below).
        const norm = { ...(queryArgs ?? {}) } as Record<string, unknown>;
        delete norm.cursor;
        return `${endpointName}:${JSON.stringify(norm)}`;
      },
      merge: (current, incoming, { arg }) => {
        const isInitial = !(arg && (arg as ListPostsArgs).cursor);
        if (isInitial) {
          current.items = incoming.items;
        } else {
          const seen = new Set(current.items.map((p) => p.id));
          current.items.push(...incoming.items.filter((p) => !seen.has(p.id)));
        }
        current.nextCursor = incoming.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: 'Post' as const, id: p.id })),
              { type: 'Post' as const, id: 'LIST' },
            ]
          : [{ type: 'Post' as const, id: 'LIST' }],
    }),

    getPost: builder.query<CommunityPost, string>({
      query: (id) => `community/posts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Post', id }],
    }),

    createPost: builder.mutation<CommunityPost, CreatePostBody>({
      query: (body) => ({ url: 'community/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    updatePost: builder.mutation<CommunityPost, { id: string; body: UpdatePostBody }>({
      query: ({ id, body }) => ({ url: `community/posts/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),

    deletePost: builder.mutation<void, string>({
      query: (id) => ({ url: `community/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),

    pinPost: builder.mutation<CommunityPost, { id: string; pinned: boolean }>({
      query: ({ id, pinned }) => ({
        url: `community/posts/${id}/${pinned ? 'pin' : 'unpin'}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    /* ─── engagement ─────────────────────────────────────── */
    togglePostLike: builder.mutation<ToggleLikeResponse, string>({
      query: (postId) => ({ url: `community/posts/${postId}/like`, method: 'POST' }),
      // Optimistic update: bump the local cache before the server confirms.
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        const state = getState() as { communityFeedApi: { queries: Record<string, unknown> } };
        const listKeys = Object.keys(state.communityFeedApi.queries).filter((k) =>
          k.startsWith('listPosts:'),
        );
        const patches: Array<{ undo: () => void }> = [];
        listKeys.forEach((key) => {
          const args = JSON.parse(key.replace('listPosts:', ''));
          const patch = dispatch(
            communityFeedApi.util.updateQueryData('listPosts', args, (draft) => {
              const found = draft.items.find((p) => p.id === postId);
              if (found) {
                if (found.isLikedByMe) {
                  found.isLikedByMe = false;
                  found.likeCount = Math.max(0, found.likeCount - 1);
                } else {
                  found.isLikedByMe = true;
                  found.likeCount += 1;
                }
              }
            }),
          );
          patches.push(patch);
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    togglePostSave: builder.mutation<ToggleSaveResponse, string>({
      query: (postId) => ({ url: `community/posts/${postId}/save`, method: 'POST' }),
      invalidatesTags: [{ type: 'Post', id: 'SAVED' }],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        const state = getState() as { communityFeedApi: { queries: Record<string, unknown> } };
        const listKeys = Object.keys(state.communityFeedApi.queries).filter((k) =>
          k.startsWith('listPosts:'),
        );
        const patches: Array<{ undo: () => void }> = [];
        listKeys.forEach((key) => {
          const args = JSON.parse(key.replace('listPosts:', ''));
          const patch = dispatch(
            communityFeedApi.util.updateQueryData('listPosts', args, (draft) => {
              const found = draft.items.find((p) => p.id === postId);
              if (found) {
                if (found.isSavedByMe) {
                  found.isSavedByMe = false;
                  found.savedCount = Math.max(0, found.savedCount - 1);
                } else {
                  found.isSavedByMe = true;
                  found.savedCount += 1;
                }
              }
            }),
          );
          patches.push(patch);
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    recordPostView: builder.mutation<void, string>({
      query: (postId) => ({ url: `community/posts/${postId}/view`, method: 'POST' }),
    }),

    /* ─── polls ──────────────────────────────────────────── */
    /**
     * Cast a vote. Optimistic: bump the chosen option's count + total
     * inside every cached listPosts query so the bar fills immediately.
     * If the server rejects (closed poll, races), the patches roll back.
     */
    votePoll: builder.mutation<
      CommunityPoll,
      { pollId: string; postId: string; optionId: string }
    >({
      query: ({ pollId, optionId }) => ({
        url: `community/polls/${pollId}/vote`,
        method: 'POST',
        body: { optionId },
      }),
      async onQueryStarted({ postId, optionId }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as { communityFeedApi: { queries: Record<string, unknown> } };
        const listKeys = Object.keys(state.communityFeedApi.queries).filter((k) =>
          k.startsWith('listPosts:'),
        );
        const patches: Array<{ undo: () => void }> = [];
        listKeys.forEach((key) => {
          const args = JSON.parse(key.replace('listPosts:', ''));
          const patch = dispatch(
            communityFeedApi.util.updateQueryData('listPosts', args, (draft) => {
              const found = draft.items.find((p) => p.id === postId);
              if (found?.poll && !found.poll.myVoteOptionId) {
                found.poll.totalVotes += 1;
                found.poll.myVoteOptionId = optionId;
                const opt = found.poll.options.find((o) => o.id === optionId);
                if (opt) opt.voteCount += 1;
              }
            }),
          );
          patches.push(patch);
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    closePoll: builder.mutation<CommunityPoll, { pollId: string; postId: string }>({
      query: ({ pollId }) => ({
        url: `community/polls/${pollId}/close`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Post', id: postId }],
    }),

    /* ─── question — mark / unmark answer ────────────────── */
    markAnswer: builder.mutation<CommunityPost, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `community/posts/${postId}/answer/${commentId}`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { postId }) => [
        { type: 'Post', id: 'LIST' },
        { type: 'Post', id: postId },
        { type: 'Comments', id: postId },
      ],
    }),

    unmarkAnswer: builder.mutation<CommunityPost, { postId: string }>({
      query: ({ postId }) => ({
        url: `community/posts/${postId}/answer`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { postId }) => [
        { type: 'Post', id: 'LIST' },
        { type: 'Post', id: postId },
      ],
    }),

    /* ─── leaderboard ─────────────────────────────────────── */
    leaderboard: builder.query<
      Array<{ id: string; name: string; helpfulReplies: number; totalLikes: number }>,
      { period?: 'month'; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.period) params.set('period', args.period);
        if (args?.limit) params.set('limit', String(args.limit));
        const qs = params.toString();
        return `community/leaderboard${qs ? `?${qs}` : ''}`;
      },
    }),

    /* ─── trending ───────────────────────────────────────── */
    trending: builder.query<
      Array<{
        id: string;
        body: string;
        category: CommunityCategory;
        createdAt: string;
        likeCount: number;
        commentCount: number;
        savedCount: number;
        viewCount: number;
        authorName: string;
        authorId: string;
        score: string;
      }>,
      number | void
    >({
      query: (limit) =>
        `community/trending${limit ? `?limit=${limit}` : ''}`,
    }),

    trendingHashtags: builder.query<Array<{ tag: string; count: number }>, number | void>({
      query: (limit) =>
        `community/trending-hashtags${limit ? `?limit=${limit}` : ''}`,
    }),

    /* ─── top mentors (rotated weekly) ───────────────────── */
    topMentors: builder.query<
      Array<{
        userId: string;
        name: string;
        mentorProfileId: string;
        title: string | null;
        summary: string | null;
        university: string | null;
        major: string | null;
        tags: string[] | null;
        initialSessions: number;
        rating: string;
        avatarUrl: string | null;
      }>,
      number | void
    >({
      query: (limit) =>
        `community/top-mentors${limit ? `?limit=${limit}` : ''}`,
    }),

    /* ─── saved posts (bookmarks list) ───────────────────── */
    listSavedPosts: builder.query<{ items: CommunityPost[] }, void>({
      query: () => 'community/saved',
      providesTags: [{ type: 'Post', id: 'SAVED' }],
    }),

    /* ─── image upload (multipart) ───────────────────────── */
    uploadPostImage: builder.mutation<
      { url: string; filename: string; sizeBytes: number; mimeType: string },
      File
    >({
      query: (file) => {
        const form = new FormData();
        form.append('image', file);
        return {
          url: 'community/posts/upload-image',
          method: 'POST',
          body: form,
          // RTK Query / fetch sets multipart boundary automatically; do NOT set Content-Type manually.
        };
      },
    }),

    /* ─── comments ───────────────────────────────────────── */
    listComments: builder.query<CommunityComment[], string>({
      query: (postId) => `community/posts/${postId}/comments`,
      providesTags: (_r, _e, postId) => [{ type: 'Comments', id: postId }],
    }),

    createComment: builder.mutation<
      CommunityComment,
      { postId: string; body: CreateCommentBody }
    >({
      query: ({ postId, body }) => ({
        url: `community/posts/${postId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { postId }) => [
        { type: 'Comments', id: postId },
        { type: 'Post', id: postId },
      ],
    }),

    deleteComment: builder.mutation<void, { commentId: string; postId: string }>({
      query: ({ commentId }) => ({
        url: `community/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Comments', id: postId }],
    }),

    toggleCommentLike: builder.mutation<
      ToggleLikeResponse,
      { commentId: string; postId: string }
    >({
      query: ({ commentId }) => ({
        url: `community/comments/${commentId}/like`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Comments', id: postId }],
    }),
  }),
});

/* ─── reports + admin types ─────────────────────────────────── */

export type CommunityReportStatus = 'PENDING' | 'ACTIONED' | 'DISMISSED';
export type AdminPostStatus = 'LIVE' | 'HIDDEN' | 'DELETED' | 'AUTO_FLAGGED';

export interface CommunityReport {
  id: string;
  postId: string | null;
  commentId: string | null;
  reporterId: string;
  reason: CommunityReportReason;
  note: string | null;
  status: CommunityReportStatus;
  resolvedById: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  post?: CommunityPost | null;
  comment?: CommunityComment | null;
}

export interface CommunityModerationStats {
  postsToday: number;
  postsYesterday: number;
  commentsToday: number;
  commentsYesterday: number;
  hiddenLast7d: number;
}

export interface ListAdminPostsResponse {
  items: CommunityPost[];
  total: number;
}

export interface ListAdminReportsResponse {
  items: CommunityReport[];
  total: number;
}

export interface ReportTargetBody {
  reason: CommunityReportReason;
  note?: string;
}

export interface ResolveReportBody {
  status: 'ACTIONED' | 'DISMISSED';
  resolutionNote?: string;
}

export const communityFeedAdminApi = communityFeedApi.injectEndpoints({
  endpoints: (builder) => ({
    /* public reports */
    reportPost: builder.mutation<CommunityReport, { postId: string; body: ReportTargetBody }>({
      query: ({ postId, body }) => ({
        url: `community/posts/${postId}/report`,
        method: 'POST',
        body,
      }),
    }),
    reportComment: builder.mutation<CommunityReport, { commentId: string; body: ReportTargetBody }>({
      query: ({ commentId, body }) => ({
        url: `community/comments/${commentId}/report`,
        method: 'POST',
        body,
      }),
    }),

    /* admin */
    adminListPosts: builder.query<ListAdminPostsResponse, { status?: AdminPostStatus; limit?: number; offset?: number } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.status) params.set('status', args.status);
        if (args?.limit) params.set('limit', String(args.limit));
        if (args?.offset) params.set('offset', String(args.offset));
        const qs = params.toString();
        return `admin/community/posts${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'AdminPosts', id: 'LIST' }],
    }),
    adminHidePost: builder.mutation<CommunityPost, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `admin/community/posts/${id}/hide`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [
        { type: 'AdminPosts', id: 'LIST' },
        { type: 'AdminReports', id: 'LIST' },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    adminUnhidePost: builder.mutation<CommunityPost, string>({
      query: (id) => ({ url: `admin/community/posts/${id}/unhide`, method: 'POST' }),
      invalidatesTags: [
        { type: 'AdminPosts', id: 'LIST' },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    adminDeletePost: builder.mutation<void, string>({
      query: (id) => ({ url: `admin/community/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'AdminPosts', id: 'LIST' },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    adminHideComment: builder.mutation<CommunityComment, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `admin/community/comments/${id}/hide`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [{ type: 'AdminPosts', id: 'LIST' }],
    }),

    adminListReports: builder.query<ListAdminReportsResponse, { status?: CommunityReportStatus | 'ALL'; limit?: number; offset?: number } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.status) params.set('status', args.status);
        if (args?.limit) params.set('limit', String(args.limit));
        if (args?.offset) params.set('offset', String(args.offset));
        const qs = params.toString();
        return `admin/community/reports${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'AdminReports', id: 'LIST' }],
    }),
    adminResolveReport: builder.mutation<CommunityReport, { id: string; body: ResolveReportBody }>({
      query: ({ id, body }) => ({
        url: `admin/community/reports/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminReports', id: 'LIST' },
        { type: 'AdminPosts', id: 'LIST' },
      ],
    }),

    adminStats: builder.query<CommunityModerationStats, void>({
      query: () => 'admin/community/stats',
      providesTags: [{ type: 'AdminStats', id: 'CURRENT' }],
    }),

    adminUserActivity: builder.query<
      { posts: CommunityPost[]; comments: CommunityComment[] },
      string
    >({
      query: (userId) => `admin/community/users/${userId}/activity`,
    }),

    adminFlaggedUsers: builder.query<
      Array<{
        id: string;
        name: string;
        flagCount: number;
        hiddenCount: number;
        postCount: number;
        commentCount: number;
        totalActivity: number;
      }>,
      number | void
    >({
      query: (limit) =>
        `admin/community/users/flagged${limit ? `?limit=${limit}` : ''}`,
    }),
  }),
});

export const {
  useReportPostMutation,
  useReportCommentMutation,
  useAdminListPostsQuery,
  useAdminHidePostMutation,
  useAdminUnhidePostMutation,
  useAdminDeletePostMutation,
  useAdminHideCommentMutation,
  useAdminListReportsQuery,
  useAdminResolveReportMutation,
  useAdminStatsQuery,
  useAdminUserActivityQuery,
  useAdminFlaggedUsersQuery,
} = communityFeedAdminApi;

export const {
  useListPostsQuery,
  useLazyListPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  usePinPostMutation,
  useTogglePostLikeMutation,
  useTogglePostSaveMutation,
  useRecordPostViewMutation,
  useListCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
  useLeaderboardQuery,
  useTrendingQuery,
  useTopMentorsQuery,
  useUploadPostImageMutation,
  useListSavedPostsQuery,
  useVotePollMutation,
  useClosePollMutation,
  useMarkAnswerMutation,
  useUnmarkAnswerMutation,
  useTrendingHashtagsQuery,
} = communityFeedApi;
