import { useState, useEffect, useRef, useCallback } from 'react';
import { ApplicationStatusEnum } from 'src/app/api/Api';

interface MenteeEvent {
  id: string;
  status: ApplicationStatusEnum;
  updatedAt: string;
}

// Debug helper function (can be removed in production)
const debugCelebrationState = (events: MenteeEvent[]) => {
  const acceptedEvents = events.filter(
    (event) => event.status === ApplicationStatusEnum.Successful
  );
  const recentlyAcceptedEvents = acceptedEvents.filter((event) =>
    isRecentlyUpdated(event.updatedAt)
  );
  const celebratedEvents = JSON.parse(
    localStorage.getItem('celebratedAcceptedEvents') || '[]'
  );

  console.log('🎉 Debug Celebration State:', {
    acceptedEventIds: acceptedEvents.map((e) => e.id),
    recentlyAcceptedEventIds: recentlyAcceptedEvents.map((e) => ({
      id: e.id,
      updatedAt: e.updatedAt,
      isRecent: isRecentlyUpdated(e.updatedAt),
    })),
    celebratedEventIds: celebratedEvents,
    shouldShowConfetti: recentlyAcceptedEvents.some(
      (event) => !celebratedEvents.includes(event.id)
    ),
  });
};

// Helper function to check if event was updated within the last 2 days
export const isRecentlyUpdated = (updatedAt: string): boolean => {
  const eventDate = new Date(updatedAt);
  const currentDate = new Date();
  const CELEBRATION_WINDOW_DAYS = 2; // Configurable: show celebration for events updated within this many days
  const celebrationWindowMs = CELEBRATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return currentDate.getTime() - eventDate.getTime() <= celebrationWindowMs;
};

// Utility function for testing - run this in browser console to reset celebration state
// localStorage.removeItem('celebratedAcceptedEvents'); console.log('🎉 Celebration state reset!');

// Testing helper: Check if a specific date would trigger celebration
// Example: testDateEligibility('2025-06-04T10:00:00Z') - 2 days ago from June 6
// Example: testDateEligibility('2025-06-03T10:00:00Z') - 3 days ago from June 6 (should not trigger)
// window.testDateEligibility = (dateString) => console.log(`Date ${dateString} is eligible:`, (new Date().getTime() - new Date(dateString).getTime()) <= (2 * 24 * 60 * 60 * 1000));

export const useConfettiCelebration = (events: MenteeEvent[]) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLElement | null>(null); // Initialize celebration state based on localStorage and current events
  useEffect(() => {
    const acceptedEvents = events.filter(
      (event) => event.status === ApplicationStatusEnum.Successful
    );

    // Only consider recently updated accepted events (within 2 days)
    const recentlyAcceptedEvents = acceptedEvents.filter((event) =>
      isRecentlyUpdated(event.updatedAt)
    );

    if (recentlyAcceptedEvents.length > 0) {
      // Debug current state
      //   debugCelebrationState(events);

      const celebratedEvents = JSON.parse(
        localStorage.getItem('celebratedAcceptedEvents') || '[]'
      );

      // Check if all recently accepted events have been celebrated
      const allRecentEventsCelebrated = recentlyAcceptedEvents.every((event) =>
        celebratedEvents.includes(event.id)
      );

      setHasShownCelebration(allRecentEventsCelebrated);
    } else {
      setHasShownCelebration(true); // No recent events, so no need to show celebration
    }
  }, [events]);
  // Function to check and trigger confetti
  const checkAndTriggerConfetti = useCallback(() => {
    // Prevent showing confetti if we're already showing it or have already shown celebration
    if (showConfetti || hasShownCelebration) {
      return;
    }

    // Check if there are any accepted events that were recently updated (within 2 days)
    const acceptedEvents = events.filter(
      (event) => event.status === ApplicationStatusEnum.Successful
    );

    const recentlyAcceptedEvents = acceptedEvents.filter((event) =>
      isRecentlyUpdated(event.updatedAt)
    );

    if (recentlyAcceptedEvents.length > 0) {
      // Check localStorage to see if we've already shown celebration for any accepted event
      const celebratedEvents = JSON.parse(
        localStorage.getItem('celebratedAcceptedEvents') || '[]'
      );

      // Find if there's any new recently accepted event that hasn't been celebrated
      const newRecentAcceptedEvents = recentlyAcceptedEvents.filter(
        (event) => !celebratedEvents.includes(event.id)
      );

      if (newRecentAcceptedEvents.length > 0) {
        // Show confetti
        setShowConfetti(true);
        setHasShownCelebration(true);

        // Update localStorage with the new celebrated event IDs
        const newEventIds = newRecentAcceptedEvents.map((event) => event.id);
        const updatedCelebratedEvents = [...celebratedEvents, ...newEventIds];
        localStorage.setItem(
          'celebratedAcceptedEvents',
          JSON.stringify(updatedCelebratedEvents)
        );
      }
    }

    debugCelebrationState(events); // Call the debug function
  }, [events, hasShownCelebration, showConfetti]);

  // Set up intersection observer
  const setTargetRef = useCallback(
    (element: HTMLElement | null) => {
      targetRef.current = element;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (element) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                // Element is visible, check if we should trigger confetti
                checkAndTriggerConfetti();
              }
            });
          },
          {
            threshold: 0.5, // Trigger when 50% of the element is visible
            rootMargin: '0px 0px -100px 0px', // Trigger a bit before fully visible
          }
        );

        observerRef.current.observe(element);
      }
    },
    [checkAndTriggerConfetti]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return {
    showConfetti,
    handleConfettiComplete,
    setTargetRef,
  };
};
