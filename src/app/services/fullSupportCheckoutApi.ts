import { RtkApi } from "./api";
export type FullSupportPaymentState = {
  enrolled: boolean;
  accountEmail?: string;
  offer: {
    id: string;
    amountUzs: number;
    currency: "UZS";
    status: "authorized" | "paid";
    paidAt?: string | null;
  } | null;
};
export const fullSupportCheckoutApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getFullSupportPayment: builder.query<
      { data: FullSupportPaymentState },
      void
    >({
      query: () => ({ url: "/full-support-checkout/me", method: "GET" }),
      keepUnusedDataFor: 0,
    }),
    createFullSupportCheckout: builder.mutation<
      {
        data: {
          url: string;
          amountUzs: number;
          currency: "UZS";
          orderId: string;
        };
      },
      { offerId: string }
    >({
      query: (body) => ({
        url: "/full-support-checkout/checkout",
        method: "POST",
        body,
      }),
    }),
  }),
});
export const {
  useGetFullSupportPaymentQuery,
  useCreateFullSupportCheckoutMutation,
} = fullSupportCheckoutApi;
