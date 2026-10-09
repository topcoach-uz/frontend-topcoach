import { satPrepApi } from "./index";
export interface SatStudyGoal {
  targetScore: number | null;
}
const goalApi = satPrepApi.injectEndpoints({
  endpoints: (builder) => ({
    getSatStudyGoal: builder.query<SatStudyGoal, void>({
      query: () => "/sat-questions/study-goal/me",
      providesTags: ["SatBank"],
    }),
    setSatStudyGoal: builder.mutation<SatStudyGoal, SatStudyGoal>({
      query: (body) => ({
        url: "/sat-questions/study-goal/me",
        method: "PUT",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            goalApi.util.updateQueryData(
              "getSatStudyGoal",
              undefined,
              (draft) => {
                draft.targetScore = data.targetScore;
              },
            ),
          );
        } catch {
          /* The form reports write failures and stays open. */
        }
      },
    }),
  }),
});
export const { useGetSatStudyGoalQuery, useSetSatStudyGoalMutation } = goalApi;
