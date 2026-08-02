import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Check } from 'lucide-react';

import { COMMUNITY_PLAN_FEATURES } from '../../settings/subscription/_components/plan-features';

interface MajorMatchUpsellProps {
  /** Backend prompt message (e.g. "You used your free AI Major Match attempt…"). */
  message?: string;
  /** Routes the user into the Community funnel (profile → roadmap → subscription). */
  onUnlock: () => void;
}

// Lead with the AI Major Match value, then the broadest-appeal Community
// benefits. Pulled from the canonical plan-features list so this card never
// drifts from settings / roadmap / landing pricing copy.
const HIGHLIGHT_KEYS = [
  'unlimited_ai_major_tool',
  'full_sat_prep_platform',
  'research_prep_course',
  'admissions_foundation',
];

/**
 * Conversion card shown once a student has used their single free AI Major
 * Match attempt. Replaces the old dead-end (a greyed-out button + passive
 * note) with a value-first card and a single CTA into the Community funnel.
 */
export const MajorMatchUpsell: React.FC<MajorMatchUpsellProps> = ({ message, onUnlock }) => {
  const { t } = useTranslation();

  const benefits = HIGHLIGHT_KEYS.map((key) =>
    COMMUNITY_PLAN_FEATURES.find((f) => f.key === key),
  ).filter((f): f is (typeof COMMUNITY_PLAN_FEATURES)[number] => Boolean(f));

  return (
    <section className="majormatch__upsell" aria-labelledby="majormatch-upsell-title">
      <div className="majormatch__upsell-main">
        <div className="majormatch__upsell-eyebrow">
          <Lock size={13} strokeWidth={2.5} />
          {t('studentHub.psychometric.upsellEyebrow', "You've used your free match")}
        </div>
        <h2 id="majormatch-upsell-title" className="majormatch__upsell-title">
          {t('studentHub.psychometric.upsellTitle', 'Unlock unlimited AI Major Match')}
        </h2>
        <p className="majormatch__upsell-lead">
          {message ||
            t(
              'studentHub.psychometric.upsellLead',
              'Re-run your match anytime as your interests sharpen — plus everything else in Community.',
            )}
        </p>
        <ul className="majormatch__upsell-benefits">
          {benefits.map((f) => (
            <li key={f.key} className="majormatch__upsell-benefit">
              <Check size={14} strokeWidth={2.5} />
              <span>
                <strong>{f.title}</strong> — {f.description}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="majormatch__upsell-cta">
        <button
          type="button"
          className="majormatch__btn majormatch__btn--primary majormatch__upsell-btn"
          onClick={onUnlock}
        >
          {t('studentHub.communityLock.unlockCta', 'Unlock Community')}
        </button>
        <div className="majormatch__upsell-fine">
          {t('studentHub.psychometric.upsellTrial', 'Start with a free trial · cancel anytime')}
        </div>
      </div>
    </section>
  );
};
