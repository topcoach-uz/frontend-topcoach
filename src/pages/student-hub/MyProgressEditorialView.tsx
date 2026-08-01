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
import { useTranslation } from 'react-i18next';
import { App, Dropdown, Form, Input, Modal, Skeleton } from 'antd';
import {
  ArrowRight,
  Plus,
  Wand2,
  BookOpen,
  FlaskConical,
  GraduationCap,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { GoogleMeetingSvg } from 'src/assets/svg';
import { useCancelSessionAsStudentMutation } from 'src/app/services/sessions';
import { useInvalidateGetMeMutation } from 'src/app/services/users';
import dayjs from 'dayjs';
import { useGetCollegeApplicationsQuery } from 'src/app/services/student-hub/applicationTrackingApi';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import {
  useGetEnrollmentStatusQuery,
  useGetUserProgressQuery,
} from 'src/app/services/courses';
import { useGetResearchProgressSummaryQuery } from 'src/app/services/research-prep';
import {
  useGetCaafForumApplicationsMeQuery,
  useGetCaafForumRegistrationConfigQuery,
} from 'src/app/services/caafForumApi';
import { useGetTopcoachLaunchEventMeQuery } from 'src/app/services/topcoachLaunchEventApi';
import { useLaunchEventPromoVisible } from 'src/lib/launchEventAccess';
import {
  REGISTRATION_FEE_USD_FALLBACK,
  formatCaafRegistrationFeeUsd,
  isPastCaafRegistrationDeadline,
} from 'src/pages/events/central-asian-admissions-forum/constants';
import { useMentorSessions } from 'src/hooks/useMentorSessions';
import { useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import MajorMatchCollectModal from './components/MajorMatchCollectModal';
import { ISC_2026_ENABLED } from 'src/lib/iscAccess';
import { useIscCardState } from '../events/_components/useIscCardState';
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

const MyProgressEditorialView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: me } = useGetMeQuery(undefined);
  const profile = useTypedSelector((s) => s.auth.profile);
  const { isCommunityEnrolled } = useJourneyExperience();
  // Major-Match hero (non-Community dashboard) — knows whether the
  // student has already completed the assessment and where the CTA
  // should route (assessment start, or the community gate destination
  // if their one free attempt is already used).
  const mm = useMajorMatchPromptState();
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
  const { data: admissionsEnrollment, isLoading: admissionsEnrollmentLoading } =
    useGetEnrollmentStatusQuery('admissions');
  const { data: satEnrollment, isLoading: satEnrollmentLoading } =
    useGetEnrollmentStatusQuery('sat');
  const { data: admissionsProgress, isLoading: admissionsProgressLoading } =
    useGetUserProgressQuery('admissions', {
      skip: !admissionsEnrollment?.canAccessLearning,
    });
  const { data: satProgress, isLoading: satProgressLoading } = useGetUserProgressQuery('sat', {
    skip: !satEnrollment?.canAccessLearning,
  });
  const { data: researchSummary, isLoading: researchLoading } =
    useGetResearchProgressSummaryQuery();

  // Enrollment/progress queries still in flight. While true (and no track
  // data has landed yet) we hold skeletons in place of the tracks grid and
  // AI recommendations instead of computing "not enrolled" fallbacks from
  // empty data that swap to real content a beat later.
  const tracksLoading =
    admissionsEnrollmentLoading ||
    satEnrollmentLoading ||
    admissionsProgressLoading ||
    satProgressLoading ||
    researchLoading;

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
  const { data: applicationsResponse, isLoading: applicationsLoading } =
    useGetCollegeApplicationsQuery(undefined as any);
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
  // Shared with the community feed's "Upcoming sessions" rail widget via
  // `useMentorSessions` so the two surfaces can never disagree.
  const { upcomingSessions, pastSessions, cancelledSessions } = useMentorSessions();
  // Tab state for the Mentor sessions card. Declared up here so the
  // `visibleSessions` memo below can read it without TDZ errors.
  const [mmCollectOpen, setMmCollectOpen] = useState(false);
  const [sessionTab, setSessionTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  /* — Withdraw flow state ────────────────────────────────────────
   * The 3-dot menu on each upcoming session card opens a modal that
   * mirrors the legacy UpcomingCard withdraw experience (reason
   * picker + free-text "Other"). Triggered with the session id of
   * whichever card the menu was opened from.
   */
  const { message } = App.useApp();
  const [withdrawForm] = Form.useForm();
  const [withdrawModalSessionId, setWithdrawModalSessionId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState<string>('');
  const [cancelAsStudent, { isLoading: cancelingAsStudent }] = useCancelSessionAsStudentMutation();
  const [invalidateGetMe] = useInvalidateGetMeMutation();
  // NOTE: kept in English — `withdrawReason` is compared by literal value
  // below (e.g. `=== 'Other'`), so these act as state keys, not just labels.
  const WITHDRAW_REASONS = [
    'I have another meeting',
    'I have an emergency',
    'I have a personal problem',
    'I have a technical problem',
    'Other',
  ];

  const closeWithdrawModal = () => {
    setWithdrawModalSessionId(null);
    setWithdrawReason('');
    withdrawForm.resetFields();
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawModalSessionId) return;
    const formValues = withdrawForm.getFieldsValue();
    const finalReason =
      withdrawReason === 'Other' ? formValues.customReason?.trim() : withdrawReason;
    if (!finalReason) {
      message.warning(t('studentHub.myProgress.pickReasonWarning', 'Please pick a reason.'));
      return;
    }
    try {
      await cancelAsStudent({ id: withdrawModalSessionId, comment: finalReason }).unwrap();
      message.success(
        t('studentHub.myProgress.withdrawSuccess', 'You have withdrawn from the session.'),
      );
      // Refresh /users/me so joinedSessions drops the cancelled meeting.
      await invalidateGetMe();
      closeWithdrawModal();
    } catch (e: any) {
      message.error(
        e?.data?.message ||
          t('studentHub.myProgress.withdrawError', 'Could not withdraw. Try again.'),
      );
    }
  };
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
  // A "pending_payment" application that's already past the registration
  // deadline is dead state — the user can no longer pay, the forum has
  // happened. Treat those applications as if they don't exist so the
  // promo falls back to the "no active event" empty card instead of
  // showing a stale "Pay {fee}" button for a finished event.
  const caafApplicationIsActionable =
    !!caafApplication &&
    !(caafApplication.status === 'pending_payment' && caafRegistrationClosed);
  // Promo only renders when there's something to act on:
  //   - An actionable registration (paid history, cancelled, or
  //     in-flight pending_payment before the deadline), OR
  //   - Registration is still open for new sign-ups.
  // Otherwise we fall back to the "no active event" empty card.
  const showCaafPromo = caafApplicationIsActionable || !caafRegistrationClosed;

  // International Summer Camp 2026 — current flagship intake. Takes the
  // "Top Coach presents" slot while applications are open. The CTA +
  // status line reflect the user's live application state (apply / resume /
  // submitted / accepted …) via the shared hook.
  const showIscPromo = ISC_2026_ENABLED;
  const iscCard = useIscCardState();

  // Top Coach Launch Event — free event on May 24, 2026. While the
  // event hasn't passed, this card takes precedence over the CAAF
  // promo because it's the nearest live event we want students to act
  // on. After May 24 it disappears and CAAF (or the empty state) takes
  // back the slot.
  // The promo card has its own auto-hide cutoff (noon on event day,
  // a day later than the public-page cutoff) so already-registered
  // users keep their reminder up until the event itself. Both cutoffs
  // are defined in `launchEventAccess.ts` so there's a single source
  // of truth for "is this event still alive on the site."
  const launchPromoVisible = useLaunchEventPromoVisible();
  const { data: launchMe, isLoading: launchMeLoading } =
    useGetTopcoachLaunchEventMeQuery(undefined, { skip: !launchPromoVisible });
  const launchRegistration = launchMe?.registration ?? null;
  const showLaunchPromo = launchPromoVisible;

  /**
   * Dynamic AI recommendations derived from the user's actual data.
   *
   * Builds a prioritized list of 3 things the user can do right now,
   * keyed off enrollments, progress, deadlines, and sessions. Each
   * recommendation has a real CTA path so clicks lead somewhere
   * meaningful — no static placeholders.
   */
  // Recs derive from tracks + applications — don't compute the "enroll in
  // your first program / add your first college" fallbacks from data that
  // simply hasn't arrived yet.
  const aiRecsLoading = tracksLoading || applicationsLoading;

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
        ctaPath: '/student-hub?section=others&target=profile&tab=college-lists',
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
          ctaPath: '/student-hub?section=others&target=profile&tab=college-lists',
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

  const greeting = t('studentHub.myProgress.greeting', 'Hi, {{name}}.', { name: fullName });

  return (
    <div className="myprog">
      <header className="myprog__header">
        <div className="myprog__head-left">
          <h1 className="myprog__title">
            {t('studentHub.myProgress.dashboardTitle', 'Dashboard')}
          </h1>
          <p className="myprog__greeting">{greeting}</p>
        </div>
      </header>

      {/* Non-Community users see the AI Major Match hero in place of the
          learning-progress card — the progress card is useless when
          they're enrolled in nothing, and Major Match is the highest-signal
          free tool we can put in front of a not-yet-enrolled student.
          Community users see the real progress card below.

          Layout: one card, two columns — hero copy on the left, trailer
          on the right, vertically centered against each other. DOM order
          stays text-then-video (it collapses to a single stacked column
          on narrow viewports, text above video). Below the hero: Telegram
          faint program links. */}
      {!isCommunityEnrolled ? (
        <section className="myprog__tracks-section">
          <article className="myprog__card myprog__mmhero">
            <div className="myprog__mmhero__left">
              <span className="myprog__mmhero__eyebrow">
                {t('studentHub.myProgress.majorMatchEyebrow', 'AI Major Match')}
              </span>
              {mm.hasCompletedAssessment ? (
                <>
                  <h2 className="myprog__mmhero__title">
                    {t('studentHub.myProgress.majorMatchTakenTitle', 'Your major match is ready')}
                  </h2>
                  <p className="myprog__mmhero__lede">
                    {t(
                      'studentHub.myProgress.majorMatchTakenLede',
                      'Revisit your best-fit majors and recommendations.',
                    )}
                  </p>
                  <div className="myprog__mmhero__actions">
                    <button
                      type="button"
                      className="myprog__btn myprog__btn--primary myprog__mmhero__cta"
                      onClick={() => navigate('/student-hub?section=ai-major-match')}
                    >
                      {t('studentHub.myProgress.majorMatchViewResults', 'View your results')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="myprog__mmhero__title">
                    {t(
                      'studentHub.myProgress.majorMatchNotTakenTitle',
                      'Struggling with finding the right major?',
                    )}
                  </h2>
                  <p className="myprog__mmhero__lede">
                    {t(
                      'studentHub.myProgress.majorMatchNotTakenLede',
                      'Try our free AI major tool — answer a few questions and get your best-fit majors in ~15 minutes.',
                    )}
                  </p>
                  <div className="myprog__mmhero__actions">
                    <button
                      type="button"
                      className="myprog__btn myprog__btn--primary myprog__mmhero__cta"
                      onClick={() => setMmCollectOpen(true)}
                    >
                      {t('studentHub.myProgress.majorMatchCta', 'Try this free AI major tool')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Trailer — right column at desktop widths, stacks below the
                text on collapse. Keeps its own 16:9 box (no stretching to
                match the text column's height); the row centers the two
                columns against each other instead. */}
            <div className="myprog__mmhero__media">
              <div className="myprog__mmvideo">
                <iframe
                  className="myprog__mmvideo-iframe"
                  src="https://www.youtube-nocookie.com/embed/0ntdgdT3JCs?rel=0&modestbranding=1&playsinline=1"
                  title="Top Coach Community"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {/* Your Learning Progress — only for Community-enrolled users.
          For non-community users the hero card above replaces it (an
          empty "0 programs enrolled" card was pure visual noise). */}
      {isCommunityEnrolled ? (
        <section className="myprog__tracks-section">
          <article className="myprog__card myprog__tracks">
            <div className="myprog__tracks-head">
              <div>
                <div className="myprog__card-eyebrow">
                  {t('studentHub.myProgress.learningProgress', 'Your learning progress')}
                </div>
                <h2 className="myprog__card-title">
                  {tracksLoading && tracks.length === 0 ? (
                    <Skeleton.Input active size="small" style={{ width: 200 }} />
                  ) : (
                    <>
                      {tracks.length}{' '}
                      {tracks.length === 1
                        ? t('studentHub.myProgress.programSingular', 'program')
                        : t('studentHub.myProgress.programPlural', 'programs')}{' '}
                      {t('studentHub.myProgress.enrolled', 'enrolled')}
                    </>
                  )}
                </h2>
              </div>
            </div>
            {tracksLoading && tracks.length === 0 ? (
              // Queries in flight, nothing landed yet — hold a track-sized
              // skeleton instead of the "enroll to start tracking" empty state.
              <div className="myprog__tracks-grid">
                <div className="myprog__track">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="myprog__tracks-empty">
                <p>
                  {t(
                    'studentHub.myProgress.tracksEmptyDesc',
                    'Enroll in the Admissions Program, SAT Prep, or Research Prep to start tracking your progress here.',
                  )}
                </p>
                <button
                  type="button"
                  className="myprog__btn myprog__btn--primary"
                  onClick={() => navigate('/programs')}
                >
                  {t('studentHub.myProgress.browsePrograms', 'Browse programs')}{' '}
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
            <div className="myprog__tracks-grid">
              {tracks.map((track) => {
                const stateLabel =
                  track.progressPct >= 100
                    ? t('studentHub.myProgress.stateCompleted', 'Completed')
                    : track.progressPct > 0
                      ? t('studentHub.myProgress.stateInProgress', 'In progress')
                      : t('studentHub.myProgress.stateNotStarted', 'Not started');
                const stateClass =
                  track.progressPct >= 100 ? 'done' : track.progressPct > 0 ? 'progress' : 'idle';
                return (
                  <div key={track.key} className="myprog__track">
                    <div className="myprog__track-head">
                      <span className="myprog__track-icon">{track.icon}</span>
                      <span className="myprog__track-name">{track.title}</span>
                      <span className={`myprog__track-pill myprog__track-pill--${stateClass}`}>
                        {stateLabel}
                      </span>
                    </div>
                    <div className="myprog__track-stats">
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{track.completed}</div>
                        <div className="myprog__track-stat-label">
                          {track.unitLabel} {t('studentHub.myProgress.completedSuffix', 'completed')}
                        </div>
                      </div>
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{track.total || '—'}</div>
                        <div className="myprog__track-stat-label">
                          {t('studentHub.myProgress.totalPrefix', 'total')} {track.unitLabel}
                        </div>
                      </div>
                      <div className="myprog__track-stat">
                        <div className="myprog__track-stat-num">{track.progressPct}%</div>
                        <div className="myprog__track-stat-label">
                          {t('studentHub.myProgress.overall', 'overall')}
                        </div>
                      </div>
                    </div>
                    <div className="myprog__track-bar">
                      <div
                        className="myprog__track-bar-fill"
                        style={{ width: `${track.progressPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      className="myprog__btn myprog__btn--primary myprog__track-cta"
                      onClick={() => navigate(track.ctaPath)}
                    >
                      {t('studentHub.myProgress.continueLearning', 'Continue learning')}{' '}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          </article>
        </section>
      ) : null}

      {/* Bottom row: Mentor sessions + Top Coach promo + AI recs */}
      <section className="myprog__btmgrid">
        <article className="myprog__card myprog__sessions">
          <div className="myprog__sessions-head">
            <h3 className="myprog__sessions-title">
              {t('studentHub.myProgress.mentorSessionsTitle', 'Mentor sessions')}
            </h3>
          </div>
          <div className="myprog__sessions-tabs">
            {(['upcoming', 'past', 'cancelled'] as const).map((tab) => {
              const count =
                tab === 'upcoming' ? upcomingSessions.length
                : tab === 'past' ? pastSessions.length
                : cancelledSessions.length;
              const tabLabels = {
                upcoming: t('studentHub.myProgress.tabUpcoming', 'Upcoming'),
                past: t('studentHub.myProgress.tabPast', 'Past'),
                cancelled: t('studentHub.myProgress.tabCancelled', 'Cancelled'),
              };
              const label = tabLabels[tab];
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
                  ? t(
                      'studentHub.myProgress.emptyUpcoming',
                      'No upcoming sessions. Book a mentor below to get started.',
                    )
                  : sessionTab === 'past'
                    ? t('studentHub.myProgress.emptyPast', 'No past sessions to show.')
                    : t('studentHub.myProgress.emptyCancelled', 'No cancelled sessions.')}
              </li>
            )}
            {visibleSessions.map((s) => {
              const date = dayjs(s.date);
              const isUpcoming = sessionTab === 'upcoming';
              return (
                <li key={s.id} className="myprog__session-card">
                  {isUpcoming && (
                    <div className="myprog__session-top">
                      {/* Google Meet icon — visual cue that the join
                          link goes to Meet, mirrors the legacy
                          UpcomingCard treatment. */}
                      <span className="myprog__session-meet" aria-hidden>
                        <GoogleMeetingSvg />
                      </span>
                      {s.meetingLink ? (
                        <button
                          type="button"
                          className="myprog__session-join"
                          onClick={() => window.open(s.meetingLink, '_blank')}
                        >
                          {t('studentHub.myProgress.joinSession', 'Join the session')}
                          <ArrowRight size={11} />
                        </button>
                      ) : (
                        <span className="myprog__session-join myprog__session-join--idle">
                          {t('studentHub.myProgress.pendingLink', 'Pending link')}
                        </span>
                      )}
                      {/* Single pulsing live dot — was duplicated by an
                          emoji before the link; emoji removed. */}
                      <span className="myprog__session-live" aria-hidden />
                      {/* 3-dot menu — mirrors the legacy UpcomingCard
                          dropdown. Only "Withdraw from the meeting" is
                          surfaced here (the rate/report flow lives in
                          the Past tab via Chat / mentor profile). */}
                      <Dropdown
                        trigger={['click']}
                        placement="bottomRight"
                        menu={{
                          items: [
                            {
                              key: 'withdraw',
                              label: (
                                <span className="myprog__session-withdraw-item">
                                  {t(
                                    'studentHub.myProgress.withdrawFromMeeting',
                                    'Withdraw from the meeting',
                                  )}
                                </span>
                              ),
                              onClick: () => {
                                setWithdrawModalSessionId(s.id);
                                setWithdrawReason('');
                                withdrawForm.resetFields();
                              },
                            },
                          ],
                        }}
                      >
                        <button
                          type="button"
                          className="myprog__session-more"
                          aria-label={t('studentHub.myProgress.sessionOptions', 'Session options')}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </Dropdown>
                    </div>
                  )}
                  <div className="myprog__session-date">
                    {date.format('MMMM Do, YYYY')}
                  </div>
                  <div className="myprog__session-time">
                    {date.format('h:mm A')}
                    {sessionTab === 'past' &&
                      ` · ${t('studentHub.myProgress.sessionCompleted', 'Completed')}`}
                    {sessionTab === 'cancelled' &&
                      ` · ${t('studentHub.myProgress.sessionCancelled', 'Cancelled')}`}
                  </div>
                  <div className="myprog__session-with">
                    {s.durationMin} {t('studentHub.myProgress.minMeetingWith', 'min meeting with')}{' '}
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
                      {t('studentHub.myProgress.chatWithMentor', 'Chat with mentor')}
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
            <Plus size={13} /> {t('studentHub.myProgress.bookAMentor', 'Book a mentor')}
          </button>
        </article>

        {/* Top Coach Presents — ISC 2026 takes the slot while its
            applications are open, then the Launch Event, then CAAF,
            then the quiet empty card. */}
        {showIscPromo ? (
          <article className="myprog__card myprog__promo">
            <div className="myprog__promo-yr">2026</div>
            <div className="myprog__promo-eyebrow">
              {t('studentHub.myProgress.topCoachPresents', 'Top Coach presents')}
            </div>
            <h3 className="myprog__promo-title">
              {t('studentHub.myProgress.iscTitle', 'International Summer Camp')}
            </h3>
            <div className="myprog__promo-meta">Aug 3–9, 2026 · 250 students · Apply by Jul 6</div>
            <p className="myprog__promo-desc">
              A one-week academic camp for 250 students from across Central Asia —
              150 Bachelor&apos;s and 100 Master&apos;s places — for learning,
              networking, and a head start on studying abroad.
            </p>
            <div className="myprog__promo-foot">
              <div className="myprog__promo-foot-status">{iscCard.statusLabel}</div>
              <button
                type="button"
                className="myprog__btn myprog__btn--primary myprog__promo-cta"
                disabled={iscCard.mode === 'closed'}
                onClick={() =>
                  iscCard.mode !== 'closed' &&
                  navigate('/events/international-summer-camp-2026')
                }
              >
                {iscCard.ctaLabel}
              </button>
            </div>
          </article>
        ) : showLaunchPromo ? (
          <article className="myprog__card myprog__promo">
            <div className="myprog__promo-yr">2026</div>
            <div className="myprog__promo-eyebrow">
              {t('studentHub.myProgress.topCoachPresents', 'Top Coach presents')}
            </div>
            <h3 className="myprog__promo-title">
              {t('studentHub.myProgress.launchEventTitle', 'New Feature Launch')}
            </h3>
            <div className="myprog__promo-meta">Sun, May 24 · 11:00 AM · Tashkent</div>
            <p className="myprog__promo-desc">
              Free offline launch at the Youth Affairs Agency of
              Uzbekistan. Networking, real conversations, and the live
              launch — apply by May 22.
            </p>
            <div className="myprog__promo-foot">
              {launchRegistration?.status === 'confirmed' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--paid">
                      {t('studentHub.myProgress.statusRegistered', 'Registered')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/topcoach-launch-event')}
                  >
                    {t('studentHub.myProgress.viewDetails', 'View details')}
                  </button>
                </>
              ) : launchRegistration?.status === 'cancelled' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--cancelled">
                      {t('studentHub.myProgress.statusCancelled', 'Cancelled')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/topcoach-launch-event')}
                  >
                    {t('studentHub.myProgress.reregister', 'Re-register')}
                  </button>
                </>
              ) : (
                <>
                  <div className="myprog__promo-foot-status">
                    {launchMeLoading
                      ? t('studentHub.myProgress.statusLoading', 'Loading…')
                      : t('studentHub.myProgress.freeLimitedSeats', 'Free · limited seats')}
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__btn--primary myprog__promo-cta"
                    onClick={() => navigate('/events/topcoach-launch-event')}
                  >
                    {t('studentHub.myProgress.registerNow', 'Register now')}
                  </button>
                </>
              )}
            </div>
          </article>
        ) : !showCaafPromo ? (
          <article className="myprog__card myprog__promo myprog__promo--empty">
            <div className="myprog__promo-empty-eyebrow">
              {t('studentHub.myProgress.topCoachPresents', 'Top Coach presents')}
            </div>
            <div className="myprog__promo-empty-icon">📅</div>
            <div className="myprog__promo-empty-title">
              {t('studentHub.myProgress.noActiveEventTitle', 'No active event')}
            </div>
            <p className="myprog__promo-empty-desc">
              {t(
                'studentHub.myProgress.noActiveEventDesc',
                "We're between events right now. The next forum will appear here as soon as registration opens.",
              )}
            </p>
          </article>
        ) : (
          <article className="myprog__card myprog__promo">
            <div className="myprog__promo-yr">2026</div>
            <div className="myprog__promo-eyebrow">
              {t('studentHub.myProgress.topCoachPresents', 'Top Coach presents')}
            </div>
            <h3 className="myprog__promo-title">
              {t('studentHub.myProgress.caafTitle', 'Central Asian Admissions Forum')}
            </h3>
            <div className="myprog__promo-meta">Tashkent · Spring 2026</div>
            <p className="myprog__promo-desc">
              One-day forum with admissions officers from 14 universities. Live
              Q&amp;A, essay clinic, and a closing reception.
            </p>
            <div className="myprog__promo-foot">
              {caafApplication?.status === 'paid' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--paid">
                      {t('studentHub.myProgress.statusRegistered', 'Registered')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    {t('studentHub.myProgress.viewTicket', 'View ticket')}
                  </button>
                </>
              ) : caafApplication?.status === 'pending_payment' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--pending">
                      {t('studentHub.myProgress.statusPendingPayment', 'Pending payment')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__btn--primary myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    {t('studentHub.myProgress.payAmount', 'Pay {{fee}}', { fee: caafFeeLabel })}
                  </button>
                </>
              ) : caafApplication?.status === 'cancelled' ? (
                <>
                  <div className="myprog__promo-foot-status">
                    <span className="myprog__promo-tag myprog__promo-tag--cancelled">
                      {t('studentHub.myProgress.statusCancelled', 'Cancelled')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    {t('studentHub.myProgress.reapply', 'Re-apply')}
                  </button>
                </>
              ) : (
                <>
                  <div className="myprog__promo-foot-status">
                    {caafMeLoading
                      ? t('studentHub.myProgress.statusLoading', 'Loading…')
                      : t('studentHub.myProgress.reserveSpot', 'Reserve your spot · {{fee}}', {
                          fee: caafFeeLabel,
                        })}
                  </div>
                  <button
                    type="button"
                    className="myprog__btn myprog__btn--primary myprog__promo-cta"
                    onClick={() => navigate('/events/central-asian-admissions-forum')}
                  >
                    {t('studentHub.myProgress.register', 'Register')}
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
            <span className="myprog__airecs-eyebrow">
              {t('studentHub.myProgress.aiRecommendations', 'AI recommendations')}
            </span>
          </div>
          <h3 className="myprog__airecs-title">
            {t(
              'studentHub.myProgress.aiRecsHeadline',
              'Three things you can do today to move the needle.',
            )}
          </h3>
          {aiRecsLoading ? (
            // Source queries in flight — skeleton rows instead of fallback
            // recs computed from still-empty enrollment/application data.
            <ol className="myprog__airecs-list">
              {[1, 2, 3].map((i) => (
                <li key={i} className="myprog__airecs-row">
                  <Skeleton active title={false} paragraph={{ rows: 2 }} />
                </li>
              ))}
            </ol>
          ) : aiRecs.length === 0 ? (
            <p className="myprog__airecs-empty">
              {t(
                'studentHub.myProgress.aiRecsEmpty',
                'All caught up — nothing pressing today. Your dashboard will surface new tasks as deadlines approach and progress shifts.',
              )}
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
                        {rec.minutes} {t('studentHub.myProgress.minSuffix', 'min')}
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

      {/* Withdraw-from-meeting modal — opened from the 3-dot menu on
          each upcoming session card. Mirrors the reason picker /
          "Other" free-text used by the legacy UpcomingCard. */}
      <Modal
        title={t('studentHub.myProgress.withdrawFromMeeting', 'Withdraw from the meeting')}
        open={!!withdrawModalSessionId}
        onCancel={closeWithdrawModal}
        onOk={handleWithdrawSubmit}
        okText={t('studentHub.myProgress.withdrawOk', 'Withdraw')}
        okButtonProps={{
          danger: true,
          loading: cancelingAsStudent,
          style: { backgroundColor: '#7B1F2F', borderColor: '#7B1F2F' },
        }}
        cancelText={t('studentHub.myProgress.keepMeeting', 'Keep meeting')}
      >
        <p style={{ color: '#6b6258', marginBottom: 12 }}>
          {t(
            'studentHub.myProgress.withdrawBody',
            "Pick a reason so your mentor knows why you can't attend.",
          )}
        </p>
        <div className="myprog__withdraw-reasons">
          {/* NOTE: reason button labels stay in English — `reason` is the
              literal value compared against 'Other' below, not just display
              text (see WITHDRAW_REASONS comment above). */}
          {WITHDRAW_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className={`myprog__withdraw-reason ${
                withdrawReason === reason ? 'is-active' : ''
              }`}
              onClick={() => setWithdrawReason(reason)}
            >
              {reason}
            </button>
          ))}
        </div>
        <Form form={withdrawForm} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item
            name="customReason"
            label={
              withdrawReason === 'Other'
                ? t('studentHub.myProgress.tellUsMore', 'Tell us more')
                : t('studentHub.myProgress.addNoteOptional', 'Add a note (optional)')
            }
            rules={
              withdrawReason === 'Other'
                ? [
                    {
                      validator: (_, value) =>
                        value?.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                t(
                                  'studentHub.myProgress.describeReason',
                                  'Please describe the reason.',
                                ),
                              ),
                            ),
                    },
                  ]
                : []
            }
          >
            <Input.TextArea rows={3} disabled={withdrawReason !== 'Other'} />
          </Form.Item>
        </Form>
      </Modal>

      <MajorMatchCollectModal open={mmCollectOpen} onClose={() => setMmCollectOpen(false)} />
    </div>
  );
};

export default MyProgressEditorialView;
