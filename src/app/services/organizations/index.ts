import { RtkApi } from '../api';

/** Backend returns the array directly (not { data: array }). */
export const organizationsApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getMyOrganizations: build.query<unknown[], void>({
      query: () => ({ url: '/organizations/my-organizations' }),
    }),
  }),
});

export const { useGetMyOrganizationsQuery } = organizationsApi;
