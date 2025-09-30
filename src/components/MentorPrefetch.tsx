import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetMentorsQuery } from 'src/app/services/mentors';

/**
 * Component that prefetches mentor data when user is likely to visit mentors page
 */
export default function MentorPrefetch() {
  const location = useLocation();
  const { refetch: prefetchMentors } = useGetMentorsQuery(undefined, {
    skip: true, // Don't fetch automatically, only on demand
  });

  useEffect(() => {
    // Prefetch mentor data when user is on pages that commonly lead to mentors page
    const shouldPrefetch = [
      '/', // Home page
      '/programs', // Programs page
      '/events', // Events page
      '/universities', // Universities page
    ].some(path => location.pathname === path);

    if (shouldPrefetch) {
      // Small delay to not interfere with current page loading
      const timer = setTimeout(() => {
        prefetchMentors();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, prefetchMentors]);

  return null; // This component doesn't render anything
}
