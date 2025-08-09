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
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
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

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showControls) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'r':
          e.preventDefault();
          restart();
          break;
      }
    };

    // Handle clicking outside volume control
    const handleClickOutside = (e: MouseEvent) => {
      const volumeControl = document.querySelector('.volume-control');
      if (volumeControl && !volumeControl.contains(e.target as Node)) {
        setShowVolumeSlider(false);
        volumeTimeoutRef.current = null; // Clear timeout
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onProgressUpdate, onComplete, showControls, volume]);

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