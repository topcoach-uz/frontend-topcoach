import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './api';

// Types
export interface ContactFormRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  country: string;
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