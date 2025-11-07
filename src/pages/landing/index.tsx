import { useState, useEffect } from 'react';
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
  
  // Use scroll trigger for popup - works on both topcoach.uz and topcoachuni.com
  const { shouldShow } = useScrollTrigger({
    threshold: 0.03, // Show after 5% scroll (very early - user just started scrolling)
    checkAuth: true,
    isAuthenticated,
  });
  
  // Debug: Log current domain and status (works on both domains)
  useEffect(() => {
    const hostname = window.location.hostname;
    const shouldLog = import.meta.env.DEV || hostname.includes('topcoach');
    
    if (shouldLog) {
      console.log('[LandingPage] ===== Lead Capture Status =====');
      console.log('[LandingPage] Domain:', hostname);
      console.log('[LandingPage] Is authenticated:', isAuthenticated);
      console.log('[LandingPage] Should show popup (from hook):', shouldShow);
      console.log('[LandingPage] Popup visible (state):', popupVisible);
      console.log('[LandingPage] localStorage.submitted:', localStorage.getItem('lead-capture-popup-submitted'));
      console.log('[LandingPage] sessionStorage.closed:', sessionStorage.getItem('lead-capture-popup-closed'));
      console.log('[LandingPage] =================================');
    }
  }, [isAuthenticated, shouldShow, popupVisible]);

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
  // Since topcoachuni.com is now the main domain, this ensures it works there too
  useLayoutEffect(() => {
    const hostname = window.location.hostname;
    const shouldLog = import.meta.env.DEV || hostname.includes('topcoach');

    // Don't show popup if user is authenticated (on any domain)
    if (isAuthenticated) {
      if (shouldLog) console.log('[LandingPage] Not showing popup: user is authenticated on', hostname);
      return;
    }

    // Only check if form was submitted - if yes, never show (domain-specific localStorage)
    // localStorage is domain-specific, so submission on topcoach.uz doesn't affect topcoachuni.com
    const wasSubmitted = localStorage.getItem('lead-capture-popup-submitted');
    if (wasSubmitted === 'true') {
      if (shouldLog) console.log('[LandingPage] Not showing popup: form was submitted on', hostname);
      return;
    }

    // Check sessionStorage - only prevents in current page session
    // After page reload or browser restart, sessionStorage clears, so popup can show again
    const wasClosedInSession = sessionStorage.getItem('lead-capture-popup-closed');
    if (wasClosedInSession === 'true') {
      if (shouldLog) console.log('[LandingPage] Not showing popup: closed in session on', hostname);
      return;
    }

    // If scroll threshold reached and not closed/submitted, show popup
    // This works on both domains: topcoach.uz and topcoachuni.com
    if (shouldShow && !popupVisible) {
      if (shouldLog) console.log('[LandingPage] ✅ Showing popup now on', hostname);
      // Small delay for better UX
      const timer = setTimeout(() => {
        setPopupVisible(true);
        if (shouldLog) console.log('[LandingPage] Popup visibility set to true on', hostname);
      }, 500);
      return () => clearTimeout(timer);
    } else if (shouldLog && shouldShow && popupVisible) {
      console.log('[LandingPage] Popup already visible on', hostname);
    } else if (shouldLog) {
      console.log('[LandingPage] Waiting for scroll threshold on', hostname, { shouldShow, popupVisible, isAuthenticated });
    }
  }, [shouldShow, popupVisible, isAuthenticated]);

  return (
    <main className={styles.main}>
      <HeroSection />
      <LandingAISearch />
      <LandingEventsSection />
      <ReviewsSection />
      <MentorsSectionLanding />
      {/* Temporarily hidden - rethinking subscription plans */}
      {/* <SubscriptionPlans /> */}
      <FaqSection />
      <LeadCapturePopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
      />
    </main>
  );
}
