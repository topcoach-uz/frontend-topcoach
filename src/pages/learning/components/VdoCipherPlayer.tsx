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

declare global {
  interface Window {
    VdoCipher: any;
  }
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
  const vdoPlayerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Load VdoCipher script if not already loaded
    const loadVdoCipherScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.VdoCipher) {
          console.log('VdoCipher already loaded');
          resolve();
          return;
        }

        const script = document.createElement('script');
        // Use the correct VdoCipher script URL
        script.src = 'https://player.vdocipher.com/v2/api.js';
        script.onload = () => {
          console.log('VdoCipher script loaded successfully');
          
          // Wait for VdoCipher to be available
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait
          
          const checkVdoCipher = () => {
            attempts++;
            if (window.VdoCipher) {
              console.log('VdoCipher constructor is now available');
              resolve();
            } else if (attempts >= maxAttempts) {
              console.error('VdoCipher constructor not available after 5 seconds');
              reject(new Error('VdoCipher constructor not available'));
            } else {
              console.log(`Waiting for VdoCipher constructor... (attempt ${attempts}/${maxAttempts})`);
              setTimeout(checkVdoCipher, 100);
            }
          };
          
          // Start checking after a short delay
          setTimeout(checkVdoCipher, 100);
        };
        script.onerror = () => {
          console.error('Failed to load VdoCipher script');
          reject(new Error('Failed to load VdoCipher script'));
        };
        document.head.appendChild(script);
      });
    };

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing VdoCipher player with:', {
          videoId,
          otp: otp ? 'present' : 'missing',
          playbackInfo: playbackInfo ? 'present' : 'missing',
          playerRef: !!playerRef.current
        });

        await loadVdoCipherScript();

        if (!playerRef.current) {
          throw new Error('Player container not found');
        }
        
        if (!otp) {
          throw new Error('OTP is missing');
        }
        
        if (!playbackInfo) {
          throw new Error('Playback info is missing');
        }

        const options = {
          otp,
          playbackInfo,
          theme: '9ae8bbe8bc964196a0fba8c0d4e65cd7', // Default theme
          controls: {
            fullscreen: true,
            playPause: true,
            volume: true,
            seek: true,
            speed: true,
            quality: true,
          },
          events: {
            onReady: () => {
              console.log('VdoCipher player ready');
              setIsLoading(false);
            },
            onPlay: () => {
              console.log('Video started playing');
              setIsPlaying(true);
            },
            onPause: () => {
              console.log('Video paused');
              setIsPlaying(false);
            },
            onEnded: () => {
              console.log('Video ended');
              setIsPlaying(false);
              onComplete();
            },
            onTimeUpdate: (currentTime: number, duration: number) => {
              setCurrentTime(currentTime);
              setDuration(duration);
              const progress = (currentTime / duration) * 100;
              onProgressUpdate(progress);
            },
            onError: (error: any) => {
              console.error('VdoCipher player error:', error);
              setError('Failed to load video. Please try again.');
              setIsLoading(false);
            },
          },
        };

        // Final check before creating VdoCipher instance
        if (!window.VdoCipher) {
          throw new Error('VdoCipher constructor is not available');
        }

        console.log('Creating VdoCipher player instance...');
        
        // Initialize VdoCipher player
        const vdoPlayer = new window.VdoCipher(playerRef.current, options);
        vdoPlayerRef.current = vdoPlayer;

      } catch (error) {
        console.error('Failed to initialize VdoCipher player:', error);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    initializePlayer();

    // Cleanup function
    return () => {
      if (vdoPlayerRef.current) {
        try {
          vdoPlayerRef.current.destroy();
        } catch (error) {
          console.error('Error destroying VdoCipher player:', error);
        }
      }
    };
  }, [otp, playbackInfo, onProgressUpdate, onComplete]);

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
      
      <div 
        ref={playerRef} 
        className="vdocipher-player"
        style={{ width: '100%', height: '500px' }}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading secure video...</span>
        </div>
      )}

      {/* Progress Display */}
      {duration > 0 && (
        <div className="progress-display">
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
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