/**
 * Public API service for landing-page testimonials
 */
import { RtkApi } from './api';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  context: string | null;
  quote: string;
  avatarUrl: string | null;
  rating: number | null;
  sortOrder: number;
}

export const testimonialsApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get public testimonials (landing page)
    getTestimonials: builder.query<{ data: Testimonial[] }, void>({
      query: () => ({
        url: '/testimonials',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetTestimonialsQuery } = testimonialsApi;
