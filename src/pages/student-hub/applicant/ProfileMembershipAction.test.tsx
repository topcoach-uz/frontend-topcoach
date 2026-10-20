import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ProfileMembershipAction from './ProfileMembershipAction';
import type { ProfileMembership } from './profileMembershipModel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (_key: string, fallback: string, values?: { date?: string }) =>
      fallback.replace('{{date}}', values?.date ?? ''),
  }),
}));

const render = (membership: ProfileMembership, extra = {}) =>
  renderToStaticMarkup(
    <StaticRouter location="/student-hub/overview">
      <ProfileMembershipAction membership={membership} {...extra} />
    </StaticRouter>,
  );

describe('membership profile action', () => {
  it.each([
    ['unpaid', 'Join Community'],
    ['pending', 'Payment pending'],
    ['active', 'Community active'],
    ['expired', 'Renew Community'],
  ] as const)(
    'routes %s to billing instead of making a payment directly',
    (state, label) => {
      const html = render({ state, expiresAt: null });
      expect(html).toContain(label);
      expect(html).toContain('target=settings&amp;tab=subscription');
      expect(html).not.toContain('my.click.uz');
      expect(html.match(/<a /g)).toHaveLength(1);
    },
  );
  it('shows a real expiry for active access without an upsell', () => {
    const html = render({ state: 'active', expiresAt: '2026-11-18T12:00:00Z' });
    expect(html).toContain('Until Nov 18, 2026');
    expect(html).not.toContain('Join Community');
  });
  it('does not flash an upsell while membership is loading', () => {
    const html = render(
      { state: 'unpaid', expiresAt: null },
      { loading: true },
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('<a ');
  });
  it('falls back to neutral billing navigation when server checks fail', () => {
    const html = render(
      { state: 'unpaid', expiresAt: null },
      { unavailable: true },
    );
    expect(html).toContain('Membership &amp; billing');
    expect(html).not.toContain('Join Community');
    expect(html).not.toContain('Payment pending');
  });
});
