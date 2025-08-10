import React, { useRef, useState, useEffect } from 'react';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  FullscreenOutlined,
  FullscreenExitOutlined,
  SoundOutlined,
  MutedOutlined,
  SettingOutlined,
  ReloadOutlined,
  AudioOutlined
} from '@ant-design/icons';
import './VideoPlayer.scss';

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('VideoPlayer: Loading video with src:', src);

    const handleLoadedMetadata = () => {
      console.log('VideoPlayer: Metadata loaded, duration:', video.duration);
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgressUpdate(progress);
    };

    const handleEnded = () => {
      console.log('VideoPlayer: Video ended');
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

    // Add error handling
    const handleError = (e: Event) => {
      console.error('VideoPlayer: Error loading video:', e);
      console.error('VideoPlayer: Error details:', video.error);
      setIsLoading(false);
      setHasError(true);
      
      // Get specific error message
      if (video.error) {
        switch (video.error.code) {
          case 1:
            setErrorMessage('Video loading was aborted');
            break;
          case 2:
            setErrorMessage('Network error - video URL not accessible');
            break;
          case 3:
            setErrorMessage('Video decoding failed - file may be corrupted');
            break;
          case 4:
            setErrorMessage('Video format not supported');
            break;
          default:
            setErrorMessage('Failed to load video. Please check the URL.');
        }
      } else {
        setErrorMessage('Failed to load video. Please check the URL.');
      }
    };

    const handleCanPlay = () => {
      console.log('VideoPlayer: Can play video');
      setIsLoading(false);
    };

    const handleCanPlayThrough = () => {
      console.log('VideoPlayer: Can play through video');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('VideoPlayer: Load started');
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      console.log('VideoPlayer: Data loaded');
      setIsLoading(false);
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [src, onProgressUpdate, onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    const seekTime = (clickX / progressBarWidth) * video.duration;
    
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
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    
    // Keep volume slider open when adjusting
    setShowVolumeSlider(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    const newTimeout = setTimeout(() => {
      setShowVolumeSlider(false);
      volumeTimeoutRef.current = null;
    }, 2000);
    volumeTimeoutRef.current = newTimeout;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
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
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
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
              
              <div 
                className={`volume-slider ${showVolumeSlider ? 'show' : ''}`}
                onMouseEnter={() => {
                  setShowVolumeSlider(true);
                  if (volumeTimeoutRef.current) {
                    clearTimeout(volumeTimeoutRef.current);
                    volumeTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  // Don't hide immediately, let the timeout handle it
                }}
              >
                <div className="volume-percentage">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </div>
                <div 
                  className="volume-track"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const height = rect.height;
                    const newVolume = Math.max(0, Math.min(1, 1 - (clickY / height)));
                    setVolume(newVolume);
                    if (newVolume === 0) {
                      setIsMuted(true);
                    } else if (isMuted) {
                      setIsMuted(false);
                    }
                    
                    // Keep slider open for 2 seconds after interaction
                    if (volumeTimeoutRef.current) {
                      clearTimeout(volumeTimeoutRef.current);
                    }
                    volumeTimeoutRef.current = setTimeout(() => {
                      setShowVolumeSlider(false);
                      volumeTimeoutRef.current = null;
                    }, 2000);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const touch = e.touches[0];
                    const touchY = touch.clientY - rect.top;
                    const height = rect.height;
                    const newVolume = Math.max(0, Math.min(1, 1 - (touchY / height)));
                    setVolume(newVolume);
                    if (newVolume === 0) {
                      setIsMuted(true);
                    } else if (isMuted) {
                      setIsMuted(false);
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const touch = e.touches[0];
                    const touchY = touch.clientY - rect.top;
                    const height = rect.height;
                    const newVolume = Math.max(0, Math.min(1, 1 - (touchY / height)));
                    setVolume(newVolume);
                    if (newVolume === 0) {
                      setIsMuted(true);
                    } else if (isMuted) {
                      setIsMuted(false);
                    }
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-range"
                  />
                  <div 
                    className="volume-fill" 
                    style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="right-controls">
            {/* Speed Control */}
            <div className="speed-control">
              <button 
                className="control-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                aria-label="Playback Speed"
              >
                <SettingOutlined />
                <span className="speed-text">{playbackRate}x</span>
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

            {/* Fullscreen Button */}
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

      {/* Click to Play Overlay */}
      {!isPlaying && !showControls && (
        <div className="click-to-play" onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}>
          <PlayCircleOutlined />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 