import { useState } from 'react';
import { RtkApi } from 'src/app/services/api';
import { useCreateFullSupportCheckoutMutation } from 'src/app/services/fullSupportCheckoutApi';

type Offer = { id: string; program: string; programName: string; amountUzs: number; currency: 'UZS' };
const api = RtkApi.injectEndpoints({ endpoints: builder => ({
  programPaymentOffers: builder.query<{data: Offer[]}, void>({
    query: () => ({url: '/program-checkout/offers', method: 'GET'}), keepUnusedDataFor: 0,
  }),
}) });
export function ProgramPayments() {
  const {data, isLoading, isError, refetch} = api.useProgramPaymentOffersQuery(undefined, {pollingInterval: 10000, refetchOnFocus: true, refetchOnMountOrArgChange: true});
  const [checkout, {isLoading: paying}] = useCreateFullSupportCheckoutMutation();
  const [error, setError] = useState('');
  async function pay(offer: Offer) {
    setError('');
    try {
      const result = await checkout({offerId: offer.id}).unwrap();
      const url = new URL(result.data.url);
      if (url.origin !== 'https://my.click.uz' || url.pathname !== '/services/pay') throw new Error('Invalid checkout');
      window.location.assign(url.toString());
    } catch {
      setError('Could not open payment. Refresh payment details and try again.');
      void refetch();
    }
  }
  if (isLoading) return <p role="status">Checking program payments…</p>;
  if (isError) return <div className="mp-panel"><p>Payment details could not be loaded.</p><button className="mp-secondary" onClick={()=>void refetch()}>Retry payments</button></div>;
  if (!data?.data.length) return null;
  return <section className="mp-panel mp-section" aria-label="Program payments">
    <h2>Ready for payment</h2>
    <p className="mp-muted">Your agreed prices. Program access starts after CLICK confirms payment.</p>
    {data.data.map(offer=><div className="mp-row" key={offer.id}>
      <div><strong>{offer.programName}</strong><p>{new Intl.NumberFormat('en-US').format(offer.amountUzs)} UZS · One-time payment</p></div>
      <button className="mp-primary" disabled={paying} onClick={()=>void pay(offer)}>Pay for {offer.programName}</button>
    </div>)}
    {error && <p role="alert">{error}</p>}
  </section>;
}
