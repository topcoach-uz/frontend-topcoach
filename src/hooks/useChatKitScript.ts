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
    
    // Use the correct domain key based on current domain
    const currentDomain = window.location.hostname;
    const domainKey = currentDomain === 'www.topcoach.uz' 
      ? 'domain_pk_68ea1ac1125c819083163c52db3a0c6d0dd72be5369028be'
      : 'domain_pk_68ea0f7e6f788190af7076dcc4e6207e04324a1680fbdb81';
    
    script.setAttribute('data-public-key', domainKey);
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
