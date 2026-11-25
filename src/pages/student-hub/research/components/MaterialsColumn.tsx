/**
 * Step 1 of a week: the video player (VdoCipher, or a placeholder while it
 * loads), the week's lesson list and every downloadable / external resource.
 */

import React, { useEffect, useRef, useState } from "react";
import { message } from "antd";
import {
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Lock,
  Play,
} from "lucide-react";
import {
  useMarkVideoCompleteMutation,
  researchPrepErrorMessage,
  type ResearchVideoLesson,
  type WeekLockState,
} from "src/app/services/research-prep";
import { ACCESS_TOKEN } from "src/constants/storage";
import { baseUrl } from "src/app/services/api/const";
import RpPanel from "./RpPanel";

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
        if (!token) throw new Error("Not authenticated.");

        let domain = window.location.hostname;
        if (domain.startsWith("www.")) domain = domain.slice(4);
        const domains: string[] =
          domain === "localhost" || domain === "127.0.0.1"
            ? ["localhost", "127.0.0.1"]
            : (() => {
                const port = window.location.port;
                return port && port !== "80" && port !== "443"
                  ? [domain, `${domain}:${port}`]
                  : [domain];
              })();

        const res = await fetch(`${baseUrl}/vdocipher/generate-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ videoId, ttl: 300, domain: domains }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.message || `OTP request failed (${res.status}).`,
          );
        }
        const data = await res.json();
        if (!cancelled)
          setOtp({ otp: data.otp, playbackInfo: data.playbackInfo });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load video.");
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
  videoStates: WeekLockState["videos"];
}

const fmtDuration = (seconds: number) => {
  const m = Math.round(seconds / 60);
  return `${m} min`;
};

const fmtBytes = (b?: number) => {
  if (!b) return "";
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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    lessons[0]?.id ?? null,
  );
  const [markVideo, { isLoading }] = useMarkVideoCompleteMutation();

  const activeVideo = lessons.find((l) => l.id === activeVideoId) ?? lessons[0];
  const activeState = activeVideo
    ? (videoStates[activeVideo.id] ?? { completed: false, progressPercent: 0 })
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
      message.success("Lesson marked as watched.");
    } catch (err: any) {
      message.error(
        researchPrepErrorMessage(err, "Could not update progress."),
      );
    }
  };

  const watched = lessons.filter((l) => videoStates[l.id]?.completed).length;
  const allWatched = lessons.length > 0 && watched === lessons.length;
  const totalMinutes = Math.round(
    lessons.reduce((sum, l) => sum + l.durationSeconds, 0) / 60,
  );

  if (!activeVideo) {
    return (
      <RpPanel step={1} title="Lessons">
        <p className="rp-empty">No lessons have been added to this week yet.</p>
      </RpPanel>
    );
  }

  // Every lesson's attachments in one list.
  const allAttachments = lessons.flatMap((l) =>
    l.attachments.map((a) => ({ ...a, lessonTitle: l.title })),
  );

  // Player on the left, lesson list and resources beside it (when there are any).
  const hasAside = lessons.length > 1 || allAttachments.length > 0;

  const isLive = Boolean(activeVideo.vdocipherVideoId && vdoOtp && !weekLocked);
  const stateText = vdoLoading
    ? "Preparing player…"
    : vdoError && activeVideo.vdocipherVideoId
      ? "Video unavailable right now"
      : activeState?.completed
        ? "Watched"
        : activeState && activeState.progressPercent > 0
          ? `${activeState.progressPercent}% watched`
          : "Not watched yet";

  return (
    <RpPanel
      step={1}
      title="Lessons"
      subtitle={`${lessons.length} video${lessons.length === 1 ? "" : "s"} · ${totalMinutes} min`}
      done={allWatched}
      aside={
        <span className="rp-panel__count">
          {watched}/{lessons.length} watched
        </span>
      }
    >
      <div className={`rp-lessons-layout${hasAside ? " has-aside" : ""}`}>
        <div className="rp-player">
          {isLive && vdoOtp ? (
            <div className="rp-player__frame">
              <iframe
                title={activeVideo.title}
                src={`https://player.vdocipher.com/v2/?otp=${encodeURIComponent(
                  vdoOtp.otp,
                )}&playbackInfo=${encodeURIComponent(vdoOtp.playbackInfo)}`}
                allow="encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rp-player__frame rp-player__frame--placeholder">
              <button
                type="button"
                className="rp-player__play"
                onClick={handleMarkWatched}
                aria-label={
                  activeState?.completed
                    ? "Lesson watched"
                    : "Mark lesson as watched"
                }
                disabled={
                  isLoading ||
                  weekLocked ||
                  vdoLoading ||
                  activeState?.completed
                }
              >
                {activeState?.completed ? (
                  <CheckCircle2 size={26} />
                ) : weekLocked ? (
                  <Lock size={22} />
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
              </button>
            </div>
          )}

          <div className="rp-player__meta">
            <div className="rp-player__titles">
              <strong>{activeVideo.title}</strong>
              <small>
                {fmtDuration(activeVideo.durationSeconds)} · {stateText}
              </small>
            </div>
            {!activeState?.completed && !weekLocked && (
              <button
                type="button"
                className="rp-btn rp-btn--secondary rp-btn--sm"
                onClick={handleMarkWatched}
                disabled={isLoading}
              >
                <CheckCircle2 size={15} aria-hidden />
                {isLoading ? "Saving…" : "Mark as watched"}
              </button>
            )}
          </div>
        </div>

        {hasAside && (
          <div className="rp-lessons-aside">
            {lessons.length > 1 && (
              <div className="rp-subsection">
                <h3 className="rp-subhead">In this week</h3>
                <ul className="rp-lessons">
                  {lessons.map((l, i) => {
                    const s = videoStates[l.id] ?? {
                      completed: false,
                      progressPercent: 0,
                    };
                    const isActive = l.id === activeVideo.id;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          className={`rp-lesson${isActive ? " is-active" : ""}${s.completed ? " is-done" : ""}`}
                          onClick={() => setActiveVideoId(l.id)}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <span className="rp-lesson__icon" aria-hidden>
                            {s.completed ? (
                              <Check size={13} strokeWidth={3} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span className="rp-lesson__title">{l.title}</span>
                          <span className="rp-lesson__time">
                            {fmtDuration(l.durationSeconds)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {allAttachments.length > 0 && (
              <div className="rp-subsection">
                <h3 className="rp-subhead">Resources</h3>
                <ul className="rp-resources">
                  {allAttachments.map((a) => (
                    <li key={a.id}>
                      <a
                        className="rp-resource"
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="rp-resource__icon" aria-hidden>
                          {a.kind === "link" ? (
                            <Link2 size={15} />
                          ) : (
                            <FileText size={15} />
                          )}
                        </span>
                        <span className="rp-resource__text">
                          <strong>{a.title || a.url}</strong>
                          <small>
                            {a.kind === "link"
                              ? new URL(
                                  a.url,
                                  window.location.origin,
                                ).hostname.replace(/^www\./, "")
                              : `${(a.fileName?.split(".").pop() ?? "file").toUpperCase()}${
                                  a.fileSizeBytes
                                    ? ` · ${fmtBytes(a.fileSizeBytes)}`
                                    : ""
                                }`}
                          </small>
                        </span>
                        <span className="rp-resource__go" aria-hidden>
                          {a.kind === "link" ? (
                            <ExternalLink size={15} />
                          ) : (
                            <Download size={15} />
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {weekLocked && (
        <p className="rp-notice">
          <Lock size={14} aria-hidden /> This week is locked. Finish the
          previous week to unlock it.
        </p>
      )}
    </RpPanel>
  );
};

export default MaterialsColumn;
