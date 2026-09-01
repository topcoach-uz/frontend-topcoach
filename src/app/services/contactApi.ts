import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './api';
import { trackLead } from 'src/lib/meta-pixel';

// Types
export interface ContactFormRequest {
  fullName: string;
  phoneNumber?: string;
  email: string;
  country?: string;
  howDidYouHear?: string;
  currentEducationLevel?: string;
  additionalMessage?: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}

export interface MentorRequestForm {
  mentorId: string;
  mentorName: string;
  fullName: string;
  phoneNumber: string;
  preferredDates: string;
  message: string;
}

export interface MentorRequestResponse {
  success: boolean;
  message: string;
}

export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery,
  tagTypes: ['ContactForm'],
  endpoints: (builder) => ({
    submitForm: builder.mutation<ContactFormResponse, ContactFormRequest>({
      query: (formData) => ({
        url: 'contact/form',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ContactForm'],
      // Meta Pixel `Lead` fires here rather than in each component because all
      // four lead forms (landing popup, /contact-form, /contact MailForm and the
      // MM3 report modal) share this one mutation — a fifth form gets tracked
      // for free, and none of them can drift out of sync.
      //
      // Only a fulfilled request counts: a 400/429/500 is not a lead, and Meta
      // optimises ad delivery against this event, so a false one costs money.
      async onQueryStarted(_formData, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        trackLead();
      },
    }),
    submitMentorRequest: builder.mutation<MentorRequestResponse, MentorRequestForm>({
      query: (formData) => ({
        url: 'contact/mentor-request',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ContactForm'],
    }),
  }),
});

export const { useSubmitFormMutation, useSubmitMentorRequestMutation } = contactApi;