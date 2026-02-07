import { RtkApi } from '../api';

export interface MentorAvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionDuration: string;
  bufferMinutes?: number;
  isActive?: boolean;
  updatedAt?: string;
}

export interface MentorAvailabilityResponse {
  timezone: string;
  slots: MentorAvailabilitySlot[];
  overrides: Array<{
    id: string;
    date: string;
    isBlocked: boolean;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface SetMentorAvailabilityDto {
  timezone: string;
  slots: Omit<MentorAvailabilitySlot, 'id'>[];
}

export interface AvailableSlot {
  start: string;
  end: string;
  type: string;
}

export const availabilityApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getMentorAvailability: build.query<MentorAvailabilityResponse, string>({
      query: (mentorId) => ({
        url: `/availability/mentor/${mentorId}`,
      }),
      providesTags: ['MentorAvailability'],
    }),
    getAvailableSlots: build.query<
      AvailableSlot[],
      { mentorId: string; from: string; to: string; timezone?: string; clientNow?: string }
    >({
      query: ({ mentorId, from, to, timezone, clientNow }) => ({
        url: '/availability/slots',
        params: { mentorId, from, to, timezone, clientNow },
      }),
      providesTags: ['AvailableSlots'],
    }),
    setMyAvailability: build.mutation<MentorAvailabilitySlot[], SetMentorAvailabilityDto>({
      query: (body) => ({
        url: '/availability/mentor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MentorAvailability', 'AvailableSlots', 'GetMentorDetail'],
    }),
  }),
});

export const {
  useGetMentorAvailabilityQuery,
  useLazyGetMentorAvailabilityQuery,
  useGetAvailableSlotsQuery,
  useLazyGetAvailableSlotsQuery,
  useSetMyAvailabilityMutation,
} = availabilityApi;
