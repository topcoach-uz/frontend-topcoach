import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLazyGetUniversityDetailQuery } from 'src/app/services/universities';

/**
 * Component that prefetches university data when user is likely to visit university pages
 */
export default function UniversityPrefetch() {
  const location = useLocation();
  const [prefetchUniversity] = useLazyGetUniversityDetailQuery();

  useEffect(() => {
    // Prefetch university data when user is on pages that commonly lead to university pages
    const shouldPrefetch = [
      '/', // Home page
      '/programs', // Programs page
      '/events', // Events page
      '/mentors', // Mentors page (mentors often have university affiliations)
    ].some(path => location.pathname === path);

    if (shouldPrefetch) {
      // Small delay to not interfere with current page loading
      const timer = setTimeout(() => {
        // Prefetch popular universities data
        prefetchPopularUniversities();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, prefetchUniversity]);

  const prefetchPopularUniversities = async () => {
    try {
      // Prefetch a few popular universities that are commonly viewed
      const popularUniversityIds = [
        'a01c8766-d7e0-45e1-b806-26a0a6794fde', // MIT (from the URL you showed)
        // Add more popular university IDs here
      ];

      // Prefetch in parallel using RTK Query
      await Promise.allSettled(
        popularUniversityIds.map(id => 
          prefetchUniversity(id).catch(() => {
            // Silently fail - this is just prefetching
          })
        )
      );
    } catch (error) {
      // Silently fail - this is just prefetching
    }
  };

  return null; // This component doesn't render anything
}
