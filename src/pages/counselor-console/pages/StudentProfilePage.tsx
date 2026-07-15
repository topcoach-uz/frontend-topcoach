import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Skeleton,
  Spin,
  Tabs,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  GraduationCap,
  CalendarClock,
  Compass,
  Layers,
  AlertTriangle,
  Gauge,
  Mail,
  MessageCircle,
  Plus,
  Target,
  LifeBuoy,
  FlaskConical,
  CheckCircle2,
  ChevronRight,
  Clock,
  Users,
} from 'lucide-react';
import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcStat, type CcStatTone } from '../components/CcStat';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcAvatar } from '../components/CcAvatar';
import { CC_PROGRAM_COLOR, CC_OTHER } from '../charts/ccEcharts';
import { useAppDispatch } from 'src/app/store';
import { useGetUserByIdQuery } from 'src/app/services/users';
import { useFindOrCreateCounselorConversationMutation } from 'src/app/services/chat/chatApi';
import ChatModal from 'src/components/chat/ChatModal';
import {
  studentJourneyReadonlyApi,
  useGetStudentJourneyDashboardQuery,
  useGetStudentJourneyProfileQuery,
  useGetStudentJourneyMentorBookingsQuery,
  useGetStudentJourneyTasksQuery,
} from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import { useAssignStudentTaskMutation } from 'src/app/services/orgStudentActionsApi';
import {
  useGetStudentProgramsQuery,
  useGetStudentFullSupportDetailQuery,
  useGetStudentSatDetailQuery,
  useGetStudentResearchDetailQuery,
  type StudentProgramsResponse,
  type StudentAdmissionsProgram,
  type StudentSatProgram,
  type StudentResearchProgram,
  type StudentFullSupportProgram,
} from 'src/app/services/counselorConsoleApi';
import './StudentProfilePage.scss';

// Heavy tab content is reused verbatim from the read-only "My Journey"
// drill-down (already org-auth'd on the backend) and code-split so each tab's
// bundle only loads when the counselor opens it.
const SessionsTab = lazy(
  () => import('src/pages/counselor-console/_journey/StudentDataBookingsCard'),
);

// Per-program deep-dives. Each is mounted only when the student actually has
// that program, so a counselor never opens a tab into an empty shell.
const FullSupportTab = lazy(
  () => import('src/pages/counselor-console/_programs/FullSupportTab'),
);
const SatPrepTab = lazy(
  () => import('src/pages/counselor-console/_programs/SatPrepTab'),
);
const ResearchPrepTab = lazy(
  () => import('src/pages/counselor-console/_programs/ResearchPrepTab'),
);
const AdmissionsTab = lazy(
  () => import('src/pages/counselor-console/_programs/AdmissionsTab'),
);
const MajorMatchTab = lazy(
  () => import('src/pages/counselor-console/_programs/MajorMatchTab'),
);

// ── status → pill variant maps ──────────────────────────────────────────────
const PROGRAM_PILL: Record<string, CcPillVariant> = {
  approved: 'success',
  accepted: 'success',
  admitted: 'success',
  submitted: 'info',
  in_review: 'info',
  pending: 'warning',
  waitlisted: 'warning',
  rejected: 'danger',
  declined: 'danger',
  draft: 'neutral',
  not_started: 'neutral',
};

const PROFILE_STATUS_PILL: Record<string, CcPillVariant> = {
  complete: 'success',
  reviewed: 'accent',
  in_progress: 'info',
  incomplete: 'warning',
};

function prettify(status?: string): string {
  if (!status) return 'Unknown';
  return status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TabFallback() {
  return (
    <div className="cc-profile-tab-loading">
      <Spin />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="cc-profile-empty">{children}</div>;
}

function InlineError({ title, text }: { title: string; text: string }) {
  return (
    <div className="cc-profile-error cc-profile-error--inline">
      <AlertTriangle size={20} />
      <div className="cc-profile-error-title">{title}</div>
      <div className="cc-profile-error-text">{text}</div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}
function Section({ title, children, action }: SectionProps) {
  return (
    <section className="cc-profile-card">
      <div className="cc-profile-card-head">
        <h2 className="cc-profile-card-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CounselorConsoleStudentProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { orgId, org } = useCounselorConsole();
  const [activeTab, setActiveTab] = useState('overview');

  const hasUser = !!userId;

  const { data: userData, isLoading: userLoading } = useGetUserByIdQuery(
    userId ?? '',
    { skip: !hasUser },
  );

  const {
    data: dashboardRes,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useGetStudentJourneyDashboardQuery(userId ?? '', { skip: !hasUser });

  const { data: profileRes } = useGetStudentJourneyProfileQuery(userId ?? '', {
    skip: !hasUser,
  });

  const { data: programsData, isLoading: programsLoading } =
    useGetStudentProgramsQuery(
      { orgId: orgId ?? '', userId: userId ?? '' },
      { skip: !hasUser || !orgId },
    );

  const dashboard = dashboardRes?.data;
  const profile: any = dashboard?.profile ?? profileRes?.data;

  const studentName =
    userData?.profile?.name || profile?.profile?.name || 'Student';
  const studentEmail = (userData as any)?.email as string | undefined;
  const graduationYear = profile?.academicProfile?.graduationYear as
    | number
    | undefined;
  const curriculum = profile?.academicProfile?.curriculum as
    | string
    | undefined;
  const profileStatus = profile?.profileStatus as string | undefined;

  const completion = profile?.completionPercentage ?? 0;

  // Header progress reflects the furthest-along real program the student is
  // enrolled in (from the programs endpoint); falls back to profile completion
  // when they're not in any progress-bearing program.
  const bestProgram = bestProgramProgress(programsData);
  const overallProgress = bestProgram?.progress ?? completion;

  // ── Invalid / missing route param ──
  if (!hasUser) {
    return (
      <div className="cc-profile">
        <BackLink />
        <div className="cc-profile-error">
          <AlertTriangle size={22} />
          <div className="cc-profile-error-title">No student selected</div>
          <div className="cc-profile-error-text">
            This URL is missing a student id. Return to the student list and
            pick a student to view their profile.
          </div>
        </div>
      </div>
    );
  }

  // Program tabs appear only for programs the student is actually in, so the
  // tab bar reflects this student rather than the catalogue. `programsData`
  // returns null per program when not enrolled.
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="cc-profile-tab-label">
          <Layers size={15} /> Overview
        </span>
      ),
      children: (
        <OverviewTab
          orgId={orgId}
          userId={userId!}
          profile={profile}
          programs={programsData}
          programsLoading={programsLoading}
          dashboardLoading={dashboardLoading}
          dashboardError={dashboardError}
          onOpenTab={setActiveTab}
        />
      ),
    },

    ...(programsData?.fullSupport
      ? [
          {
            key: 'full-support',
            label: (
              <span className="cc-profile-tab-label">
                <LifeBuoy size={15} /> Full Support
              </span>
            ),
            children: (
              <div className="cc-profile-program-tab">
                {/* Tasks live in Full Support, so the assign action lives here
                    too — the tab itself renders the (read-only) task list. */}
                <AssignTaskBar
                  userId={userId!}
                  studentName={studentName}
                  orgId={orgId}
                />
                <Suspense fallback={<TabFallback />}>
                  <FullSupportTab orgId={orgId!} userId={userId!} />
                </Suspense>
              </div>
            ),
          },
        ]
      : []),

    ...(programsData?.admissions
      ? [
          {
            key: 'admissions',
            label: (
              <span className="cc-profile-tab-label">
                <GraduationCap size={15} /> Admissions
              </span>
            ),
            children: (
              <Suspense fallback={<TabFallback />}>
                <AdmissionsTab orgId={orgId!} userId={userId!} />
              </Suspense>
            ),
          },
        ]
      : []),

    ...(programsData?.sat
      ? [
          {
            key: 'sat',
            label: (
              <span className="cc-profile-tab-label">
                <Target size={15} /> SAT Prep
              </span>
            ),
            children: (
              <Suspense fallback={<TabFallback />}>
                <SatPrepTab orgId={orgId!} userId={userId!} />
              </Suspense>
            ),
          },
        ]
      : []),

    ...(programsData?.research
      ? [
          {
            key: 'research',
            label: (
              <span className="cc-profile-tab-label">
                <FlaskConical size={15} /> Research Prep
              </span>
            ),
            children: (
              <Suspense fallback={<TabFallback />}>
                <ResearchPrepTab orgId={orgId!} userId={userId!} />
              </Suspense>
            ),
          },
        ]
      : []),

    ...(programsData?.majorMatch
      ? [
          {
            key: 'major-match',
            label: (
              <span className="cc-profile-tab-label">
                <Compass size={15} /> Major Match
              </span>
            ),
            children: (
              <div className="cc-profile-program-tab">
                <MajorMatchTab userId={userId!} />
              </div>
            ),
          },
        ]
      : []),

    {
      key: 'sessions',
      label: (
        <span className="cc-profile-tab-label">
          <CalendarClock size={15} /> Sessions
        </span>
      ),
      children: (
        <div className="cc-profile-card cc-profile-sessions">
          <Suspense fallback={<TabFallback />}>
            <SessionsTab studentUserId={userId!} />
          </Suspense>
        </div>
      ),
    },
  ];

  return (
    <div className="cc-profile" key={orgId ?? 'no-org'}>
      <BackLink />

      <div className="cc-page-head--ruled">
        <div className="cc-page-eyebrow">
          <span className="cc-page-eyebrow-accent">Student</span>
          {org ? <span>· {org.name}</span> : null}
        </div>
        <div className="cc-profile-headrow">
          <h1 className="cc-page-title">
            {userLoading && studentName === 'Student' ? 'Loading…' : studentName}
          </h1>
          <MessageButton userId={userId!} studentName={studentName} />
        </div>

        <div className="cc-profile-headmeta">
          {studentEmail ? (
            <span className="cc-profile-headmeta-item">
              <Mail size={13} /> {studentEmail}
            </span>
          ) : null}
          {graduationYear ? (
            <span className="cc-profile-headmeta-item">
              <GraduationCap size={13} /> Class of {graduationYear}
              {curriculum ? ` · ${curriculum}` : ''}
            </span>
          ) : null}
          {profileStatus ? (
            <CcPill variant={PROFILE_STATUS_PILL[profileStatus] ?? 'neutral'}>
              {prettify(profileStatus)}
            </CcPill>
          ) : null}
        </div>

        <p className="cc-page-lead">
          Read-only academic profile — programs, tasks and sessions.
        </p>
      </div>

      <div className="cc-stat-grid">
        <CcStat
          icon={<Gauge size={15} />}
          label={bestProgram ? 'Program progress' : 'Profile completion'}
          value={
            programsLoading && !programsData
              ? '—'
              : `${Math.round(overallProgress)}%`
          }
          meta={
            bestProgram
              ? `${bestProgram.name} · furthest along`
              : prettify(profileStatus)
          }
          tone={completionTone(overallProgress)}
        />
        <UpcomingSessionsStat userId={userId!} />
      </div>

      <div className="cc-profile-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="line"
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/counselor-console/students" className="cc-profile-back">
      <ArrowLeft size={15} /> Back to students
    </Link>
  );
}

function completionTone(pct: number): CcStatTone {
  if (pct >= 80) return 'good';
  if (pct >= 40) return 'info';
  return 'warn';
}

// Furthest-along program the student is enrolled in (name + its progress).
// Returns null when the student is not enrolled in any progress-bearing program.
function bestProgramProgress(
  p?: StudentProgramsResponse,
): { progress: number; name: string } | null {
  if (!p) return null;
  const entries: { progress: number; name: string }[] = [];
  if (p.admissions) entries.push({ progress: p.admissions.progress, name: 'Admissions' });
  if (p.sat) entries.push({ progress: p.sat.lessonsProgress, name: 'SAT' });
  if (p.research) entries.push({ progress: p.research.progress, name: 'Research Prep' });
  if (p.fullSupport)
    entries.push({ progress: p.fullSupport.milestones.progress, name: 'Full Support' });
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b.progress > a.progress ? b : a));
}

// Small self-contained stat that derives the upcoming-session count from the
// mentor-bookings journey endpoint (the dashboard summary doesn't include it).
function UpcomingSessionsStat({ userId }: { userId: string }) {
  const { data, isLoading } = useGetStudentJourneyMentorBookingsQuery(userId, {
    skip: !userId,
  });
  const upcoming = useMemo(() => {
    const sessions = data?.data ?? [];
    const now = Date.now();
    return sessions.filter(
      (s: any) => new Date(s.date).getTime() > now && !s.cancelStatus,
    ).length;
  }, [data]);

  return (
    <CcStat
      icon={<CalendarClock size={15} />}
      label="Upcoming sessions"
      value={isLoading && !data ? '—' : upcoming}
      tone={upcoming > 0 ? 'good' : 'neutral'}
    />
  );
}

// ── Overview tab ────────────────────────────────────────────────────────────
// Answers "what's going on with this student, and what do I do about it?" in
// the top third: an attention banner, a chronological activity feed built from
// sources that actually exist, and a snapshot strip of enrolled programs.

const INACTIVE_DAYS_THRESHOLD = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Program → tab key. Programs with no drill-down tab map to null. */
const PROGRAM_TAB: Record<string, string | null> = {
  'Full Support': 'full-support',
  Admissions: 'admissions',
  SAT: 'sat',
  'Research Prep': 'research',
  'Major Match': 'major-match',
  Community: null,
};

function programIcon(program: string, size = 15) {
  switch (program) {
    case 'Full Support':
      return <LifeBuoy size={size} />;
    case 'Admissions':
      return <GraduationCap size={size} />;
    case 'SAT':
      return <Target size={size} />;
    case 'Research Prep':
      return <FlaskConical size={size} />;
    case 'Major Match':
      return <Compass size={size} />;
    default:
      return <Users size={size} />;
  }
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Coarse relative label; falls back to an absolute date past ~4 weeks. */
function relativeDate(d: Date, now = Date.now()): string {
  const diff = now - d.getTime();
  const days = Math.round(diff / DAY_MS);
  if (diff < 0) {
    const ahead = Math.abs(days);
    if (ahead === 0) return 'Today';
    if (ahead === 1) return 'Tomorrow';
    return `In ${ahead} days`;
  }
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? 's' : ''} ago`;
  }
  return formatDate(d.toISOString());
}

interface FeedItem {
  id: string;
  date: Date;
  program: string;
  title: string;
  meta?: string;
}

interface AttentionSignal {
  reason: string;
  detail: string;
}

interface OverviewTabProps {
  orgId: string | null;
  userId: string;
  profile: any;
  programs?: StudentProgramsResponse;
  programsLoading: boolean;
  dashboardLoading: boolean;
  dashboardError: boolean;
  onOpenTab: (key: string) => void;
}

function OverviewTab({
  orgId,
  userId,
  profile,
  programs,
  programsLoading,
  dashboardLoading,
  dashboardError,
  onOpenTab,
}: OverviewTabProps) {
  const canScope = !!orgId && !!userId;

  // Per-program detail is fetched ONLY for programs the student is enrolled in,
  // and shares its cache entry with the matching program tab — so opening that
  // tab afterwards is instant rather than a second round-trip.
  const {
    data: fullSupport,
    isLoading: fsLoading,
    isError: fsError,
  } = useGetStudentFullSupportDetailQuery(
    { orgId: orgId ?? '', userId },
    { skip: !canScope || !programs?.fullSupport },
  );

  const {
    data: satDetail,
    isLoading: satLoading,
    isError: satError,
  } = useGetStudentSatDetailQuery(
    { orgId: orgId ?? '', userId },
    { skip: !canScope || !programs?.sat },
  );

  const {
    data: research,
    isLoading: researchLoading,
    isError: researchError,
  } = useGetStudentResearchDetailQuery(
    { orgId: orgId ?? '', userId },
    { skip: !canScope || !programs?.research },
  );

  const {
    data: bookingsRes,
    isLoading: bookingsLoading,
    isError: bookingsError,
  } = useGetStudentJourneyMentorBookingsQuery(userId, { skip: !userId });

  const {
    data: tasksRes,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useGetStudentJourneyTasksQuery(userId, { skip: !userId });

  // ── Feed ──────────────────────────────────────────────────────────────────
  // Only sources that carry a real timestamp make it in. Mentor tasks are
  // deliberately absent: the task payload has a deadline but no submitted/
  // reviewed timestamp, so they cannot be placed on a timeline honestly.
  const feed = useMemo<FeedItem[]>(() => {
    const now = Date.now();
    const out: FeedItem[] = [];

    for (const s of fullSupport?.sessions ?? []) {
      const date = new Date(s.dateTime);
      if (Number.isNaN(date.getTime()) || date.getTime() > now) continue;
      out.push({
        id: `fs-${s.id}`,
        date,
        program: 'Full Support',
        title: s.description?.trim() || 'Full Support session',
        meta: s.done ? 'Session completed' : 'Session logged',
      });
    }

    for (const b of (bookingsRes?.data ?? []) as any[]) {
      const date = new Date(b?.date);
      if (Number.isNaN(date.getTime()) || date.getTime() > now) continue;
      if (b?.cancelStatus) continue;
      const mentorName = b?.mentor?.profile?.name as string | undefined;
      out.push({
        id: `booking-${b?.id}`,
        date,
        program: 'Mentor session',
        title: mentorName ? `Mentor session with ${mentorName}` : 'Mentor session',
        meta: 'Attended',
      });
    }

    for (const sub of research?.submissions ?? []) {
      const date = new Date(sub.submittedAt);
      if (Number.isNaN(date.getTime())) continue;
      out.push({
        id: `research-${sub.id}`,
        date,
        program: 'Research Prep',
        title: `Submitted Week ${sub.weekNumber} — ${sub.weekTitle}`,
        meta: prettify(sub.status),
      });
    }

    for (const s of satDetail?.recentSessions ?? []) {
      const date = new Date(s.completedAt);
      if (Number.isNaN(date.getTime())) continue;
      // estimatedScore is a 200–800 PER-SECTION score — never a composite.
      const score =
        s.estimatedScore != null ? ` · Est. ${s.estimatedScore} section score` : '';
      out.push({
        id: `sat-${s.id}`,
        date,
        program: 'SAT',
        title: s.title || `SAT ${prettify(s.mode)}`,
        meta: `${s.correctQ}/${s.totalQ} correct${score}`,
      });
    }

    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [fullSupport, bookingsRes, research, satDetail]);

  // ── Program snapshot rows ─────────────────────────────────────────────────
  const programRows = useMemo(() => {
    if (!programs) return [];
    const rows: {
      name: string;
      progress: number | null;
      meta: string;
    }[] = [];

    if (programs.fullSupport) {
      const fs = programs.fullSupport;
      const pending = fs.tasks.pending;
      rows.push({
        name: 'Full Support',
        progress: fs.milestones.progress,
        meta: `${fs.milestones.done}/${fs.milestones.total} milestones${
          pending > 0 ? ` · ${pending} task${pending > 1 ? 's' : ''} open` : ''
        }`,
      });
    }
    if (programs.admissions) {
      const a = programs.admissions;
      rows.push({
        name: 'Admissions',
        progress: a.progress,
        meta: `${a.lessons.completed}/${a.lessons.total} lessons`,
      });
    }
    if (programs.sat) {
      const s = programs.sat;
      rows.push({
        name: 'SAT',
        progress: s.lessonsProgress,
        // bestScore is a 200–800 per-section score, never "/1600".
        meta: s.bestScore
          ? `Best section score ${s.bestScore}`
          : `${s.questionsAttempted} questions attempted`,
      });
    }
    if (programs.research) {
      const r = programs.research;
      rows.push({
        name: 'Research Prep',
        progress: r.progress,
        // Progress counts weeks with a submission — videos/quizzes don't move it.
        meta: `${r.weeksCompleted}/${r.totalWeeks} weeks submitted`,
      });
    }
    if (programs.majorMatch) {
      const m = programs.majorMatch;
      rows.push({
        name: 'Major Match',
        progress: null,
        meta: `${m.assessments} assessment${m.assessments === 1 ? '' : 's'}${
          m.latestRiasecCode ? ` · ${m.latestRiasecCode}` : ''
        }`,
      });
    }
    if (programs.community?.active) {
      rows.push({ name: 'Community', progress: null, meta: 'Active member' });
    }
    return rows;
  }, [programs]);

  // ── Attention signals ─────────────────────────────────────────────────────
  // Mirrors the org dashboard's needs-attention rules, derived for this one
  // student from the data already on the page.
  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return (tasksRes?.data ?? []).filter((t) => {
      // A submission is text OR files — the student app always writes text, but
      // counting files too keeps us from telling a counselor "nothing submitted"
      // when the student uploaded their work.
      const submitted = !!t.submissionText?.trim() || !!t.submissionFileUrls?.length;
      if (submitted) return false;
      if (!t.deadline) return false;
      const d = new Date(t.deadline).getTime();
      return !Number.isNaN(d) && d < now;
    }).length;
  }, [tasksRes]);

  const bestProgram = bestProgramProgress(programs);
  const progress = bestProgram?.progress ?? null;

  // Last activity = the profile timestamp OR the newest real event in the feed,
  // whichever is later. `lastWatchedAt` is deliberately not used: it is
  // fabricated as `now` for students with no course progress rows.
  const lastActive = useMemo(() => {
    const candidates: number[] = [];
    const p = profile?.lastActiveAt ? new Date(profile.lastActiveAt).getTime() : NaN;
    if (!Number.isNaN(p)) candidates.push(p);
    if (feed[0]) candidates.push(feed[0].date.getTime());
    if (candidates.length === 0) return null;
    return new Date(Math.max(...candidates));
  }, [profile, feed]);

  const signalsLoading =
    (programsLoading && !programs) ||
    (tasksLoading && !tasksRes) ||
    (fsLoading && !fullSupport) ||
    (satLoading && !satDetail) ||
    (researchLoading && !research) ||
    (bookingsLoading && !bookingsRes);

  const signals = useMemo<AttentionSignal[]>(() => {
    const out: AttentionSignal[] = [];
    const inactiveDays = lastActive
      ? Math.floor((Date.now() - lastActive.getTime()) / DAY_MS)
      : null;
    const enrolled = programRows.length > 0;

    if (!lastActive && (progress === null || progress === 0)) {
      out.push({
        reason: 'Never signed in',
        detail: 'No recorded activity and no coursework progress.',
      });
    } else if (enrolled && progress === 0) {
      out.push({
        reason: 'Hasn’t started any coursework',
        detail: 'Enrolled, but no program shows any progress yet.',
      });
    } else if (inactiveDays !== null && inactiveDays >= INACTIVE_DAYS_THRESHOLD) {
      out.push({
        reason: `No activity in ${inactiveDays} days`,
        detail: `Last seen ${formatDate(lastActive!.toISOString())}.`,
      });
    }

    if (overdueTasks > 0) {
      out.push({
        reason: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`,
        detail: 'Past the deadline with nothing submitted.',
      });
    }
    return out;
  }, [lastActive, progress, programRows, overdueTasks]);

  // ── Support: assigned mentor + next session ───────────────────────────────
  const nextSession = useMemo<FeedItem | null>(() => {
    const now = Date.now();
    const upcoming: FeedItem[] = [];

    for (const s of fullSupport?.sessions ?? []) {
      const date = new Date(s.dateTime);
      if (Number.isNaN(date.getTime()) || date.getTime() <= now || s.done) continue;
      upcoming.push({
        id: `next-fs-${s.id}`,
        date,
        program: 'Full Support',
        title: s.description?.trim() || 'Full Support session',
      });
    }
    for (const b of (bookingsRes?.data ?? []) as any[]) {
      const date = new Date(b?.date);
      if (Number.isNaN(date.getTime()) || date.getTime() <= now) continue;
      if (b?.cancelStatus) continue;
      const mentorName = b?.mentor?.profile?.name as string | undefined;
      upcoming.push({
        id: `next-booking-${b?.id}`,
        date,
        program: 'Mentor session',
        title: mentorName ? `With ${mentorName}` : 'Mentor session',
      });
    }
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcoming[0] ?? null;
  }, [fullSupport, bookingsRes]);

  const mentor = fullSupport?.mentor ?? null;

  // ── States ────────────────────────────────────────────────────────────────
  if (dashboardLoading && !profile && programsLoading && !programs) {
    return (
      <div className="cc-profile-overview">
        <div className="cc-profile-overview-main">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (dashboardError && !profile && !programs) {
    return (
      <InlineError
        title="Couldn’t load the summary"
        text="The student overview failed to load. Try switching tabs or refreshing."
      />
    );
  }

  const feedError = fsError || satError || researchError || bookingsError;
  const feedLoading =
    (fsLoading && !fullSupport) ||
    (satLoading && !satDetail) ||
    (researchLoading && !research) ||
    (bookingsLoading && !bookingsRes);

  return (
    <div className="cc-profile-overview">
      {/* 1. Needs-attention banner */}
      {signalsLoading ? (
        <div className="cc-attention cc-attention--loading">
          <Skeleton active title={false} paragraph={{ rows: 2 }} />
        </div>
      ) : tasksError && signals.length === 0 ? (
        <div className="cc-attention cc-attention--unknown">
          <span className="cc-attention-ico">
            <AlertTriangle size={18} />
          </span>
          <div className="cc-attention-body">
            <div className="cc-attention-eyebrow">Attention</div>
            <h2 className="cc-attention-headline">Couldn’t check for flags</h2>
            <p className="cc-attention-detail">
              Some of this student’s data failed to load, so this banner may be
              incomplete.
            </p>
          </div>
        </div>
      ) : signals.length > 0 ? (
        <div className="cc-attention cc-attention--warn">
          <span className="cc-attention-ico">
            <AlertTriangle size={18} />
          </span>
          <div className="cc-attention-body">
            <div className="cc-attention-eyebrow">Needs attention</div>
            <h2 className="cc-attention-headline">{signals[0].reason}</h2>
            <p className="cc-attention-detail">{signals[0].detail}</p>
            {signals.length > 1 && (
              <div className="cc-attention-extra">
                {signals.slice(1).map((s) => (
                  <CcPill key={s.reason} variant="warning">
                    {s.reason}
                  </CcPill>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="cc-attention cc-attention--clear">
          <span className="cc-attention-ico">
            <CheckCircle2 size={18} />
          </span>
          <div className="cc-attention-body">
            <div className="cc-attention-eyebrow">All clear</div>
            <h2 className="cc-attention-headline">Nothing needs your attention</h2>
            <p className="cc-attention-detail">
              No overdue tasks, and activity is recent
              {lastActive ? ` — last seen ${relativeDate(lastActive).toLowerCase()}` : ''}
              .
            </p>
          </div>
        </div>
      )}

      {/* 3. Program snapshot strip */}
      <Section title="Programs">
        {programsLoading && !programs ? (
          <Skeleton active title={false} paragraph={{ rows: 3 }} />
        ) : programRows.length === 0 ? (
          <EmptyState>
            This student isn’t enrolled in any program yet.
          </EmptyState>
        ) : (
          <ul className="cc-snapshot">
            {programRows.map((row) => {
              const tab = PROGRAM_TAB[row.name] ?? null;
              const color = CC_PROGRAM_COLOR[row.name] ?? CC_OTHER;
              return (
                <li key={row.name}>
                  <button
                    type="button"
                    className="cc-snapshot-row"
                    disabled={!tab}
                    onClick={tab ? () => onOpenTab(tab) : undefined}
                  >
                    <span
                      className="cc-snapshot-ico"
                      style={{ color, background: `${color}1f` }}
                    >
                      {programIcon(row.name)}
                    </span>
                    <span className="cc-snapshot-text">
                      {/* Colour is never the only signal — the program is always
                          named, for CVD readers and everyone else. */}
                      <span className="cc-snapshot-name">{row.name}</span>
                      <span className="cc-snapshot-meta">{row.meta}</span>
                    </span>
                    {row.progress != null ? (
                      <span className="cc-snapshot-progress">
                        <span className="cc-snapshot-pct">
                          {Math.round(row.progress)}%
                        </span>
                        <span className="cc-snapshot-track">
                          <span
                            className="cc-snapshot-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, row.progress))}%`,
                              background: color,
                            }}
                          />
                        </span>
                      </span>
                    ) : (
                      <span className="cc-snapshot-progress" />
                    )}
                    {tab ? (
                      <ChevronRight size={15} className="cc-snapshot-chev" />
                    ) : (
                      <span className="cc-snapshot-chev" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="cc-profile-overview-cols">
        {/* 2. Activity feed */}
        <Section title="Recent activity">
          {feedLoading ? (
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
          ) : feedError && feed.length === 0 ? (
            <InlineError
              title="Couldn’t load activity"
              text="This student’s sessions and submissions failed to load."
            />
          ) : feed.length === 0 ? (
            <EmptyState>
              No sessions or submissions recorded yet — there’s nothing this
              student has done for us to show.
            </EmptyState>
          ) : (
            <>
              <ol className="cc-feed">
                {feed.slice(0, 8).map((item) => {
                  const color = CC_PROGRAM_COLOR[item.program] ?? CC_OTHER;
                  return (
                    <li className="cc-feed-row" key={item.id}>
                      <span
                        className="cc-feed-ico"
                        style={{ color, background: `${color}1f` }}
                      >
                        {programIcon(item.program, 14)}
                      </span>
                      <span className="cc-feed-body">
                        <span className="cc-feed-title">{item.title}</span>
                        <span className="cc-feed-meta">
                          {item.program}
                          {item.meta ? ` · ${item.meta}` : ''}
                        </span>
                      </span>
                      <time
                        className="cc-feed-date"
                        dateTime={item.date.toISOString()}
                        title={formatDateTime(item.date)}
                      >
                        {relativeDate(item.date)}
                      </time>
                    </li>
                  );
                })}
              </ol>
              {feed.length > 8 && (
                <p className="cc-feed-more">
                  Showing the 8 most recent of {feed.length} events.
                </p>
              )}
            </>
          )}
        </Section>

        {/* Support: assigned mentor + next session */}
        <Section title="Support">
          {feedLoading ? (
            <Skeleton active title={false} paragraph={{ rows: 3 }} />
          ) : (
            <div className="cc-support">
              <div className="cc-support-block">
                <div className="cc-support-eyebrow">Assigned mentor</div>
                {mentor ? (
                  <div className="cc-support-mentor">
                    <CcAvatar name={mentor.name} src={mentor.avatarUrl} size={32} />
                    <span className="cc-support-mentor-name">{mentor.name}</span>
                  </div>
                ) : (
                  <div className="cc-support-none">
                    {programs?.fullSupport
                      ? 'No mentor assigned'
                      : 'Not in Full Support'}
                  </div>
                )}
              </div>

              <div className="cc-support-block">
                <div className="cc-support-eyebrow">Next session</div>
                {nextSession ? (
                  <div className="cc-support-next">
                    <span className="cc-support-next-date">
                      {formatDateTime(nextSession.date)}
                    </span>
                    <span className="cc-support-next-meta">
                      <Clock size={12} /> {relativeDate(nextSession.date)} ·{' '}
                      {nextSession.program}
                    </span>
                    <span className="cc-support-next-title">
                      {nextSession.title}
                    </span>
                  </div>
                ) : (
                  <div className="cc-support-none">Nothing scheduled</div>
                )}
              </div>

              {profile?.profileStatus ? (
                <div className="cc-support-block">
                  <div className="cc-support-eyebrow">Profile</div>
                  <div className="cc-support-profile">
                    <CcPill
                      variant={PROFILE_STATUS_PILL[profile.profileStatus] ?? 'neutral'}
                    >
                      {prettify(profile.profileStatus)}
                    </CcPill>
                    <span className="cc-support-profile-pct">
                      {profile?.completionPercentage ?? 0}% complete
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}


// ── Message button: opens a DM with the student ──────────────────────────────
// Reuses the app's existing counselor↔student chat: `find-or-create-counselor`
// resolves (or lazily creates) the conversation server-side from the JWT +
// studentId, then the shared ChatModal is opened to the general conversation.
function MessageButton({
  userId,
  studentName,
}: {
  userId: string;
  studentName: string;
}) {
  const [findOrCreate, { isLoading }] =
    useFindOrCreateCounselorConversationMutation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    // Reuse the resolved conversation on subsequent opens.
    if (conversationId) {
      setOpen(true);
      return;
    }
    try {
      const res = await findOrCreate({ studentId: userId }).unwrap();
      const id = res?.conversation?.id ?? null;
      if (!id) {
        message.error('Could not open the conversation.');
        return;
      }
      setConversationId(id);
      setOpen(true);
    } catch {
      message.error('Could not start a conversation with this student.');
    }
  };

  const label = studentName && studentName !== 'Student'
    ? `Message ${studentName.split(' ')[0]}`
    : 'Message';

  return (
    <>
      <Button
        type="primary"
        className="cc-profile-action-btn"
        loading={isLoading}
        onClick={handleClick}
        icon={<MessageCircle size={15} />}
      >
        {label}
      </Button>
      {conversationId && (
        <ChatModal
          conversationId={conversationId}
          open={open}
          onClose={() => setOpen(false)}
          openToGeneralConversation
          onConversationChange={(id) => setConversationId(id)}
        />
      )}
    </>
  );
}

// ── Tasks tab: read-only journey tasks + counselor "Assign task" action ──────
/**
 * The "Assign task" action, mounted at the top of the Full Support tab.
 *
 * Tasks are Full Support tasks (`full_support_tasks`), and FullSupportTab
 * already renders the read-only list — so this contributes only the action, not
 * a second copy of the list.
 */
function AssignTaskBar({
  userId,
  studentName,
  orgId,
}: {
  userId: string;
  studentName: string;
  orgId: string | null;
}) {
  const dispatch = useAppDispatch();
  const [assignTask, { isLoading }] = useAssignStudentTaskMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const firstName =
    studentName && studentName !== 'Student'
      ? studentName.split(' ')[0]
      : 'this student';

  const handleSubmit = async () => {
    if (!orgId) return;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation errors are surfaced inline by the form
    }
    try {
      await assignTask({
        orgId,
        userId,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      }).unwrap();
      message.success('Task assigned');
      setOpen(false);
      form.resetFields();
      // The read-only journey tasks query carries no cache tag, so force it to
      // refetch directly rather than relying on tag invalidation.
      dispatch(
        studentJourneyReadonlyApi.endpoints.getStudentJourneyTasks.initiate(
          userId,
          { subscribe: false, forceRefetch: true },
        ),
      );
    } catch {
      message.error('Could not assign the task. Please try again.');
    }
  };

  return (
    <div className="cc-tasks-tab">
      <div className="cc-tasks-toolbar">
        <div className="cc-tasks-toolbar-text">
          <span className="cc-tasks-toolbar-title">Mentor tasks</span>
          <span className="cc-tasks-toolbar-sub">
            Assign a follow-up for {firstName} — it appears in their task list
            below.
          </span>
        </div>
        <Button
          type="primary"
          className="cc-profile-action-btn"
          icon={<Plus size={14} />}
          disabled={!orgId}
          onClick={() => setOpen(true)}
        >
          Assign task
        </Button>
      </div>

      <Modal
        title="Assign a task"
        open={open}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
        okText="Assign task"
        confirmLoading={isLoading}
        okButtonProps={{ className: 'cc-profile-action-btn' }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Give the task a title' },
              { max: 160, message: 'Keep the title under 160 characters' },
            ]}
          >
            <Input placeholder="e.g. Finalize Common App personal statement" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              maxLength={1000}
              placeholder="Optional details or context for the student…"
            />
          </Form.Item>
          <Form.Item name="dueDate" label="Due date">
            <DatePicker
              style={{ width: '100%' }}
              format="MMM D, YYYY"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
