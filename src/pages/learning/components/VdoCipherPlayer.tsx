import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import './VdoCipherPlayer.scss';

interface VdoCipherPlayerProps {
  videoId: string;
  otp: string;
  playbackInfo: string;
  title: string;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
  isCompleted?: boolean;
  /** Mark-as-complete disabled until quiz threshold met. */
  canComplete?: boolean;
  /** Tooltip + footnote shown when canComplete is false. */
  completeLockReason?: string;
}

const VdoCipherPlayer: React.FC<VdoCipherPlayerProps> = ({
  videoId,
  otp,
  playbackInfo,
  title,
  onProgressUpdate,
  onComplete,
  isCompleted = false,
  canComplete = true,
  completeLockReason,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing VdoCipher iframe player with:', {
          videoId,
          otp: otp ? 'present' : 'missing',
          playbackInfo: playbackInfo ? 'present' : 'missing',
          playerRef: !!playerRef.current
        });

        // Validate inputs
        if (!playerRef.current) {
          throw new Error('Player container not found');
        }
        
        if (!otp) {
          throw new Error('OTP is missing');
        }
        
                       if (!playbackInfo) {
                 throw new Error('Playback info is missing');
               }

               // Clear the container
        playerRef.current.innerHTML = '';

        // Create iframe with VdoCipher player
        const iframe = document.createElement('iframe');
        const iframeSrc = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;
        
        console.log('Creating VdoCipher iframe with URL:', iframeSrc);
        
               iframe.src = iframeSrc;
               iframe.style.border = '0';
               iframe.style.width = '100%';
               iframe.style.height = '100%';
               iframe.style.transform = 'scale(1.1)';
               iframe.style.transformOrigin = 'center center';
               iframe.style.background = '#000';
               iframe.style.display = 'block';
               iframe.style.position = 'absolute';
               iframe.style.top = '0';
               iframe.style.left = '0';
               iframe.style.right = '0';
               iframe.style.bottom = '0';
               iframe.allow = 'encrypted-media';
               iframe.allowFullscreen = true;

        // Add load event listener to iframe
        iframe.onload = () => {
          console.log('VdoCipher iframe loaded successfully');
          // Set a timeout to detect domain errors
          setTimeout(() => {
            if (isLoading && !isReady) {
              // If still loading after 5 seconds, likely a domain restriction issue
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              if (isLocalhost) {
                console.warn('VdoCipher may be blocking localhost - check domain whitelist in dashboard');
              }
            }
          }, 5000);
        };

        iframe.onerror = (error) => {
          console.error('VdoCipher iframe failed to load:', error);
          setError('Failed to load video player');
          setIsLoading(false);
        };

        // Add iframe to container
        playerRef.current.appendChild(iframe);

        // Track handshake completion and authentication timeout
        let handshakeCompleted = false;
        let authenticationTimeout: NodeJS.Timeout | null = null;

        // Set up authentication timeout (after handshake, if no play event within 10 seconds, likely auth failure)
        const checkAuthentication = () => {
          if (handshakeCompleted && !isPlaying && isLoading) {
            console.warn('Authentication may have failed - handshake completed but video not playing');
            const currentDomain = window.location.hostname;
            setError(`Video authentication failed. The domain "${currentDomain}" may need to be whitelisted in your VdoCipher dashboard. Please contact support.`);
            setIsLoading(false);
          }
        };

        // Set up message listener for iframe communication
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== 'https://player.vdocipher.com') {
            return;
          }

          const data = event.data;
          
          // Prevent infinite re-renders by checking if we've already handled this message
          if (data.type === '@vdo/readyToHandshake' && isReady) {
            return;
          }

          console.log('VdoCipher iframe message:', data);

          // Handle different message types
          if (data.type === 'ready' || data.type === '@vdo/readyToHandshake') {
            if (!isReady) {
              console.log('VdoCipher iframe ready - setting loading to false');
              setIsReady(true);
              setIsLoading(false);
              handshakeCompleted = true;
              // Set timeout to check if authentication succeeds (10 seconds after handshake)
              authenticationTimeout = setTimeout(() => {
                checkAuthentication();
              }, 10000);
            }
          } else if (data.type === 'play') {
            console.log('Video started playing');
            setIsPlaying(true);
            setIsLoading(false);
            // Clear authentication timeout since video is playing
            if (authenticationTimeout) {
              clearTimeout(authenticationTimeout);
              authenticationTimeout = null;
            }
          } else if (data.type === 'pause') {
            setIsPlaying(false);
          } else if (data.type === 'ended') {
            setIsPlaying(false);
            onComplete();
          } else if (data.type === 'timeupdate') {
            if (data.currentTime && data.duration) {
              const progress = (data.currentTime / data.duration) * 100;
              onProgressUpdate(progress);
            }
          } else if (data.type === 'error') {
            console.error('VdoCipher iframe error:', data.error);
            // Clear authentication timeout on error
            if (authenticationTimeout) {
              clearTimeout(authenticationTimeout);
              authenticationTimeout = null;
            }
            // Check for domain restriction errors
            // VdoCipher error codes: 2014 = Domain not allowed, 6007 = Domain restriction
            if (data.error && (
              data.error.includes('Domain not allowed') || 
              data.error.includes('2014') || 
              data.error.includes('6007') ||
              (typeof data.error === 'object' && (data.error.code === 2014 || data.error.code === 6007))
            )) {
              const currentDomain = window.location.hostname;
              const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
              if (isLocalhost) {
                setError(`Domain not allowed: The domain "${currentDomain}" needs to be whitelisted in your VdoCipher dashboard. Please contact support or add this domain to your VdoCipher account settings.`);
              } else {
                setError(`Domain not allowed: The domain "${currentDomain}" needs to be whitelisted in your VdoCipher dashboard. Please contact support.`);
              }
            } else if (data.error && data.error.includes('403')) {
              // 403 Forbidden usually means domain restriction
              const currentDomain = window.location.hostname;
              setError(`Access denied: The domain "${currentDomain}" may not be whitelisted. Please contact support.`);
            } else {
              setError('Video playback error. Please try again or contact support if the issue persists.');
            }
            setIsLoading(false);
          } else if (data.type === 'loadedmetadata') {
            console.log('Video metadata loaded');
            setIsLoading(false);
          } else if (data.type === 'canplay') {
            console.log('Video can start playing');
            setIsLoading(false);
          }
        };

        // Store the handler reference to prevent multiple listeners
        messageHandlerRef.current = handleMessage;
        window.addEventListener('message', handleMessage);

        // Fallback timeout to prevent infinite loading
        const fallbackTimeout = setTimeout(() => {
          console.log('Fallback timeout reached - setting loading to false');
          setIsLoading(false);
        }, 3000);

        // Cleanup function
        return () => {
          if (messageHandlerRef.current) {
            window.removeEventListener('message', messageHandlerRef.current);
          }
          clearTimeout(fallbackTimeout);
          if (authenticationTimeout) {
            clearTimeout(authenticationTimeout);
          }
        };

      } catch (error) {
        console.error('Failed to initialize VdoCipher iframe player:', error);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    initializePlayer();
  }, [otp, playbackInfo, onProgressUpdate, onComplete]);

  // Detect Safari browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  // Security: Disable right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common screen recording shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 's' || e.key === 'c' || e.key === 'v' || e.key === 'p')
      ) {
        e.preventDefault();
      }
      
      // Prevent F12, Ctrl+Shift+I, Ctrl+U (developer tools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (error) {
    return (
      <div className="vdocipher-player-container">
        <div className="video-title">
          <h3>{title}</h3>
        </div>
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Video Error</h3>
            <p>{error}</p>
            {(error.includes('Domain not allowed') || error.includes('403') || error.includes('2014') || error.includes('6007')) && (
              <div className="domain-error-help" style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <strong style={{ color: '#856404' }}>⚠️ Domain Whitelisting Required:</strong>
                <p style={{ margin: '8px 0', color: '#856404' }}>
                  The domain <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '2px' }}>{window.location.hostname}</code> needs to be whitelisted in the VdoCipher dashboard.
                </p>
                <ol style={{ margin: '8px 0', paddingLeft: '20px', color: '#856404' }}>
                  <li>Log in to <strong>VdoCipher Dashboard</strong> (https://dashboard.vdocipher.com)</li>
                  <li>Navigate to <strong>Config</strong> section</li>
                  <li>Go to <strong>Domain Restrictions</strong> or <strong>Allowed Domains</strong></li>
                  <li>Add <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '2px' }}>{window.location.hostname}</code> to the whitelist</li>
                  <li>Save the changes and wait a few minutes for propagation</li>
                  <li>Refresh this page</li>
                </ol>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#856404', fontStyle: 'italic' }}>
                  <strong>Important:</strong> This must be done by an administrator with access to the VdoCipher account. 
                  Contact your administrator or support if you need assistance.
                </p>
              </div>
            )}
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vdocipher-player-container">
  

      {/* The Safari incompatibility hint now lives in the lesson header
          as a compact badge; keeping the box here would duplicate it. */}
      
<div 
  ref={playerRef} 
  className="vdocipher-player"
  style={{ 
    width: '100%', 
    position: 'relative',
    paddingTop: '56.25%', // 16:9 aspect ratio
    backgroundColor: '#000',
 
    overflow: 'hidden'
  }}
/>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading video...</span>
        </div>
      )}

      {/* Complete Button — disabled while quiz threshold isn't met,
          flips to an italic "completed" note once the parent confirms. */}
      <div className="video-actions">
        {isCompleted ? (
          <button
            type="button"
            className="complete-button is-completed"
            disabled
            aria-label="Lesson completed"
          >
            <CheckCircle2 size={16} />
            Completed
          </button>
        ) : (
          <button
            type="button"
            className="complete-button"
            onClick={onComplete}
            disabled={!canComplete}
            title={!canComplete ? (completeLockReason ?? 'Complete the practice questions first.') : undefined}
          >
            <CheckCircle2 size={16} />
            Mark as Complete
          </button>
        )}
        {!isCompleted && !canComplete && (
          <span className="complete-lock-note">
            <em>{completeLockReason ?? 'Complete the practice questions (80%) to unlock.'}</em>
          </span>
        )}
      </div>
    </div>
  );
};

export default VdoCipherPlayer; 