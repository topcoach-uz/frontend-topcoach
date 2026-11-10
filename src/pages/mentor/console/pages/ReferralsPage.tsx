import { useTranslation } from 'react-i18next';

import ReferralsPanel from 'src/components/referral/ReferralsPanel';

/**
 * Referrals in the mentor console.
 *
 * Mentors are issued referral codes on the same terms as everyone else, but
 * they never open the student hub settings page where the panel originally
 * lived, so without this they had a code with no way to see or share it.
 *
 * Same panel as the student tab, so the two cannot drift.
 */
export default function MentorReferralsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t } = useTranslation();

  return (
    <div>
      {!embedded && (
        <div className="mc-page-head mc-page-head--ruled">
          <div className="mc-page-eyebrow">
            Mentor <span className="mc-page-eyebrow-accent">· Referrals</span>
          </div>
          <h1 className="mc-page-title">{t('settings.referrals.tab', 'Referrals')}</h1>
          <p className="mc-page-lead">
            {t(
              'mentor.referrals.subtitle',
              'Share your code with students. They get a discount, you earn a bonus on what they buy.',
            )}
          </p>
        </div>
      )}

      <ReferralsPanel />
    </div>
  );
}
