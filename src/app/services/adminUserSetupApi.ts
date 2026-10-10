import { RtkApi } from "./api";
export type AdminUserSetup = {
  completedAt: string | null;
  currentStep: string | null;
  revision: number;
  percent: number | null;
  steps: Array<{ key: string; passed: boolean }>;
  canChangePassword: boolean;
};
const unwrap = <T>(response: T | { data: T }): T =>
  response && typeof response === "object" && "data" in response
    ? response.data
    : (response as T);
export const adminUserSetupApi = RtkApi.enhanceEndpoints({
  addTagTypes: ["AdminUserSetup"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getAdminUserSetup: builder.query<AdminUserSetup, string>({
      query: (id) => `/admin/users/${encodeURIComponent(id)}/setup`,
      transformResponse: (
        response: AdminUserSetup | { data: AdminUserSetup },
      ) => unwrap(response),
      providesTags: (_result, _error, id) => [{ type: "AdminUserSetup", id }],
    }),
    completeAdminOnboarding: builder.mutation<
      unknown,
      { userId: string; expectedRevision: number }
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${encodeURIComponent(userId)}/setup/onboarding`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "AdminUserSetup", id: userId },
      ],
    }),
    changeAdminUserPassword: builder.mutation<
      unknown,
      { userId: string; password: string }
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${encodeURIComponent(userId)}/setup/password`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});
export const {
  useGetAdminUserSetupQuery,
  useCompleteAdminOnboardingMutation,
  useChangeAdminUserPasswordMutation,
} = adminUserSetupApi;
