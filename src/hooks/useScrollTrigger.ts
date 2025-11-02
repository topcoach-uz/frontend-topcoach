import { useState, useEffect, useRef } from 'react';

interface UseScrollTriggerOptions {
  threshold?: number; // Percentage of page scrolled (0-1)
  checkAuth?: boolean; // Check if user is authenticated
  isAuthenticated?: boolean; // User authentication status
}

export function useScrollTrigger(options: UseScrollTriggerOptions = {}) {
  const { threshold = 0.15, checkAuth = true, isAuthenticated = false } = options;
  const [shouldShow, setShouldShow] = useState(false);
  const hasTriggered = useRef(false);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // Don't show popup if user is authenticated
    if (checkAuth && isAuthenticated) {
      if (isDev) console.log('[LeadCapture] Not showing: user is authenticated');
      return;
    }

    // Only check if form was submitted - if submitted, never show again
    const wasSubmitted = localStorage.getItem('lead-capture-popup-submitted');
    if (wasSubmitted === 'true') {
      if (isDev) console.log('[LeadCapture] Not showing: form was already submitted');
      return;
    }

    // Check sessionStorage only - if closed in current session, don't show
    // But after page reload or browser restart, sessionStorage clears, so popup can show again
    const wasClosedInSession = sessionStorage.getItem('lead-capture-popup-closed');
    if (wasClosedInSession === 'true') {
      if (isDev) console.log('[LeadCapture] Not showing: closed in current session');
      return;
    }

    if (hasTriggered.current) {
      return;
    }

    const handleScroll = () => {
      if (hasTriggered.current) {
        return;
      }

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY || window.pageYOffset;
      
      // Handle edge case where page might be shorter than viewport
      let scrollPercentage = 0;
      if (scrollHeight > 0) {
        scrollPercentage = scrolled / scrollHeight;
      } else {
        // If page is shorter than viewport, trigger after minimal scroll (100px)
        if (scrolled >= 100) {
          scrollPercentage = 1;
        }
      }

      if (isDev && scrolled % 200 < 50) { // Log occasionally to avoid spam
        console.log('[LeadCapture] Scroll:', {
          scrolled,
          scrollHeight,
          scrollPercentage: (scrollPercentage * 100).toFixed(1) + '%',
          threshold: (threshold * 100).toFixed(1) + '%',
        });
      }

      if (scrollPercentage >= threshold) {
        hasTriggered.current = true;
        setShouldShow(true);
        if (isDev) console.log('[LeadCapture] ✅ Triggered! Setting shouldShow to true');
      }
    };

    // Wait for page to be fully loaded before checking
    const checkScroll = () => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        handleScroll();
      }, 100);
    };

    // Initial check in case user refreshed at a scrolled position
    if (document.readyState === 'complete') {
      checkScroll();
    } else {
      window.addEventListener('load', checkScroll);
    }

    // Also check on scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', checkScroll);
    };
  }, [threshold, checkAuth, isAuthenticated]);

  const reset = () => {
    hasTriggered.current = false;
    sessionStorage.removeItem('lead-capture-popup-closed');
    setShouldShow(false);
  };

  return { shouldShow, reset };
}

