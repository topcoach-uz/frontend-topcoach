import HeroSection from './_components/hero';
import LandingAISearch from './_components/AISearch';
import LandingEventsSection from './_components/events';
import ReviewsSection from './_components/reviews';
import MentorsSectionLanding from './_components/mentors';
import FaqSection from './_components/FAQ';
import styles from './landing.module.scss';
import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useParamsHook from 'src/hooks/params';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';

export default function LandingPage() {
  const { searchParams } = useParamsHook();

  const verified =
    searchParams.get('verified') && !!searchParams.get('verified');

  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (verified) {
      navigate('/auth/verification?verified=true');
    }
  }, []);

  return (
    <main className={styles.main}>
      <HeroSection />
      <LandingAISearch />
      <LandingEventsSection />
      <ReviewsSection />
      <MentorsSectionLanding />
      <SubscriptionPlans />
      <FaqSection />
    </main>
  );
}
