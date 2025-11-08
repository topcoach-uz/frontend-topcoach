import React, { useEffect, useRef, useState } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import './VdoCipherPlayer.scss';

interface VdoCipherPlayerProps {
  videoId: string;
  otp: string;
  playbackInfo: string;
  title: string;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

const VdoCipherPlayer: React.FC<VdoCipherPlayerProps> = ({
  videoId,
  otp,
  playbackInfo,
  title,
  onProgressUpdate,
  onComplete,
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
               iframe.style.borderRadius = '8px';
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
            }
          } else if (data.type === 'play') {
            console.log('Video started playing');
            setIsPlaying(true);
            setIsLoading(false);
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
            // Check for domain restriction errors
            if (data.error && (data.error.includes('Domain not allowed') || data.error.includes('2014'))) {
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              if (isLocalhost) {
                setError('Domain not allowed: VdoCipher requires domain whitelisting. Please add localhost to your VdoCipher dashboard or use a development domain.');
              } else {
                setError('Domain not allowed: Please add this domain to your VdoCipher dashboard whitelist.');
              }
            } else {
              setError('Video playback error. Please try again.');
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
        };

        // Cleanup function
        return () => {
          window.removeEventListener('message', handleMessage);
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
            {error.includes('Domain not allowed') && (
              <div className="domain-error-help" style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <strong>How to fix:</strong>
                <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Log in to your VdoCipher dashboard</li>
                  <li>Go to Settings → Domain Restrictions</li>
                  <li>Add <code>{window.location.hostname}</code> to the allowed domains list</li>
                  <li>For localhost development, add: <code>localhost</code> and <code>127.0.0.1</code></li>
                </ol>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666' }}>
                  Alternatively, use a tunneling service like ngrok for development.
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
      <div className="video-title">
        <h3>{title}</h3>
      </div>

      {isSafari && (
        <div className="safari-warning">
          <div className="warning-content">
            <div className="warning-icon">⚠️</div>
            <h4>Browser Compatibility Notice</h4>
            <p>Safari may have issues with this video player. For the best experience, please use Chrome, Firefox, or Edge.</p>
            <div className="browser-suggestions">
              <span>Recommended browsers:</span>
              <div className="browser-icons">
                <span>🌐 Chrome</span>
                <span>🦊 Firefox</span>
                <span>🔷 Edge</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={playerRef} 
        className="vdocipher-player"
        style={{ width: '100%', height: '500px', position: 'relative' }}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading video...</span>
        </div>
      )}

      {/* Complete Button */}
      <div className="video-actions">
        <button 
          className="complete-button"
          onClick={onComplete}
          style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
        >
          <CheckCircleOutlined />
          Mark as Complete
        </button>
      </div>
    </div>
  );
};

export default VdoCipherPlayer; 