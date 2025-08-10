import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined, 
  SoundOutlined, 
  AudioOutlined, 
  MutedOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import './VideoPlayer.scss';

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

// Utility function to convert YouTube URLs to embed URLs
const convertYouTubeUrl = (url: string): string => {
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    }
  }
  
  return url;
};

// Utility function to convert Google Drive sharing links to direct video URLs
const convertGoogleDriveUrl = (url: string): string => {
  // Check if it's a Google Drive sharing link
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    // Try to get direct video URL using the download method
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com')) {
    return url;
  }
  
  // Return original URL if it's not a Google Drive link
  return url;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title, 
  onProgressUpdate, 
  onComplete 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleDriveOptions, setShowGoogleDriveOptions] = useState(false);
  const [useEmbed, setUseEmbed] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Check if it's a YouTube URL
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  
  // Check if it's a Google Drive URL
  const isGoogleDrive = src.includes('drive.google.com');
  
  // Convert URLs if needed
  const videoSrc = isYouTube ? convertYouTubeUrl(src) : convertGoogleDriveUrl(src);

  // Debug: Log video source
  useEffect(() => {
    console.log('VideoPlayer - Video source:', {
      originalSrc: src,
      convertedSrc: videoSrc,
      isYouTube,
      isGoogleDrive,
      title,
      timestamp: new Date().toISOString()
    });
  }, [src, videoSrc, isYouTube, isGoogleDrive, title]);

  // For YouTube videos, use embed if direct video fails
  useEffect(() => {
    if (isYouTube) {
      console.log('Detected YouTube URL, will use embed if needed:', videoSrc);
    }
  }, [isYouTube, videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('Video loaded metadata:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgressUpdate(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete();
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (video.currentTime > 10) {
            video.currentTime -= 10;
          } else {
            video.currentTime = 0;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime += 10;
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (video.volume < 1) {
            video.volume = Math.min(1, video.volume + 0.1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (video.volume > 0) {
            video.volume = Math.max(0, video.volume - 0.1);
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showSpeedMenu && !(e.target as Element).closest('.speed-control')) {
        setShowSpeedMenu(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onProgressUpdate, onComplete, showSpeedMenu]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Failed to play video:', error);
        setError('Failed to play video. Please try again.');
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressContainer = progressRef.current;
    if (!video || !progressContainer) return;

    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * video.duration;
    video.currentTime = seekTime;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newVolume = parseFloat(e.target.value);
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSpeedMenu(false);
  };

  const restart = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleError = (e: any) => {
    console.error('Video error:', e);
    
    if (isYouTube && !useEmbed) {
      // For YouTube, try using embed instead
      setUseEmbed(true);
      setError('Switching to YouTube embed...');
      setTimeout(() => {
        setError(null);
        setIsLoading(true);
      }, 1000);
    } else {
      setError('Failed to load video. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = null;
    volumeTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // If it's YouTube and we need to use embed, show iframe instead
  if (isYouTube && useEmbed) {
    return (
      <div className="video-player-container google-drive-video">
        <div className="video-title">
          <h3>{title}</h3>
        </div>
        <div className="google-drive-content">
          <div className="video-icon">
            <PlayCircleOutlined />
          </div>
          <h3>Video Available</h3>
          <p>
            This video is hosted externally for your convenience and safety. 
            Click the button below to view the video.
          </p>
          <div className="google-drive-buttons">
            <button 
              className="watch-button"
              onClick={() => window.open(src, '_blank')}
            >
              <PlayCircleOutlined />
              Watch Video
            </button>
            <button 
              className="complete-button"
              onClick={onComplete}
            >
              <CheckCircleOutlined />
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="video-player-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      <video
        ref={videoRef}
        className="video-element"
        src={videoSrc}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Video Title */}
      <div className="video-title">
        <h3>{title}</h3>
      </div>

      {/* Controls Overlay */}
      <div className={`controls-overlay ${showControls ? 'show' : 'hide'}`}>
        {/* Progress Bar */}
        <div 
          className="progress-container"
          ref={progressRef}
          onClick={handleSeek}
        >
          <div className="progress-bar">
            <div 
              className="buffered-progress" 
              style={{ width: `${buffered}%` }}
            ></div>
            <div 
              className="played-progress" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
          <div 
            className="progress-thumb"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>

        {/* Main Controls */}
        <div className="main-controls">
          <div className="left-controls">
            <button 
              className="control-btn play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            </button>

            <button 
              className="control-btn restart-btn"
              onClick={restart}
              aria-label="Restart"
            >
              <ReloadOutlined />
            </button>

            {/* Volume Control */}
            <div className="volume-control">
              <button 
                className="control-btn volume-btn"
                onClick={toggleMute}
                onMouseEnter={() => {
                  setShowVolumeSlider(true);
                  if (volumeTimeoutRef.current) {
                    clearTimeout(volumeTimeoutRef.current);
                    volumeTimeoutRef.current = null;
                  }
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <MutedOutlined />
                ) : volume < 0.5 ? (
                  <AudioOutlined />
                ) : (
                  <SoundOutlined />
                )}
              </button>
              
              {showVolumeSlider && (
                <div className="volume-slider">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    onMouseLeave={() => {
                      if (volumeTimeoutRef.current) {
                        clearTimeout(volumeTimeoutRef.current);
                      }
                      volumeTimeoutRef.current = setTimeout(() => {
                        setShowVolumeSlider(false);
                        volumeTimeoutRef.current = null;
                      }, 2000);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="center-controls">
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="right-controls">
            <div className="speed-control">
              <button 
                className="control-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                aria-label="Playback Speed"
              >
                <SettingOutlined />
              </button>
              
              {showSpeedMenu && (
                <div className="speed-menu">
                  {speeds.map(speed => (
                    <button
                      key={speed}
                      className={`speed-option ${playbackRate === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="control-btn fullscreen-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
          </div>
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Video Error</h3>
            <p>{error}</p>
            <div className="error-details">
              <p><strong>Original URL:</strong> {src}</p>
              <p><strong>Converted URL:</strong> {videoSrc}</p>
              <p><strong>Title:</strong> {title}</p>
            </div>
            <div className="error-buttons">
              <button 
                className="retry-button"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  const video = videoRef.current;
                  if (video) {
                    video.load();
                  }
                }}
              >
                Retry
              </button>
              {isYouTube && !useEmbed && (
                <button 
                  className="embed-button"
                  onClick={() => {
                    setUseEmbed(true);
                    setError(null);
                  }}
                >
                  Use YouTube Embed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click to Play Overlay */}
      {!isPlaying && !showControls && (
        <div className="click-to-play" onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}>
          <PlayCircleOutlined />
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

export default VideoPlayer; 