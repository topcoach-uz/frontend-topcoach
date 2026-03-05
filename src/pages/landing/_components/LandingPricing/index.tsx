import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { StarFilled, CheckOutlined } from '@ant-design/icons';
import { useGetSubscriptionPlansQuery, useGetCurrentSubscriptionQuery } from 'src/app/services/api';
import styles from './landingPricing.module.scss';

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
  'Exchange Program Workshops — Live',
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

export default function LandingPricing() {
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: plansData } = useGetSubscriptionPlansQuery();
  const { data: current } = useGetCurrentSubscriptionQuery(undefined, { skip: !isAuthenticated });

  const [isYearly, setIsYearly] = useState(false);

  const freePlanId = plansData?.find((p) => p.name === 'Free')?.id;
  const standardPlanId = plansData?.find((p) => p.name === 'Standard')?.id;
  const currentPlanId = current?.plan?.id;

  const handleFreeClick = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/auth/signup');
    }
  };

  const handlePremiumClick = () => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    if (currentPlanId === standardPlanId) {
      navigate('/');
      return;
    }
    if (standardPlanId) {
      const amount = isYearly ? 69 : 7;
      navigate(`/payment?planId=${standardPlanId}&amount=${amount}&type=subscription`);
    } else {
      navigate('/auth/signin');
    }
  };

  const handleCustomisedClick = () => {
    window.open('https://forms.gle/1cf3CShA4P8HQeFo8', '_blank');
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Your Plan</h2>
          <p className={styles.subtitle}>
            Unlock your potential with the right mentorship plan for your admission journey.
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
          {/* Free */}
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
                  <CheckOutlined className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`${styles.cta} ${styles.ctaFree}`}
              onClick={handleFreeClick}
            >
              Get Started Free
            </button>
          </div>

          {/* Premium */}
          <div className={`${styles.card} ${styles.popular}`} data-plan="premium">
            <span className={styles.popularBadge}>
              <StarFilled /> Popular
            </span>
            <h3 className={styles.planName}>Premium</h3>
            <p className={styles.planDesc}>Join the TopCoach admissions community</p>
            <div className={styles.price}>
              <span className={styles.priceAmount}>
                ${isYearly ? '69' : '7'}
              </span>
              <span className={styles.pricePeriod}>
                / {isYearly ? 'year' : 'month'}
              </span>
            </div>
            <ul className={styles.features}>
              {PREMIUM_FEATURES.map((f) => (
                <li key={f}>
                  <CheckOutlined className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`${styles.cta} ${styles.ctaPremium}`}
              onClick={handlePremiumClick}
              type="button"
            >
              Get Premium
            </button>
          </div>

          {/* Customised */}
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
                  <CheckOutlined className={styles.check} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`${styles.cta} ${styles.ctaCustomised}`}
              onClick={handleCustomisedClick}
            >
              Register for Office Hours
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
