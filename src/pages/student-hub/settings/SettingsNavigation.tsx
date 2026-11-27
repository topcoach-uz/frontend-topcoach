import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SettingsSection } from 'src/lib/accountNavigation';
import styles from './MenteeSettingsPageMock.module.scss';
import { useSegmentLens } from 'src/hooks/useSegmentLens';

export default function SettingsNavigation({
  activeTab,
  showExperience = false,
}: {
  activeTab: SettingsSection;
  showExperience?: boolean;
}) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  // iOS-style sliding glass thumb under the active section.
  const lens = useSegmentLens<HTMLElement>('[aria-current="page"]', [activeTab]);
  const sections = [
    // Billing is its own destination (rail → Billing), not a settings tab.
    // Notifications is its own page (sidebar → Notifications), not a tab here.
    { key: 'profile', label: t('accountNav.account', 'Account') },
    { key: 'school', label: t('studentHub.orgMembership.settingsTitle', 'School & counselors') },
    { key: 'referrals', label: t('settings.referrals.tab', 'Referrals') },
    ...(showExperience
      ? [
          {
            key: 'experience',
            label: t('studentHub.settingsMock.experience', 'Experience'),
          },
        ]
      : []),
  ];
  return (
    <nav
      ref={lens.ref}
      className={styles.tabs}
      aria-label={t('accountNav.sections', 'Settings sections')}
    >
      <span className={styles.tabsLens} style={lens.lensStyle} aria-hidden />
      {sections.map((section) => {
        const query = new URLSearchParams(params);
        query.set('section', 'account');
        query.set('target', 'settings');
        query.set('tab', section.key);
        query.delete('clickCheckout');
        query.delete('atmosBind');
        return (
          <Link
            key={section.key}
            to={`/student-hub?${query}`}
            aria-current={activeTab === section.key ? 'page' : undefined}
            className={`${styles.tab} ${activeTab === section.key ? styles.tabActive : ''}`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
