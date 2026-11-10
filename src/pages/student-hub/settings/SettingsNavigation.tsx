import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SettingsSection } from 'src/lib/accountNavigation';
import styles from './MenteeSettingsPageMock.module.scss';

export default function SettingsNavigation({
  activeTab,
  showExperience = false,
}: {
  activeTab: SettingsSection;
  showExperience?: boolean;
}) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const sections = [
    { key: 'profile', label: t('accountNav.account', 'Account') },
    {
      key: 'subscription',
      label: t('accountNav.membership', 'Membership & billing'),
    },
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
      className={styles.tabs}
      aria-label={t('accountNav.sections', 'Settings sections')}
    >
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
