import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionTab from './index';

const fixture = vi.hoisted(() => ({ subscription: null as unknown }));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams()],
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('src/app/services/student-hub/orgMembershipApi', () => ({
  useGetMyOrgMembershipQuery: () => ({ data: [] }),
}));
vi.mock('src/app/services/subscription', () => ({
  useGetSubscriptionPlansQuery: () => ({
    data: [
      {
        id: 'monthly',
        name: 'community',
        priceUzs: 146766,
        billingPeriodDays: 30,
      },
    ],
    refetch: vi.fn(),
  }),
  useGetCurrentSubscriptionQuery: () => ({
    data: fixture.subscription,
    refetch: vi.fn(),
  }),
  useGetPaymentMethodsQuery: () => ({ data: [], refetch: vi.fn() }),
  useGetBillingHistoryQuery: () => ({ data: [], refetch: vi.fn() }),
  useChangeSubscriptionPlanMutation: () => [vi.fn()],
}));
vi.mock('src/app/services/paymentRedirect', () => ({
  paymentRedirectWithTimeout: vi.fn(),
}));
vi.mock('./_components/CurrentPlanCard', () => ({
  default: () => <div>Recurring agreement</div>,
}));
vi.mock('./_components/AvailablePlans', () => ({
  default: () => <div>Recurring plan switch</div>,
}));
vi.mock('./_components/PaymentMethods', () => ({
  default: () => <div>Saved card form</div>,
}));
vi.mock('./_components/BillingHistory', () => ({
  default: () => <div>Billing history</div>,
  BillingHistoryHeaderActions: () => null,
}));

beforeEach(() => {
  fixture.subscription = null;
  vi.stubGlobal('window', { location: { search: '' } });
});

describe('Community purchase routes', () => {
  it.each([
    null,
    { status: 'pending', autoRenew: false, plan: { id: 'monthly' } },
  ])(
    'offers only hosted Click payment for an unpaid checkout',
    (subscription) => {
      fixture.subscription = subscription;
      const html = renderToStaticMarkup(<SubscriptionTab />);
      expect(html).toContain('Continue to Click');
      expect(html).not.toContain('Saved card form');
      expect(html).not.toContain('Recurring plan switch');
      expect(html).not.toContain('Start trial');
    },
  );
  it('shows confirmed hosted access without offering another payment', () => {
    fixture.subscription = {
      status: 'active',
      autoRenew: false,
      plan: { id: 'monthly' },
      currentPeriodEnd: '2026-11-18T12:58:41Z',
    };
    const html = renderToStaticMarkup(<SubscriptionTab />);
    expect(html).toContain('Access until');
    expect(html).not.toContain('Continue to Click');
    expect(html).not.toContain('Saved card form');
  });
  it('keeps management for an existing recurring agreement', () => {
    fixture.subscription = {
      status: 'active',
      autoRenew: true,
      plan: { id: 'monthly' },
    };
    const html = renderToStaticMarkup(<SubscriptionTab />);
    expect(html).toContain('Recurring agreement');
    expect(html).toContain('Recurring plan switch');
    expect(html).toContain('Saved card form');
    expect(html).not.toContain('Continue to Click');
  });
});
