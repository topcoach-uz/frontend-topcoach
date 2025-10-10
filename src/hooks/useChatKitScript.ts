import { useEffect, useState } from 'react';

/**
 * Hook to dynamically load ChatKit script only when needed
 * This prevents domain verification issues on localhost
 */
export const useChatKitScript = (shouldLoad: boolean) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!shouldLoad || isLoaded || isLoading) return;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="chatkit.js"]');
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);

    const script = document.createElement('script');
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
    script.setAttribute('data-public-key', 'domain_pk_68e8ce9d37f88190b434865ed70fc50e0ff9ae4f9c445521');
    script.async = true;
    
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      console.error('Failed to load ChatKit script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [shouldLoad, isLoaded, isLoading]);

  return { isLoaded, isLoading };
};
