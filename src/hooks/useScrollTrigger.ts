import { useState, useEffect, useRef } from 'react';

interface UseScrollTriggerOptions {
  threshold?: number; // Percentage of page scrolled (0-1)
  checkAuth?: boolean; // Check if user is authenticated
  isAuthenticated?: boolean; // User authentication status
}

export function useScrollTrigger(options: UseScrollTriggerOptions = {}) {
  const { threshold = 0.03, checkAuth = true, isAuthenticated = false } = options;
  const [shouldShow, setShouldShow] = useState(false);
  const hasTriggered = useRef(false);
  const isDev = import.meta.env.DEV;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    // Log domain for debugging (works in both dev and production for topcoach domains)
    const shouldLog = isDev || hostname.includes('topcoach');
    
    if (shouldLog) {
      console.log('[LeadCapture] Initializing on domain:', hostname, {
        isAuthenticated,
        checkAuth,
        threshold,
      });
    }

    // Don't show popup if user is authenticated
    if (checkAuth && isAuthenticated) {
      if (shouldLog) console.log('[LeadCapture] Not showing: user is authenticated');
      return;
    }

    // Check for reset parameter in URL (for testing/debugging)
    const urlParams = new URLSearchParams(window.location.search);
    const resetPopup = urlParams.get('reset-popup');
    if (resetPopup === 'true') {
      localStorage.removeItem('lead-capture-popup-submitted');
      sessionStorage.removeItem('lead-capture-popup-closed');
      if (shouldLog) console.log('[LeadCapture] Reset popup flags via URL parameter on', hostname);
      // Remove the parameter from URL without reload
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]reset-popup=true/, '').replace(/^\?/, '?').replace(/^&/, '?');
      window.history.replaceState({}, '', newUrl || window.location.pathname);
    }

    // Only check if form was submitted - if submitted, never show again
    // Note: localStorage is domain-specific, so submission on one domain doesn't affect the other
    // However, we allow reset via URL parameter for testing
    const wasSubmitted = localStorage.getItem('lead-capture-popup-submitted');
    if (wasSubmitted === 'true') {
      if (shouldLog) console.log('[LeadCapture] Not showing: form was already submitted on', hostname);
      if (shouldLog) console.log('[LeadCapture] To reset, add ?reset-popup=true to the URL');
      return;
    }

    // Check sessionStorage only - if closed in current session, don't show
    // But after page reload or browser restart, sessionStorage clears, so popup can show again
    const wasClosedInSession = sessionStorage.getItem('lead-capture-popup-closed');
    if (wasClosedInSession === 'true') {
      if (shouldLog) console.log('[LeadCapture] Not showing: closed in current session on', hostname);
      return;
    }

    if (hasTriggered.current) {
      if (shouldLog) console.log('[LeadCapture] Already triggered, skipping');
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
        // If page is shorter than viewport, trigger after very minimal scroll (50px)
        if (scrolled >= 50) {
          scrollPercentage = 1;
        }
      }

      // Also trigger immediately if user has scrolled at least 150px regardless of page height
      // This ensures popup shows early even on long pages
      if (scrolled >= 150 && scrollPercentage < threshold) {
        scrollPercentage = threshold;
      }

      const shouldLog = isDev || hostname.includes('topcoach');
      
      if (shouldLog && scrolled % 200 < 50) { // Log occasionally to avoid spam
        console.log('[LeadCapture] Scroll on', hostname, ':', {
          scrolled,
          scrollHeight,
          scrollPercentage: (scrollPercentage * 100).toFixed(1) + '%',
          threshold: (threshold * 100).toFixed(1) + '%',
        });
      }

      if (scrollPercentage >= threshold) {
        hasTriggered.current = true;
        setShouldShow(true);
        if (shouldLog) console.log('[LeadCapture] ✅ Triggered on', hostname, '! Setting shouldShow to true');
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

