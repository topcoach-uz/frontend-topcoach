import { useEffect } from 'react';
import './ElevenLabsWidget.module.scss';

// Global flag to prevent multiple widget initializations
declare global {
  interface Window {
    elevenLabsWidgetInitialized?: boolean;
    watermarkInterval?: NodeJS.Timeout;
  }
}

// Function to hide watermark elements
const hideWatermark = () => {
  // Target various possible watermark selectors
  const watermarkSelectors = [
    '[class*="powered-by"]',
    '[class*="branding"]',
    '[class*="watermark"]',
    '[class*="footer"]',
    '[class*="credit"]',
    '[class*="attribution"]',
    'small',
    '.small-text',
    '.tiny-text',
    '.micro-text',
    '.widget-footer',
    '.convai-footer',
    '.elevenlabs-footer',
    '.branding-footer',
    '.credit-footer',
    '.attribution',
    '.attribution-text',
    '.widget-attribution',
    '.convai-attribution'
  ];

  // Hide elements by selectors
  watermarkSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.textContent?.includes('Powered by') ||
          element.textContent?.includes('ElevenLabs') ||
          element.textContent?.includes('Agents')) {
        (element as HTMLElement).style.display = 'none';
        (element as HTMLElement).style.visibility = 'hidden';
        (element as HTMLElement).style.opacity = '0';
        (element as HTMLElement).style.height = '0';
        (element as HTMLElement).style.minHeight = '0';
        (element as HTMLElement).style.padding = '0';
        (element as HTMLElement).style.margin = '0';
        (element as HTMLElement).style.fontSize = '0';
        (element as HTMLElement).style.lineHeight = '0';
      }
    });
  });

  // Also target any text nodes that might contain the watermark
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent?.includes('Powered by ElevenLabs') ||
        node.textContent?.includes('Powered by') ||
        node.textContent?.includes('ElevenLabs Agents')) {
      const parent = node.parentElement;
      if (parent) {
        parent.style.display = 'none';
        parent.style.visibility = 'hidden';
        parent.style.opacity = '0';
        parent.style.height = '0';
        parent.style.minHeight = '0';
        parent.style.padding = '0';
        parent.style.margin = '0';
        parent.style.fontSize = '0';
        parent.style.lineHeight = '0';
      }
    }
  }
};

const ElevenLabsWidget = () => {
  useEffect(() => {
    // Function to ensure widget is visible
    const ensureWidgetVisible = () => {
      const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
      if (widget) {
        widget.style.display = 'block';
        widget.style.visibility = 'visible';
        widget.style.opacity = '1';
        widget.style.position = 'fixed';
        widget.style.bottom = '20px';
        widget.style.right = '20px';
        widget.style.zIndex = '9999';
      }
    };

    // Check if widget is already initialized globally
    if (window.elevenLabsWidgetInitialized) {
      // Still ensure it's visible
      setTimeout(ensureWidgetVisible, 100);
      return;
    }

    // Check if widget is already loaded to prevent duplicates
    if (document.querySelector('elevenlabs-convai')) {
      // Ensure it's visible even if it exists
      ensureWidgetVisible();
      window.elevenLabsWidgetInitialized = true;
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      // Script loaded but widget might not be created yet, wait a bit and check again
      const checkInterval = setInterval(() => {
        const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
        if (widget) {
          ensureWidgetVisible();
          window.elevenLabsWidgetInitialized = true;
          clearInterval(checkInterval);
        }
      }, 500);
      
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    // Create the ElevenLabs conversation widget with updated configuration
    const convaiElement = document.createElement('elevenlabs-convai');
    convaiElement.setAttribute('agent-id', 'agent_4101k7bhh5rmevhscwt844tnwd1a');

    // Set widget behavior
    convaiElement.setAttribute('data-placement', 'bottom-right');
    convaiElement.setAttribute('data-variant', 'compact');
    convaiElement.setAttribute('data-expanded-behavior', 'starts-collapsed');

    // Show your custom logo (removed avatar hiding and orb color overrides)
    convaiElement.setAttribute('data-hide-avatar', 'false');
    convaiElement.setAttribute('data-hide-logo', 'false');

    // Create and load the script with updated URL
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';

    // Add error handling
    script.onerror = () => {
      console.warn('Failed to load ElevenLabs widget script');
    };

    // Add success callback
    script.onload = () => {
      window.elevenLabsWidgetInitialized = true;

      // Ensure widget is visible
      setTimeout(() => {
        const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
        if (widget) {
          widget.style.display = 'block';
          widget.style.visibility = 'visible';
          widget.style.opacity = '1';
          widget.style.position = 'fixed';
          widget.style.bottom = '20px';
          widget.style.right = '20px';
          widget.style.zIndex = '9999';
        }
        
        // Hide watermark after widget loads
        hideWatermark();
      }, 500);

      // Set up periodic check to hide watermark and ensure visibility
      const watermarkInterval = setInterval(() => {
        hideWatermark();
        // Ensure widget stays visible
        const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
        if (widget) {
          widget.style.display = 'block';
          widget.style.visibility = 'visible';
          widget.style.opacity = '1';
          widget.style.position = 'fixed';
          widget.style.bottom = '20px';
          widget.style.right = '20px';
          widget.style.zIndex = '9999';
        }
      }, 2000);

      // Store interval ID for cleanup
      window.watermarkInterval = watermarkInterval;
    };

    // Append elements to body
    document.body.appendChild(convaiElement);
    document.body.appendChild(script);

    // Set up a global visibility monitor that runs every 3 seconds
    // This ensures the widget stays visible even if something tries to hide it
    const visibilityMonitor = setInterval(() => {
      const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
      if (widget) {
        const computedStyle = window.getComputedStyle(widget);
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' || 
            computedStyle.opacity === '0') {
          widget.style.display = 'block';
          widget.style.visibility = 'visible';
          widget.style.opacity = '1';
          widget.style.position = 'fixed';
          widget.style.bottom = '20px';
          widget.style.right = '20px';
          widget.style.zIndex = '9999';
        }
      }
    }, 3000);

    // Cleanup function
    return () => {
      clearInterval(visibilityMonitor);
      // Remove the widget when component unmounts
      const existingConvai = document.querySelector('elevenlabs-convai');
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');

      if (existingConvai) {
        document.body.removeChild(existingConvai);
      }
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      // Reset the global flag
      window.elevenLabsWidgetInitialized = false;

      // Clear watermark interval
      if (window.watermarkInterval) {
        clearInterval(window.watermarkInterval);
        window.watermarkInterval = undefined;
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default ElevenLabsWidget;
