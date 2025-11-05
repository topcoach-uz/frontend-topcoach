import { useState } from 'react';
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
import LeadCapturePopup from 'src/components/lead-capture/LeadCapturePopup';
import { useScrollTrigger } from 'src/hooks/useScrollTrigger';
import { useTypedSelector } from 'src/app/store';

export default function LandingPage() {
  const { searchParams } = useParamsHook();
  const [popupVisible, setPopupVisible] = useState(false);
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const { shouldShow } = useScrollTrigger({
    threshold: 0.03, // Show after 5% scroll (very early - user just started scrolling)
    checkAuth: true,
    isAuthenticated,
  });

  // Dev helper: expose popup control to window for testing
  useLayoutEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as any).__leadCaptureDebug = {
        show: () => {
          localStorage.removeItem('lead-capture-popup-submitted');
          sessionStorage.removeItem('lead-capture-popup-closed');
          setPopupVisible(true);
          console.log('✅ Popup forced to show via debug helper');
        },
        hide: () => {
          setPopupVisible(false);
          console.log('✅ Popup hidden via debug helper');
        },
        clear: () => {
          localStorage.removeItem('lead-capture-popup-submitted');
          sessionStorage.removeItem('lead-capture-popup-closed');
          console.log('✅ Cleared all lead capture storage. Reload page to test.');
        },
        status: () => {
          console.log('=== Lead Capture Debug Status ===');
          console.log('localStorage.submitted:', localStorage.getItem('lead-capture-popup-submitted'));
          console.log('sessionStorage.closed:', sessionStorage.getItem('lead-capture-popup-closed'));
          console.log('shouldShow:', shouldShow);
          console.log('popupVisible:', popupVisible);
          console.log('isAuthenticated:', isAuthenticated);
        },
      };
      console.log('🔧 Lead Capture Debug Helper available! Use window.__leadCaptureDebug.show() to force show popup');
    }
  }, [shouldShow, popupVisible, isAuthenticated]);

  const verified =
    searchParams.get('verified') && !!searchParams.get('verified');

  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (verified) {
      navigate('/auth/verification?verified=true');
    }
  }, []);

  // Show popup when scroll threshold is reached
  // This works on both topcoach.uz and topcoachuni.com for unauthenticated users
  useLayoutEffect(() => {
    const isDev = import.meta.env.DEV;

    // Don't show popup if user is authenticated (on any domain)
    if (isAuthenticated) {
      if (isDev) console.log('[LandingPage] Not showing popup: user is authenticated');
      return;
    }

    // Only check if form was submitted - if yes, never show (domain-specific localStorage)
    const wasSubmitted = localStorage.getItem('lead-capture-popup-submitted');
    if (wasSubmitted === 'true') {
      if (isDev) console.log('[LandingPage] Not showing popup: form was submitted');
      return;
    }

    // Check sessionStorage - only prevents in current page session
    // After page reload or browser restart, sessionStorage clears, so popup can show again
    const wasClosedInSession = sessionStorage.getItem('lead-capture-popup-closed');
    if (wasClosedInSession === 'true') {
      if (isDev) console.log('[LandingPage] Not showing popup: closed in session');
      return;
    }

    // If scroll threshold reached and not closed/submitted, show popup
    // This works on both domains: topcoach.uz and topcoachuni.com
    if (shouldShow && !popupVisible) {
      if (isDev) console.log('[LandingPage] ✅ Showing popup now!');
      // Small delay for better UX
      const timer = setTimeout(() => {
        setPopupVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isDev && shouldShow && popupVisible) {
      console.log('[LandingPage] Popup already visible');
    } else if (isDev) {
      console.log('[LandingPage] Waiting for scroll threshold...', { shouldShow, popupVisible, isAuthenticated });
    }
  }, [shouldShow, popupVisible, isAuthenticated]);

  return (
    <main className={styles.main}>
      <HeroSection />
      <LandingAISearch />
      <LandingEventsSection />
      <ReviewsSection />
      <MentorsSectionLanding />
      <SubscriptionPlans />
      <FaqSection />
      <LeadCapturePopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
      />
    </main>
  );
}
