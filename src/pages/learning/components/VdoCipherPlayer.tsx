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

const VDO_API_SRC = 'https://player.vdocipher.com/v2/api.js';

/** Minimum seconds between two progress writes — `timeupdate` fires ~4x/second
 *  and every call reaches the lesson-progress endpoint. */
const PROGRESS_REPORT_INTERVAL_MS = 10000;

declare global {
  interface Window {
    VdoPlayer?: {
      getInstance: (iframe: HTMLIFrameElement) => {
        video: HTMLVideoElement;
        api: unknown;
      };
    };
  }
}

/** The player events (play/timeupdate/ended) are only delivered through
 *  VdoCipher's own api.js — the iframe speaks a handshake protocol, not plain
 *  postMessage, so listening to `window.message` by hand receives nothing past
 *  `@vdo/readyToHandshake`. Loaded once per document and shared. */
let vdoApiPromise: Promise<void> | null = null;

const loadVdoCipherApi = (): Promise<void> => {
  if (window.VdoPlayer) {
    return Promise.resolve();
  }
  if (vdoApiPromise) {
    return vdoApiPromise;
  }

  vdoApiPromise = new Promise<void>((resolve, reject) => {
    const fail = () => {
      vdoApiPromise = null;
      reject(new Error('Failed to load the VdoCipher player API'));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${VDO_API_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', fail);
      return;
    }

    const script = document.createElement('script');
    script.src = VDO_API_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return vdoApiPromise;
};

const VdoCipherPlayer: React.FC<VdoCipherPlayerProps> = ({
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

  // The parent passes inline arrow functions, so their identity changes on
  // every render. Holding them in refs keeps them out of the effect deps —
  // otherwise the iframe is destroyed and rebuilt on each parent render and
  // the video restarts from zero.
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onCompleteRef = useRef(onComplete);
  const canCompleteRef = useRef(canComplete);
  const isCompletedRef = useRef(isCompleted);
  onProgressUpdateRef.current = onProgressUpdate;
  onCompleteRef.current = onComplete;
  canCompleteRef.current = canComplete;
  isCompletedRef.current = isCompleted;

  useEffect(() => {
    const container = playerRef.current;
    if (!container) {
      return;
    }

    if (!otp || !playbackInfo) {
      setError('Video access token is missing. Please reload the page.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let detachListeners: (() => void) | null = null;

    // The overlay sits on top of the iframe, so never let it outlive a stalled
    // script load and swallow clicks on the play button.
    const spinnerFallback = setTimeout(() => setIsLoading(false), 5000);

    setError(null);
    setIsLoading(true);

    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(
      otp,
    )}&playbackInfo=${encodeURIComponent(playbackInfo)}`;
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.background = '#000';
    iframe.style.display = 'block';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.allow = 'encrypted-media';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    loadVdoCipherApi()
      .then(() => {
        if (cancelled || !window.VdoPlayer) {
          return;
        }

        const player = window.VdoPlayer.getInstance(iframe);
        const video = player?.video;
        if (!video) {
          throw new Error('VdoCipher player instance is unavailable');
        }

        let lastReportedAt = 0;

        const handleReady = () => setIsLoading(false);
        // Reaching the end auto-completes, but only where the button would
        // have allowed it: the parent's onComplete warns about the unfinished
        // quiz, and that warning must not fire on its own at every playthrough.
        const handleEnded = () => {
          if (canCompleteRef.current && !isCompletedRef.current) {
            onCompleteRef.current();
          }
        };
        const handleTimeUpdate = () => {
          const { currentTime, duration } = video;
          if (!duration || !Number.isFinite(duration)) {
            return;
          }
          const now = Date.now();
          if (now - lastReportedAt < PROGRESS_REPORT_INTERVAL_MS) {
            return;
          }
          lastReportedAt = now;
          onProgressUpdateRef.current((currentTime / duration) * 100);
        };
        const handleError = () => {
          setError(
            'Video playback error. Please reload the page, or contact support if the problem continues.',
          );
          setIsLoading(false);
        };

        video.addEventListener('loadedmetadata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('play', handleReady);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('error', handleError);

        detachListeners = () => {
          video.removeEventListener('loadedmetadata', handleReady);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('play', handleReady);
          video.removeEventListener('ended', handleEnded);
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('error', handleError);
        };

        // The iframe renders its own poster and controls once it authenticates,
        // so stop showing our spinner even if no media event has fired yet.
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        // The iframe itself is already mounted and can still play — only our
        // progress tracking is lost, so do not replace it with an error screen.
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(spinnerFallback);
      detachListeners?.();
      container.innerHTML = '';
    };
  }, [otp, playbackInfo]);

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
          overflow: 'hidden',
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
            title={
              !canComplete
                ? (completeLockReason ?? 'Complete the practice questions first.')
                : undefined
            }
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
