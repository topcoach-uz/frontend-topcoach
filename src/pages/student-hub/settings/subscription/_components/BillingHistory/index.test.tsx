import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import BillingHistory from './index';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
const payment = {
  id: 'paid-click',
  date: '2026-10-19T12:58:41Z',
  description: 'Community · Monthly',
  amountUzs: 1000,
  amountUsd: 0,
  status: 'paid' as const,
  invoiceNumber: '3951331814',
};
describe('confirmed Click payments', () => {
  it('shows the actual UZS charge in both responsive layouts without a misleading zero USD price', () => {
    const html = renderToStaticMarkup(<BillingHistory entries={[payment]} />);
    expect(html).toContain('1');
    expect(html).toContain('000');
    expect(html).toContain('UZS');
    expect(html).not.toContain('$0.00');
    expect(html).not.toContain('≈');
    expect(html).toContain('<dl');
    expect(html).toContain('3951331814');
    expect(html.match(/scope="col"/g)).toHaveLength(5);
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain('PDF');
  });
  it('shows an honest empty state', () => {
    expect(renderToStaticMarkup(<BillingHistory entries={[]} />)).toContain(
      'No invoices yet',
    );
  });
});
