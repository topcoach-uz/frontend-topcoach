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
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/vdocipher-js@1.0.0/dist/vdocipher.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load VdoCipher script'));
        document.head.appendChild(script);
      });
    };

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadVdoCipherScript();

        if (!playerRef.current || !otp || !playbackInfo) {
          throw new Error('Missing required parameters for VdoCipher player');
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