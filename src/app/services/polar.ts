import { RtkApi } from "./api";

export interface PolarCommunityProduct {
  productId: string;
  name: string;
  durationMonths: number;
  amountMinor: number;
  currency: string;
}

export const polarApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getPolarProducts: builder.query<PolarCommunityProduct[], void>({
      query: () => "payments/polar/products",
    }),
    createPolarCheckout: builder.mutation<
      { url: string },
      { productId: string }
    >({
      query: (body) => ({
        url: "payments/polar/checkout",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetPolarProductsQuery, useCreatePolarCheckoutMutation } =
  polarApi;
