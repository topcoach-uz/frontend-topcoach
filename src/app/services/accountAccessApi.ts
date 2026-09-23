import { RtkApi } from './api';

export type AccountAccessSnapshot = {
  userId: string;
  deactivated: boolean;
  version: number;
  isStaff: boolean;
  isSelf: boolean;
  assignedStudents: number;
  upcomingSessions: number;
  scheduledFullSupportSessions: number;
  blockers: string[];
  history: Array<{
    action: 'deactivated' | 'reactivated';
    actorUserId: string;
    reason: string;
    createdAt: string;
  }>;
};

type ChangeAccountAccess = {
  userId: string;
  deactivated: boolean;
  reason: string;
  expectedVersion: number;
};

function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response
    ? response.data
    : (response as T);
}

export const accountAccessApi = RtkApi.enhanceEndpoints({
  addTagTypes: [
    'AdminAccountAccess',
    'AdminConsoleDirectory',
    'AdminConsoleUserDetail',
  ],
}).injectEndpoints({
  endpoints: (builder) => ({
    getAccountAccess: builder.query<AccountAccessSnapshot, string>({
      query: (userId) => `/admin/users/${encodeURIComponent(userId)}/access`,
      transformResponse: (
        response: AccountAccessSnapshot | { data: AccountAccessSnapshot },
      ) => unwrap(response),
      providesTags: (_result, _error, id) => [
        { type: 'AdminAccountAccess', id },
      ],
    }),
    changeAccountAccess: builder.mutation<
      Pick<AccountAccessSnapshot, 'userId' | 'deactivated' | 'version'>,
      ChangeAccountAccess
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${encodeURIComponent(userId)}/access`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (
        response:
          | Pick<AccountAccessSnapshot, 'userId' | 'deactivated' | 'version'>
          | {
              data: Pick<
                AccountAccessSnapshot,
                'userId' | 'deactivated' | 'version'
              >;
            },
      ) => unwrap(response),
      invalidatesTags: (_result, error, { userId }) =>
        error
          ? [{ type: 'AdminAccountAccess', id: userId }]
          : [
              { type: 'AdminAccountAccess', id: userId },
              { type: 'AdminConsoleUserDetail', id: userId },
              'AdminConsoleDirectory',
              'FullSupportAdmin',
              'GetMentors',
            ],
    }),
  }),
});

export const { useGetAccountAccessQuery, useChangeAccountAccessMutation } =
  accountAccessApi;
