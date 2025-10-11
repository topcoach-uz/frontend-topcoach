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
    script.src = 'https://cdn.openai.com/chatkit.js';
    script.setAttribute('data-openai-domain-key', 'domain_pk_68ea0f7e6f788190af7076dcc4e6207e04324a1680fbdb81');
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
