import { useState } from 'react';
import { Modal, message } from 'antd';
import { Star, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../../landing/_components/LandingPricing/landingPricing.module.scss';

const FREE_FEATURES = [
  'Personalised College List',
  'Application Tracker',
  'Mentor Match',
  'GPA Calculator',
  'Workshops',
  '24/7 AI Support',
];

const PREMIUM_FEATURES = [
  'Admissions Program',
  'Gamified Research Program',
  'Startup & PM Program',
  'Exchange Program Workshops (live)',
  'Weekly Live Workshops',
  'College Perks',
  'AI Tools for Admissions & Essays',
];

const CUSTOMISED_FEATURES = [
  'Everything in Premium',
  'Unlimited Mentorship',
  'Dedicated Advisor',
  'Priority Support',
  'Custom Timeline',
];

export interface BillingPlansModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Subscription tiers modal using landing pricing styles.
 */
export default function BillingPlansModal({ open, onClose }: BillingPlansModalProps) {
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);

  const notifyPlanAction = (key: string, fallback?: string) =>
    message.info(t(key, fallback ?? key));

  return (
    <Modal
      title={t('studentHub.settingsMock.billingModalTitle', 'Choose your plan')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      zIndex={1100}
      destroyOnClose
      styles={{ body: { maxHeight: '85vh', overflowY: 'auto', paddingTop: 16 } }}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.subtitle}>
            {t(
              'studentHub.settingsMock.billingModalSubtitle',
              'Unlock your potential with the right mentorship plan for your admission journey.',
            )}
          </p>
          <div className={styles.toggle}>
            <span className={styles.toggleLabel}>Monthly</span>
            <button
              type="button"
              className={styles.toggleTrack}
              onClick={() => setIsYearly(!isYearly)}
              role="switch"
              aria-checked={isYearly}
              aria-label={isYearly ? 'Yearly billing' : 'Monthly billing'}
            >
              <span className={`${styles.toggleKnob} ${isYearly ? styles.yearly : ''}`} />
            </button>
            <span className={styles.toggleLabel}>
              Yearly
              <span className={styles.save}>Save $15</span>
            </span>
          </div>
        </div>

        <div className={styles.cards}>
          <div className={styles.card} data-plan="free">
            <span className={styles.topBadge}>FREE FOREVER</span>
            <h3 className={styles.planName}>Free</h3>
            <p className={styles.planDesc}>Essential tools to get started</p>
            <div className={styles.price}>
              <span className={styles.priceAmount}>$0</span>
              <span className={styles.pricePeriod}>/ forever</span>
            </div>
            <ul className={styles.features}>
              {FREE_FEATURES.map((f) => (
                <li key={f}>
                  <Check size={16} className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaFree}`}
              onClick={() =>
                notifyPlanAction('studentHub.settingsMock.billingMockFree', 'You are currently on the free tier.')
              }
            >
              Get Started Free
            </button>
          </div>

          <div className={`${styles.card} ${styles.popular}`} data-plan="premium">
            <span className={styles.popularBadge}>
              <Star size={16} /> Popular
            </span>
            <h3 className={styles.planName}>Premium</h3>
            <p className={styles.planDesc}>Join the TopCoach admissions community</p>
            <div className={styles.price}>
              <span className={styles.priceAmount}>${isYearly ? '69' : '7'}</span>
              <span className={styles.pricePeriod}>/ {isYearly ? 'year' : 'month'}</span>
            </div>
            <ul className={styles.features}>
              {PREMIUM_FEATURES.map((f) => (
                <li key={f}>
                  <Check size={16} className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaPremium}`}
              onClick={() =>
                notifyPlanAction(
                  'studentHub.settingsMock.billingMockPremium',
                  'Premium checkout will be available soon.',
                )
              }
            >
              Get Premium
            </button>
          </div>

          <div className={styles.card} data-plan="customised">
            <span className={styles.topBadge}>TAILORED FOR YOU</span>
            <h3 className={styles.planName}>Customised</h3>
            <p className={styles.planDesc}>Mentorship tailored to your needs</p>
            <div className={styles.price}>
              <span className={styles.priceCustom}>Custom</span>
            </div>
            <ul className={styles.features}>
              {CUSTOMISED_FEATURES.map((f) => (
                <li key={f}>
                  <Check size={16} className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaCustomised}`}
              onClick={() => window.open('https://forms.gle/1cf3CShA4P8HQeFo8', '_blank', 'noopener,noreferrer')}
            >
              Register for Office Hours
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
