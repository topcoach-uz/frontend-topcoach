/**
 * Materials column (left side of module view).
 *
 * Shows the week's primary video stage (VdoCipher placeholder) plus a
 * "Resource Vault" of additional video chips and downloadable / external
 * materials. The student can mark a video as watched from the stage CTA.
 */

import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Play,
  Video,
} from 'lucide-react';
import {
  useMarkVideoCompleteMutation,
  researchPrepErrorMessage,
  type ResearchVideoLesson,
  type WeekLockState,
} from 'src/app/services/research-prep';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { baseUrl } from 'src/app/services/api/const';

interface VdoOtp {
  otp: string;
  playbackInfo: string;
}

/**
 * Fetch a fresh VdoCipher OTP/playbackInfo pair for a given videoId. Mirrors
 * the flow used in `pages/learning/index.tsx` for Admissions/SAT lessons —
 * the backend calls VdoCipher's API and whitelists the requesting domain.
 */
function useVdoCipherOtp(videoId: string | undefined) {
  const [otp, setOtp] = useState<VdoOtp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastVideoId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!videoId) {
      setOtp(null);
      setError(null);
      return;
    }
    if (videoId === lastVideoId.current && otp) return;
    lastVideoId.current = videoId;

    let cancelled = false;
    const fetchOtp = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) throw new Error('Not authenticated.');

        let domain = window.location.hostname;
        if (domain.startsWith('www.')) domain = domain.slice(4);
        const domains: string[] =
          domain === 'localhost' || domain === '127.0.0.1'
            ? ['localhost', '127.0.0.1']
            : (() => {
                const port = window.location.port;
                return port && port !== '80' && port !== '443'
                  ? [domain, `${domain}:${port}`]
                  : [domain];
              })();

        const res = await fetch(`${baseUrl}/vdocipher/generate-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ videoId, ttl: 300, domain: domains }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `OTP request failed (${res.status}).`);
        }
        const data = await res.json();
        if (!cancelled) setOtp({ otp: data.otp, playbackInfo: data.playbackInfo });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Could not load video.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchOtp();
    return () => {
      cancelled = true;
    };
    // `otp` is intentionally omitted — we only refetch when videoId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return { otp, error, isLoading };
}

interface MaterialsColumnProps {
  weekId: string;
  weekLocked: boolean;
  lessons: ResearchVideoLesson[];
  videoStates: WeekLockState['videos'];
}

const fmtDuration = (seconds: number) => {
  const m = Math.round(seconds / 60);
  return `${m} min`;
};

const fmtBytes = (b?: number) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const MaterialsColumn: React.FC<MaterialsColumnProps> = ({
  weekId,
  weekLocked,
  lessons,
  videoStates,
}) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(lessons[0]?.id ?? null);
  const [markVideo, { isLoading }] = useMarkVideoCompleteMutation();

  const activeVideo = lessons.find((l) => l.id === activeVideoId) ?? lessons[0];
  const activeState = activeVideo
    ? videoStates[activeVideo.id] ?? { completed: false, progressPercent: 0 }
    : null;

  const {
    otp: vdoOtp,
    error: vdoError,
    isLoading: vdoLoading,
  } = useVdoCipherOtp(weekLocked ? undefined : activeVideo?.vdocipherVideoId);

  const handleMarkWatched = async () => {
    if (!activeVideo || activeState?.completed) return;
    try {
      await markVideo({ weekId, videoId: activeVideo.id }).unwrap();
      message.success('Lesson marked as watched.');
    } catch (err: any) {
      message.error(researchPrepErrorMessage(err, 'Could not update progress.'));
    }
  };

  if (!activeVideo) {
    return (
      <div className="rp-section">
        <div className="rp-section-head">
          <span className="icon">
            <Video size={14} />
          </span>
          Learning Materials
        </div>
        <div className="rp-section-body" style={{ color: '#8a93a0', fontSize: 13 }}>
          No materials authored for this week yet.
        </div>
      </div>
    );
  }

  // Combine all attached materials from all lessons (so the vault shows
  // everything in one place).
  const allAttachments = lessons.flatMap((l) =>
    l.attachments.map((a) => ({ ...a, lessonTitle: l.title })),
  );

  return (
    <div className="rp-section">
      <div className="rp-section-head">
        <span className="icon">
          <Video size={14} />
        </span>
        Learning Materials
      </div>
      <div className="rp-section-body">
        {/* Primary video stage — real VdoCipher iframe when a video ID is set
            and we have an OTP; otherwise a placeholder card with mark-watched. */}
        {activeVideo.vdocipherVideoId && vdoOtp && !weekLocked ? (
          <div className="rp-video-stage rp-video-stage--live" aria-label="Video player">
            <div className="rp-vd-frame">
              <iframe
                title={activeVideo.title}
                src={`https://player.vdocipher.com/v2/?otp=${encodeURIComponent(
                  vdoOtp.otp,
                )}&playbackInfo=${encodeURIComponent(vdoOtp.playbackInfo)}`}
                allow="encrypted-media"
                allowFullScreen
              />
            </div>
            <div className="rp-vd-meta">
              <div>
                <div className="v-title">{activeVideo.title}</div>
                <div className="v-sub">
                  {fmtDuration(activeVideo.durationSeconds)} ·{' '}
                  {activeState?.completed
                    ? 'Watched'
                    : activeState && activeState.progressPercent > 0
                      ? `${activeState.progressPercent}% watched`
                      : 'HD Lecture'}
                </div>
              </div>
              {!activeState?.completed && (
                <button
                  type="button"
                  className="rp-vd-mark"
                  onClick={handleMarkWatched}
                  disabled={isLoading}
                >
                  <CheckCircle2 size={14} />
                  {isLoading ? 'Saving…' : 'Mark watched'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rp-video-stage" role="region" aria-label="Video player">
            <span className="vd-watermark">VdoCipher</span>
            <button
              type="button"
              className="play"
              onClick={handleMarkWatched}
              aria-label={
                activeVideo.vdocipherVideoId ? 'Loading video…' : 'Mark video as watched'
              }
              disabled={isLoading || weekLocked || vdoLoading}
            >
              {activeState?.completed ? (
                <CheckCircle2 size={28} />
              ) : (
                <Play size={28} fill="currentColor" />
              )}
            </button>
            <div className="v-title">{activeVideo.title}</div>
            <div className="v-sub">
              {fmtDuration(activeVideo.durationSeconds)} ·{' '}
              {vdoLoading
                ? 'Preparing player…'
                : vdoError
                  ? 'Video unavailable — check VdoCipher whitelist'
                  : activeState?.completed
                    ? 'Watched'
                    : activeState && activeState.progressPercent > 0
                      ? `${activeState.progressPercent}% watched`
                      : 'HD Lecture'}
            </div>
          </div>
        )}

        {/* Additional videos in this week — show chips if more than 1 */}
        {lessons.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5b6470',
                marginBottom: 8,
              }}
            >
              <Video size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              Videos in this week
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lessons.map((l) => {
                const s = videoStates[l.id] ?? { completed: false, progressPercent: 0 };
                const isActive = l.id === activeVideoId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveVideoId(l.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: `1px solid ${isActive ? '#7c1c1c' : '#e5e7eb'}`,
                      background: isActive ? '#faecec' : '#fff',
                      color: isActive ? '#7c1c1c' : '#0f1419',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {s.completed ? (
                      <CheckCircle2 size={11} color="#1f7a3a" />
                    ) : (
                      <Play size={10} fill="currentColor" />
                    )}
                    {l.title.length > 28 ? l.title.slice(0, 26) + '…' : l.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Resource vault */}
        {allAttachments.length > 0 && (
          <div className="rp-vault">
            <div className="vault-head">
              <FileText size={11} /> Resource Vault
            </div>
            {allAttachments.map((a) => (
              <a
                key={a.id}
                className="vault-row"
                href={a.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="icon">
                  {a.kind === 'link' ? <ExternalLink size={13} /> : <FileText size={13} />}
                </span>
                <div className="meta">
                  <div className="name">{a.title || a.url}</div>
                  <div className="sub">
                    {a.kind === 'link'
                      ? new URL(a.url, window.location.origin).hostname.replace(/^www\./, '')
                      : `${(a.fileName?.split('.').pop() ?? 'file').toUpperCase()}${
                          a.fileSizeBytes ? ` · ${fmtBytes(a.fileSizeBytes)}` : ''
                        }`}
                  </div>
                </div>
                <span className="download">
                  {a.kind === 'link' ? <ExternalLink size={14} /> : <Download size={14} />}
                </span>
              </a>
            ))}
          </div>
        )}

        {weekLocked && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              color: '#5b6470',
              fontSize: 12,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Lock size={12} /> This week is locked. Complete the previous week to unlock.
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsColumn;
