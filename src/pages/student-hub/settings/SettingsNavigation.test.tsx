import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SettingsNavigation from './SettingsNavigation';
import {
  ACCOUNT_SETTINGS_PATH,
  MEMBERSHIP_BILLING_PATH,
  settingsSection,
} from 'src/lib/accountNavigation';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
describe('settings wayfinding', () => {
  it('separates account details from billing and defaults a bare settings URL to account', () => {
    expect(settingsSection(null)).toBe('profile');
    expect(settingsSection('unknown')).toBe('profile');
    expect(ACCOUNT_SETTINGS_PATH).toContain('tab=profile');
    expect(MEMBERSHIP_BILLING_PATH).toContain('tab=subscription');
  });
  it.each(['profile', 'subscription', 'referrals'] as const)(
    'marks the URL-selected %s section and preserves link navigation',
    (section) => {
      const html = renderToStaticMarkup(
        <MemoryRouter
          initialEntries={[`${MEMBERSHIP_BILLING_PATH}&clickCheckout=returned`]}
        >
          <SettingsNavigation activeTab={section} />
        </MemoryRouter>,
      );
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      const selectedLink = [...html.matchAll(/<a[^>]+>/g)].find((match) =>
        match[0].includes('aria-current="page"'),
      )?.[0];
      expect(selectedLink).toContain(`tab=${section}`);

      expect(html).not.toContain('clickCheckout');
      expect(html).toContain('Membership &amp; billing');
    },
  );
});
