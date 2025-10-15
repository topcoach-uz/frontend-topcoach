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
    // Check if widget is already initialized globally
    if (window.elevenLabsWidgetInitialized) {
      console.log('ElevenLabs widget already initialized globally, skipping');
      return;
    }

    // Check if widget is already loaded to prevent duplicates
    if (document.querySelector('elevenlabs-convai')) {
      console.log('ElevenLabs widget already exists, skipping creation');
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      console.log('ElevenLabs script already loaded, skipping script creation');
      return;
    }

    // Create the ElevenLabs conversation widget with updated configuration
    const convaiElement = document.createElement('elevenlabs-convai');
    convaiElement.setAttribute('agent-id', 'agent_4101k7bhh5rmevhscwt844tnwd1a');

    // Add TopCoach branding colors to match the site theme
    convaiElement.setAttribute('avatar-orb-color-1', '#8b0000'); // TopCoach red
    convaiElement.setAttribute('avatar-orb-color-2', '#f5f5f5'); // Light gray

    // Set widget behavior
    convaiElement.setAttribute('data-placement', 'bottom-right');
    convaiElement.setAttribute('data-variant', 'compact');
    convaiElement.setAttribute('data-expanded-behavior', 'starts-collapsed');

    // Hide the top logo/avatar
    convaiElement.setAttribute('data-hide-avatar', 'true');
    convaiElement.setAttribute('data-hide-logo', 'true');

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
      console.log('ElevenLabs AI Assistant widget loaded successfully');
      window.elevenLabsWidgetInitialized = true;

      // Hide watermark after widget loads
      setTimeout(() => {
        hideWatermark();
      }, 1000);

      // Set up periodic check to hide watermark
      const watermarkInterval = setInterval(() => {
        hideWatermark();
      }, 2000);

      // Store interval ID for cleanup
      window.watermarkInterval = watermarkInterval;
    };

    // Append elements to body
    document.body.appendChild(convaiElement);
    document.body.appendChild(script);

    // Cleanup function
    return () => {
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
