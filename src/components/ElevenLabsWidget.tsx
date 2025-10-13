import { useEffect } from 'react';
import './ElevenLabsWidget.module.scss';

// Global flag to prevent multiple widget initializations
declare global {
  interface Window {
    elevenLabsWidgetInitialized?: boolean;
  }
}

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

    // Create the ElevenLabs conversation widget
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
    
    // Create and load the script
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
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default ElevenLabsWidget;
