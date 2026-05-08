/**
 * Editorial-style My Progress view.
 *
 * Mirrors the Claude-design reference: a serif welcome line, an
 * "Active track" card on the left, a "Nearest deadline" countdown on
 * the right, and a three-up row of mentor sessions / Top Coach
 * presents / AI recommendations underneath.
 *
 * Data sources are pulled from the same queries the legacy Dashboard
 * uses, so progress/deadlines/sessions stay in sync. Anything we
 * can't surface yet (deadline-day countdowns, Top Coach events feed)
 * is stubbed so the layout renders cleanly without empty holes.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import {
  ArrowRight,
  Plus,
  Search,
  Wand2,
  BookOpen,
  FlaskConical,
  GraduationCap,
  User as UserIcon,
  Building2,
  PenLine,
  LineChart,
  FileUp,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useGetCollegeApplicationsQuery } from 'src/app/services/student-hub/applicationTrackingApi';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import {
  useGetEnrollmentStatusQuery,
  useGetUserProgressQuery,
} from 'src/app/services/courses';
import { useGetResearchProgressSummaryQuery } from 'src/app/services/research-prep';
import {
  useGetCaafForumApplicationsMeQuery,
  useGetCaafForumRegistrationConfigQuery,
} from 'src/app/services/caafForumApi';
import {
  REGISTRATION_FEE_USD_FALLBACK,
  formatCaafRegistrationFeeUsd,
  isPastCaafRegistrationDeadline,
} from 'src/pages/events/central-asian-admissions-forum/constants';
import { SessionTypeEnum } from 'src/app/api/Api';
import TelegramConnectionChecklist from './components/TelegramConnectionChecklist';
import './MyProgressEditorialView.scss';

interface TrackInfo {
  key: 'admissions' | 'sat' | 'research';
  title: string;
  icon: React.ReactNode;
  completed: number;
  total: number;
  progressPct: number;
  unitLabel: string; // "lessons" or "weeks"
  ctaPath: string;
}

interface AiRecItem {
  number: string;
  title: string;
  desc: string;
  minutes: number;
}

interface SessionItem {
  id: string;
  date: string;       // ISO
  mentor: string;
  mentorId?: string;
  durationMin: number;
  meetingLink?: string;
}

const MyProgressEditorialView: React.FC = () => {
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery(undefined);
  const profile = useTypedSelector((s) => s.auth.profile);
  // Use the same source the profile sidebar card uses
  // (auth.profile.profile.name) so the greeting matches what the user
  // sees in the avatar card — e.g. "Sherali Ozodov" instead of the
  // email-derived "sheraliozodov6".
  const fullName: string =
    ((profile as any)?.profile?.name as string | undefined)?.trim() ||
    [(profile as any)?.firstName, (profile as any)?.lastName].filter(Boolean).join(' ') ||
    ((me as any)?.profile?.name as string | undefined)?.trim() ||
    (me as any)?.name ||
    [(me as any)?.firstName, (me as any)?.lastName].filter(Boolean).join(' ') ||
    'there';

  // ── Real learning-progress queries (same ones the legacy
  // AdmissionsProgramProgressCard uses) so the active-track card
  // mirrors the user's actual enrolled programs. ────────────────────
  const { data: admissionsEnrollment } = useGetEnrollmentStatusQuery('admissions');
  const { data: satEnrollment } = useGetEnrollmentStatusQuery('sat');
  const { data: admissionsProgress } = useGetUserProgressQuery('admissions', {
    skip: !admissionsEnrollment?.canAccessLearning,
  });
  const { data: satProgress } = useGetUserProgressQuery('sat', {
    skip: !satEnrollment?.canAccessLearning,
  });
  const { data: researchSummary } = useGetResearchProgressSummaryQuery();

  /** Build a unified "track" entry for each enrolled program. */
  const tracks: TrackInfo[] = useMemo(() => {
    const list: TrackInfo[] = [];
    if (admissionsEnrollment?.canAccessLearning && admissionsProgress) {
      const completed = admissionsProgress.completedLessons ?? 0;
      const total = admissionsProgress.totalLessons ?? 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      list.push({
        key: 'admissions',
        title: 'Admissions Program',
        icon: <BookOpen size={16} />,
        completed,
        total,
        progressPct: pct,
        unitLabel: 'lessons',
        ctaPath: '/student-hub?section=admissions-program',
      });
    }
    if (satEnrollment?.canAccessLearning && satProgress) {
      const completed = satProgress.completedLessons ?? 0;
      const total = satProgress.totalLessons ?? 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      list.push({
        key: 'sat',
        title: 'SAT Prep Course',
        icon: <GraduationCap size={16} />,
        completed,
        total,
        progressPct: pct,
        unitLabel: 'lessons',
        ctaPath: '/student-hub/sat-prep',
      });
    }
    if (researchSummary && (researchSummary.weeksCompleted ?? -1) >= 0) {
      const completed = researchSummary.weeksCompleted ?? 0;
      // Research Prep is fixed at 8 weeks (see ResearchProgressSummary type).
      const total = 8;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      list.push({
        key: 'research',
        title: 'Research Prep',
        icon: <FlaskConical size={16} />,
        completed,
        total,
        progressPct: pct,
        unitLabel: 'weeks',
        ctaPath: '/student-hub?section=research-program',
      });
    }
    return list;
  }, [admissionsEnrollment, satEnrollment, admissionsProgress, satProgress, researchSummary]);

  /** Most-progressed enrolled program is treated as the "active track". */
  const activeTrack: TrackInfo | null = useMemo(() => {
    if (!tracks.length) return null;
    return [...tracks].sort((a, b) => b.progressPct - a.progressPct)[0];
  }, [tracks]);

  // Pull college applications to derive the nearest-deadline card.
  const { data: applicationsResponse } = useGetCollegeApplicationsQuery(undefined as any);
  const applications = (applicationsResponse as any)?.data ?? applicationsResponse ?? [];
  const nearestDeadline = useMemo(() => {
    const now = Date.now();
    return [...applications]
      .filter((a: any) => a?.deadline && new Date(a.deadline).getTime() > now)
      .sort((a: any, b: any) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      )[0];
  }, [applications]);
  const daysToDeadline = nearestDeadline?.deadline
    ? Math.max(0, dayjs(nearestDeadline.deadline).diff(dayjs(), 'day'))
    : null;

  // ── Real mentor sessions from auth profile.joinedSessions ────────
  const joinedSessions = (profile as any)?.joinedSessions as any[] | undefined;
  // Tab state for the Mentor sessions card. Declared up here so the
  // `visibleSessions` memo below can read it without TDZ errors.
  const [sessionTab, setSessionTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  /** Map a raw joinedSession row to a normalized SessionItem. */
  const mapSession = (s: any, i: number): SessionItem => ({
    id: String(s.id ?? i),
    date: s.date,
    mentor: s.mentor?.profile?.name || s.mentorName || 'Mentor',
    mentorId: s.mentor?.id,
    durationMin: s.type === SessionTypeEnum.Individual30M ? 30 : 60,
    meetingLink: s.calendarInfo?.meetingLink,
  });

  const upcomingSessions: SessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    const now = Date.now();
    return joinedSessions
      .filter((s) => s?.date && new Date(s.date).getTime() > now && !s.cancelStatus)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  /** Past sessions = ended (start + duration < now) AND not cancelled. */
  const pastSessions: SessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    return joinedSessions
      .filter((s) => {
        if (!s?.date || s.cancelStatus) return false;
        const dur = s.type === SessionTypeEnum.Individual30M ? 30 : 60;
        return Date.now() > new Date(s.date).getTime() + dur * 60 * 1000;
      })
      // Newest past session first.
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  /** Cancelled sessions — status object is non-null. */
  const cancelledSessions: SessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    return joinedSessions
      .filter((s) => s.cancelStatus !== null && s.cancelStatus?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  /**
   * Sessions shown in the body. We render the full list so the user can
   * scroll to access older meetings (the list itself is height-capped via
   * CSS to keep the card compact). Returning `.slice(0, 5)` previously
   * hid past meetings beyond the 5th — bug surfaced when a student had 9
   * past meetings but the card only ever showed 5.
   */
  const visibleSessions = useMemo(() => {
    const list =
      sessionTab === 'upcoming' ? upcomingSessions
      : sessionTab === 'past'   ? pastSessions
      : cancelledSessions;
    return list;
  }, [sessionTab, upcomingSessions, pastSessions, cancelledSessions]);

  // CAAF Forum — real promo data. The Top Coach Presents card derives
  // its state (Register / Pending payment / Registered / closed) from
  // the user's actual application + the live registration config.
  const { data: caafConfig } = useGetCaafForumRegistrationConfigQuery();
  const { data: caafMe, isLoading: caafMeLoading } = useGetCaafForumApplicationsMeQuery();
  const caafApplication = caafMe?.application ?? null;
  const caafFeeUsd = caafConfig?.registrationFeeUsd ?? REGISTRATION_FEE_USD_FALLBACK;
  const caafFeeLabel = formatCaafRegistrationFeeUsd(caafFeeUsd);
  const caafRegistrationClosed = isPastCaafRegistrationDeadline();
  // Promo only renders when there's something to act on:
  //   - A current registration (any status), OR
  //   - Registration is still open
  // Otherwise we fall back to the "no active event" empty card.
  const showCaafPromo = !!caafApplication || !caafRegistrationClosed;

  /**
   * Dynamic AI recommendations derived from the user's actual data.
   *
   * Builds a prioritized list of 3 things the user can do right now,
   * keyed off enrollments, progress, deadlines, and sessions. Each
   * recommendation has a real CTA path so clicks lead somewhere
   * meaningful — no static placeholders.
   */
  const aiRecs: AiRecItem[] = useMemo(() => {
    type Rec = AiRecItem & { priority: number; ctaPath: string };
    const recs: Rec[] = [];

    // Nearest deadline → highest priority.
    if (nearestDeadline && daysToDeadline != null) {
      const urgency = daysToDeadline <= 14 ? 'urgent' : daysToDeadline <= 30 ? 'soon' : 'planned';
      recs.push({
        number: '01',
        title: `${urgency === 'urgent' ? 'Finalize' : 'Work on'} your ${nearestDeadline.universityName} application`,
        desc: `${daysToDeadline} day${daysToDeadline === 1 ? '' : 's'} until the deadline. Open the checklist and tackle the next open item.`,
        minutes: 20,
        priority: urgency === 'urgent' ? 0 : urgency === 'soon' ? 1 : 2,
        ctaPath: '/student-hub?section=others&target=college-lists',
      });
    }

    // In-progress track with most lessons remaining.
    const tracksByLessonsLeft = [...tracks].sort(
      (a, b) => (b.total - b.completed) - (a.total - a.completed),
    );
    const headTrack = tracksByLessonsLeft[0];
    if (headTrack && headTrack.total > headTrack.completed) {
      const remaining = headTrack.total - headTrack.completed;
      recs.push({
        number: '02',
        title: `Continue ${headTrack.title}`,
        desc: `${remaining} ${headTrack.unitLabel} left at ${headTrack.progressPct}% complete. Resume your last lesson and keep momentum going.`,
        minutes: 30,
        priority: headTrack.progressPct < 25 ? 1 : 2,
        ctaPath: headTrack.ctaPath,
      });
    }

    // Mentor session → reminder.
    if (upcomingSessions.length > 0) {
      const next = upcomingSessions[0];
      const days = dayjs(next.date).diff(dayjs(), 'day');
      recs.push({
        number: '03',
        title: `Prep for your session with ${next.mentor}`,
        desc: `${days <= 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} away`}. Send your draft or questions before you meet.`,
        minutes: 10,
        priority: days <= 1 ? 0 : 2,
        ctaPath: '/student-hub?section=messages',
      });
    }

    // Fallback if very few signals: nudge toward enrolling / community.
    if (recs.length < 3) {
      if (!tracks.length) {
        recs.push({
          number: String(recs.length + 1).padStart(2, '0') as any,
          title: 'Enroll in your first program',
          desc: 'Start with the Admissions Program, SAT Prep, or Research Prep to unlock your dashboard.',
          minutes: 5,
          priority: 1,
          ctaPath: '/programs',
        });
      }
      if (recs.length < 3 && !applications.length) {
        recs.push({
          number: String(recs.length + 1).padStart(2, '0') as any,
          title: 'Add your first college',
          desc: 'Track deadlines and progress per school. The next 60 seconds will save you weeks.',
          minutes: 1,
          priority: 2,
          ctaPath: '/student-hub?section=others&target=college-lists',
        });
      }
      if (recs.length < 3) {
        recs.push({
          number: String(recs.length + 1).padStart(2, '0') as any,
          title: 'Find a study buddy',
          desc: 'Connect with peers on the same path — same target schools, similar timelines.',
          minutes: 3,
          priority: 2,
          ctaPath: '/student-hub?section=buddies',
        });
      }
    }

    // Sort by priority and re-number 01/02/03.
    return recs
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((r, i) => ({ ...r, number: String(i + 1).padStart(2, '0') }));
  }, [nearestDeadline, daysToDeadline, tracks, upcomingSessions, applications.length]);

  const greeting = (
    <>
      Hi, {fullName}.{' '}
      <span className="myprog__title-muted">Let&rsquo;s keep moving.</span>
    </>
  );

  // Quick Add dropdown — mirrors the legacy Dashboard menu so the
  // common "I want to do X" entry points stay one click away from the
  // editorial header.
  const quickAddItems = [
    {
      key: 'profile',
      label: 'Complete profile',
      icon: <UserIcon size={14} />,
      onClick: () => navigate('/student-hub/profile'),
    },
    {
      key: 'application',
      label: 'Add to college list',
      icon: <Building2 size={14} />,
      onClick: () => navigate('/student-hub?section=others&target=college-lists&applicationFlow=new'),
    },
    {
      key: 'essay',
      label: 'Start an essay',
      icon: <PenLine size={14} />,
      onClick: () => navigate('/student-hub/essays'),
    },
    {
      key: 'psychometric',
      label: 'Psychometric test',
      icon: <LineChart size={14} />,
      onClick: () => navigate('/student-hub/psychometric-assessment'),
    },
    {
      key: 'document',
      label: 'Upload a document',
      icon: <FileUp size={14} />,
      onClick: () => navigate('/student-hub/documents'),
    },
  ];

  // Discover entry → AI Major Match. Same target the legacy "Discover"
  // pill in the dashboard top bar opens.
  const handleDiscover = () => navigate('/student-hub?section=ai-major-match');

  return (
    <div className="myprog">
      <header className="myprog__header">
        <div className="myprog__head-left">
          <h1 className="myprog__title">{greeting}</h1>
          <p className="myprog__desc">
            Below: where you left off, what&rsquo;s next, and who&rsquo;s expecting you.
          </p>
        </div>
        <div className="myprog__head-actions">
          <button
            type="button"
            className="myprog__btn myprog__btn--ghost"
            onClick={handleDiscover}
          >
            <Search size={14} /> Discover
          </button>
          <Dropdown
            menu={{ items: quickAddItems }}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="myprog__quickadd-menu"
          >
            <button type="button" className="myprog__btn myprog__btn--primary">
              <Plus size={14} /> Quick add
            </button>
          </Dropdown>
        </div>
      </header>

      {/* Telegram connect prompt — auto-hides once the student links
          their Telegram account. Only the *checklist UI* is shown here;
          the tracking telegram bot still pings notifications elsewhere. */}
      <TelegramConnectionChecklist />

      {/* Your Learning Progress — all enrolled tracks in a row.
          Switched from a single "Active track" highlight to the 3-up
          layout so users see every program they're enrolled in. */}
      <section className="myprog__tracks-section">
        <article className="myprog__card myprog__tracks">
          <div className="myprog__tracks-head">
            <div>
              <div className="myprog__card-eyebrow">Your learning progress</div>
              <h2 className="myprog__card-title">
                {tracks.length} program{tracks.length === 1 ? '' : 's'} enrolled
              </h2>
            </div>
          </div>
          {tracks.length === 0 ? (
            <div className="myprog__tracks-empty">
              <p>
                Enroll in the Admissions Program, SAT Prep, or Research Prep to start
                tracking your progress here.
              </p>
              <button
                type="button"
                className="myprog__btn myprog__btn--primary"
                onClick={() => navigate('/programs')}
              >
                Browse programs <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="myprog__tracks-grid">
              {tracks.map((t) => {
                const stateLabel =
                  t.progressPct >= 100 ? 'Completed' : t.progressPct > 0 ? 'In progress' : 'Not started';
                const stateClass =
                  t.progressPct >= 100 ? 'done' : t.progressPct > 0 ? 'progress' : 'idle';
                return (
                  <div key={t.key} className="myprog__track">
                    <div className="myprog__track-head">
                      <span className="myprog__track-icon">{t.icon}</span>
                      <span className="myprog__track-name">{t.title}</span>
                      <span className={`myprog__track-pill myprog__track-pill--${stateClass}`}>
                        {stateLabel}
                      </span>
                    </div>
                    <div className="myprog__track-stats">
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{t.completed}</div>
                        <div className="myprog__track-stat-label">
                          {t.unitLabel} completed
                        </div>
                      </div>
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{t.total || '—'}</div>
                        <div className="myprog__track-stat-label">total {t.unitLabel}</div>
                      </div>
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{t.progressPct}%</div>
                        <div className="myprog__track-stat-label">overall</div>
                      </div>
                    </div>
                    <div className="myprog__track-bar">
                      <div
                        className="myprog__track-bar-fill"
                        style={{ width: `${t.progressPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      className="myprog__btn myprog__btn--primary myprog__track-cta"
                      onClick={() => navigate(t.ctaPath)}
                    >
                      Continue learning <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>


      {/* Bottom row: Mentor sessions + Top Coach promo + AI recs */}
      <section className="myprog__btmgrid">
        <article className="myprog__card myprog__sessions">
          <div className="myprog__sessions-head">
            <h3 className="myprog__sessions-title">Mentor sessions</h3>
          </div>
          <div className="myprog__sessions-tabs">
            {(['upcoming', 'past', 'cancelled'] as const).map((tab) => {
              const count =
                tab === 'upcoming' ? upcomingSessions.length
                : tab === 'past' ? pastSessions.length
                : cancelledSessions.length;
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              return (
                <button
                  key={tab}
                  type="button"
                  className={`myprog__sessions-tab ${sessionTab === tab ? 'is-active' : ''}`}
                  onClick={() => setSessionTab(tab)}
                >
                  {count > 0 ? `${label} · ${count}` : label}
                </button>
              );
            })}
          </div>
          <ul className="myprog__sessions-list">
            {visibleSessions.length === 0 && (
              <li className="myprog__sessions-empty">
                {sessionTab === 'upcoming'
                  ? 'No upcoming sessions. Book a mentor below to get started.'
                  : sessionTab === 'past'
                    ? 'No past sessions to show.'
                    : 'No cancelled sessions.'}
              </li>
            )}
            {visibleSessions.map((s) => {
              const date = dayjs(s.date);
              const isUpcoming = sessionTab === 'upcoming';
              return (
                <li key={s.id} className="myprog__session-card">
                  {isUpcoming && (
                    <div className="myprog__session-top">
                      {s.meetingLink ? (
                        <button
                          type="button"
                          className="myprog__session-join"
                          onClick={() => window.open(s.meetingLink, '_blank')}
                        >
                          Join the session
                          <ArrowRight size={11} />
                        </button>
                      ) : (
                        <span className="myprog__session-join myprog__session-join--idle">
                          Pending link
                        </span>
                      )}
                      {/* Single pulsing live dot — was duplicated by an
                          emoji before the link; emoji removed. */}
                      <span className="myprog__session-live" aria-hidden />
                    </div>
                  )}
                  <div className="myprog__session-date">
                    {date.format('MMMM Do, YYYY')}
                  </div>
                  <div className="myprog__session-time">
                    {date.format('h:mm A')}
                    {sessionTab === 'past' && ' · Completed'}
                    {sessionTab === 'cancelled' && ' · Cancelled'}
                  </div>
                  <div className="myprog__session-with">
                    {s.durationMin} min meeting with{' '}
                    <button
                      type="button"
                      className="myprog__session-mentor-link"
                      onClick={() => s.mentorId && navigate(`/mentors/${s.mentorId}`)}
                    >
                      {s.mentor}
                    </button>
                  </div>
                  {/* Chat is also available for past sessions so the
                      student can follow up on the meeting (notes, recap,
                      next steps). Hidden for cancelled. */}
                  {sessionTab !== 'cancelled' && (
                    <button
                      type="button"
                      className="myprog__btn myprog__btn--primary myprog__session-chat"
                      onClick={() => navigate('/student-hub?section=messages')}
                    >
                      Chat with mentor
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="myprog__btn myprog__btn--ghost myprog__sessions-book"
            onClick={() => navigate('/mentors')}
          >
            <Plus size={13} /> Book a mentor
          </button>
        </article>

        {/* Top Coach Presents — pulls from the live CAAF Forum API.
            State branches by application status:
              • no application + open  → "Reserve your spot" + Register
              • pending_payment        → "Pending payment" + Pay $X
              • paid                   → "Registered" + View
              • cancelled              → re-apply prompt
            When there's no active event (registration closed, no
            existing application) we render a quiet empty card instead. */}
        {!showCaafPromo ? (
          <article className="myprog__card myprog__promo myprog__promo--empty">
            <div className="myprog__promo-empty-eyebrow">Top Coach presents</div>
            <div className="myprog__promo-empty-icon">📅</div>
            <div className="myprog__promo-empty-title">No active event</div>
            <p className="myprog__promo-empty-desc">
              We're between events right now. The next forum will appear here as
              soon as registration opens.
            </p>
          </article>
        ) : (
          <article className="myprog__card myprog__promo">
            <div className="myprog__promo-yr">2026</div>
            <div className="myprog__promo-eyebrow">Top Coach presents</div>
            <h3 className="myprog__promo-title">Central Asian Admissions Forum</h3>
            <div className="myprog__promo-meta">Tashkent · Spring 2026</div>
            <p className="myprog__promo-desc">
              One-day forum with admissions officers from 14 universities. Live
              Q&amp;A, essay clinic, and a closing reception.
            </p>
            <div className="myprog__promo-foot">
              {caafApplication?.status === 'paid' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--paid">Registered</span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    View ticket
                  </button>
                </>
              ) : caafApplication?.status === 'pending_payment' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--pending">
                      Pending payment
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__btn--primary myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    Pay {caafFeeLabel}
                  </button>
                </>
              ) : caafApplication?.status === 'cancelled' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--cancelled">
                      Cancelled
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    Re-apply
                  </button>
                </>
              ) : (
                <>
                  <div className="myprog__promo-foot-status">
                    {caafMeLoading ? 'Loading…' : `Reserve your spot · ${caafFeeLabel}`}
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__btn--primary myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </article>
        )}

        {/* AI Recommendations */}
        <article className="myprog__card myprog__airecs">
          <div className="myprog__airecs-head">
            <span className="myprog__airecs-glyph">
              <Wand2 size={13} />
            </span>
            <span className="myprog__airecs-eyebrow">AI recommendations</span>
          </div>
          <h3 className="myprog__airecs-title">
            Three things you can do today to move the needle.
          </h3>
          {aiRecs.length === 0 ? (
            <p className="myprog__airecs-empty">
              All caught up — nothing pressing today. Your dashboard will surface
              new tasks as deadlines approach and progress shifts.
            </p>
          ) : (
            <ol className="myprog__airecs-list">
              {aiRecs.map((rec) => (
                <li
                  key={rec.number}
                  className="myprog__airecs-row myprog__airecs-row--link"
                  onClick={() => navigate((rec as any).ctaPath ?? '/student-hub')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate((rec as any).ctaPath ?? '/student-hub');
                  }}
                >
                  <span className="myprog__airecs-num">{rec.number}</span>
                  <div className="myprog__airecs-body">
                    <div className="myprog__airecs-rt">
                      <div className="myprog__airecs-name">{rec.title}</div>
                      <span className="myprog__airecs-time">
                        {rec.minutes} min
                      </span>
                    </div>
                    <div className="myprog__airecs-desc">{rec.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </div>
  );
};

export default MyProgressEditorialView;
