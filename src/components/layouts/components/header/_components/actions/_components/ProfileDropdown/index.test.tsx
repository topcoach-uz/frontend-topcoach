import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import ProfileDropdown from './index';
import { UserRole } from 'src/app/api/Api';
vi.mock('src/app/store', () => ({
  useTypedSelector: (select: (state: unknown) => unknown) =>
    select({
      auth: { profile: { profile: { role: UserRole.Student, media: [] } } },
    }),
}));
vi.mock('src/hooks/useOrgStaff', () => ({
  default: () => ({ isOrgStaff: false }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
it('provides a native keyboard-accessible account menu trigger with an accessible name and expanded state', () => {
  const html = renderToStaticMarkup(<ProfileDropdown profileMenuItems={[]} />);
  expect(html).toContain('<button');
  expect(html).toContain('type="button"');
  expect(html).toContain('aria-label="Open account menu"');
  expect(html).toContain('aria-haspopup="menu"');
  expect(html).toContain('aria-expanded="false"');
});
