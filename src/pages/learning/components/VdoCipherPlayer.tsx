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
        iframe.src = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;
        iframe.style.border = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.borderRadius = '8px';
        iframe.allow = 'encrypted-media';
        iframe.allowFullscreen = true;

        // Add iframe to container
        playerRef.current.appendChild(iframe);

        // Set up message listener for iframe communication
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== 'https://player.vdocipher.com') {
            return;
          }

          const data = event.data;
          console.log('VdoCipher iframe message:', data);

          if (data.type === 'ready') {
            console.log('VdoCipher iframe ready');
            setIsLoading(false);
          } else if (data.type === 'play') {
            setIsPlaying(true);
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
            setError('Video playback error. Please try again.');
            setIsLoading(false);
          }
        };

        window.addEventListener('message', handleMessage);

        // Set loading to false after a reasonable timeout
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
          }
        }, 3000);

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
  }, [otp, playbackInfo, onProgressUpdate, onComplete, isLoading]);

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
        style={{ width: '100%', height: '500px', position: 'relative' }}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading secure video...</span>
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