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
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  GraduationCap,
  ListChecks,
  CalendarClock,
  Layers,
  Tent,
  AlertTriangle,
  Gauge,
  Mail,
  MessageCircle,
  StickyNote,
  Plus,
  Trash2,
  Target,
  LifeBuoy,
  FlaskConical,
  Users,
} from 'lucide-react';
import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcStat, type CcStatTone } from '../components/CcStat';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { useTypedSelector, useAppDispatch } from 'src/app/store';
import { useGetUserByIdQuery } from 'src/app/services/users';
import { useFindOrCreateCounselorConversationMutation } from 'src/app/services/chat/chatApi';
import ChatModal from 'src/components/chat/ChatModal';
import {
  studentJourneyReadonlyApi,
  useGetStudentJourneyDashboardQuery,
  useGetStudentJourneyProfileQuery,
  useGetStudentJourneyCollegeApplicationsQuery,
  useGetStudentJourneyEssaysQuery,
  useGetStudentJourneyDocumentsQuery,
  useGetStudentJourneyMentorBookingsQuery,
} from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import {
  useGetStudentNotesQuery,
  useAddStudentNoteMutation,
  useDeleteStudentNoteMutation,
  useAssignStudentTaskMutation,
} from 'src/app/services/orgStudentActionsApi';
import {
  useGetStudentProgramsQuery,
  type StudentProgramsResponse,
  type StudentAdmissionsProgram,
  type StudentSatProgram,
  type StudentResearchProgram,
  type StudentFullSupportProgram,
} from 'src/app/services/counselorConsoleApi';
import './StudentProfilePage.scss';

dayjs.extend(relativeTime);

// Heavy tab content is reused verbatim from the read-only "My Journey"
// drill-down (already org-auth'd on the backend) and code-split so each tab's
// bundle only loads when the counselor opens it.
const ApplicationsTab = lazy(
  () => import('src/pages/counselor-console/_journey/Applications'),
);
const EssaysTab = lazy(
  () => import('src/pages/counselor-console/_journey/Essays'),
);
const DocumentsTab = lazy(
  () => import('src/pages/counselor-console/_journey/Documents'),
);
const TasksTab = lazy(
  () => import('src/pages/counselor-console/_journey/Tasks'),
);
const SessionsTab = lazy(
  () => import('src/pages/counselor-console/_journey/StudentDataBookingsCard'),
);

// ── status → pill variant maps ──────────────────────────────────────────────
const APPLICATION_PILL: Record<string, CcPillVariant> = {
  submitted: 'success',
  accepted: 'success',
  admitted: 'success',
  in_progress: 'info',
  in_review: 'info',
  waitlisted: 'warning',
  deferred: 'warning',
  rejected: 'danger',
  denied: 'danger',
  not_started: 'neutral',
  planning: 'neutral',
};

const ESSAY_PILL: Record<string, CcPillVariant> = {
  final: 'success',
  submitted: 'success',
  review: 'info',
  revision: 'warning',
  draft: 'neutral',
  archived: 'neutral',
};

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
  const stats = dashboard?.stats;
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
            This URL is missing a student id. Return to the roster and pick a
            student to view their profile.
          </div>
        </div>
      </div>
    );
  }

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
          userId={userId!}
          profile={profile}
          stats={stats}
          dashboardLoading={dashboardLoading}
          dashboardError={dashboardError}
        />
      ),
    },
    {
      key: 'programs',
      label: (
        <span className="cc-profile-tab-label">
          <Tent size={15} /> Programs
        </span>
      ),
      children: <ProgramsTab userId={userId!} orgId={orgId} />,
    },
    {
      key: 'applications',
      label: (
        <span className="cc-profile-tab-label">
          <GraduationCap size={15} /> Applications
        </span>
      ),
      children: (
        <Suspense fallback={<TabFallback />}>
          <ApplicationsTab studentId={userId!} studentName={studentName} />
        </Suspense>
      ),
    },
    {
      key: 'essays',
      label: (
        <span className="cc-profile-tab-label">
          <FileText size={15} /> Essays
        </span>
      ),
      children: (
        <Suspense fallback={<TabFallback />}>
          <EssaysTab studentId={userId!} studentName={studentName} />
        </Suspense>
      ),
    },
    {
      key: 'documents',
      label: (
        <span className="cc-profile-tab-label">
          <FolderOpen size={15} /> Documents
        </span>
      ),
      children: (
        <Suspense fallback={<TabFallback />}>
          <DocumentsTab studentId={userId!} studentName={studentName} />
        </Suspense>
      ),
    },
    {
      key: 'tasks',
      label: (
        <span className="cc-profile-tab-label">
          <ListChecks size={15} /> Tasks
        </span>
      ),
      children: (
        <TasksTabWithActions
          userId={userId!}
          studentName={studentName}
          orgId={orgId}
        />
      ),
    },
    {
      key: 'notes',
      label: (
        <span className="cc-profile-tab-label">
          <StickyNote size={15} /> Notes
        </span>
      ),
      children: <NotesTab userId={userId!} orgId={orgId} />,
    },
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
          Read-only academic and application profile — programs, applications,
          essays, documents, tasks and sessions.
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
        <CcStat
          icon={<GraduationCap size={15} />}
          label="Applications"
          value={statValue(stats?.totalApplications, dashboardLoading)}
          meta={stats ? `${stats.submittedApplications ?? 0} submitted` : undefined}
          tone="info"
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

function statValue(n: number | undefined, loading: boolean): number | string {
  if (loading && n == null) return '—';
  return n ?? 0;
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

// ── Overview tab: student info + dashboard summary + recent activity ─────────
interface OverviewTabProps {
  userId: string;
  profile: any;
  stats:
    | {
        totalApplications: number;
        submittedApplications: number;
        totalEssays: number;
        inProgressEssays: number;
        totalDocuments: number;
        totalScholarships: number;
      }
    | undefined;
  dashboardLoading: boolean;
  dashboardError: boolean;
}

function OverviewTab({
  userId,
  profile,
  stats,
  dashboardLoading,
  dashboardError,
}: OverviewTabProps) {
  const { data: appsRes } = useGetStudentJourneyCollegeApplicationsQuery(userId, {
    skip: !userId,
  });
  const { data: essaysRes } = useGetStudentJourneyEssaysQuery(userId, {
    skip: !userId,
  });
  const { data: docsRes } = useGetStudentJourneyDocumentsQuery(userId, {
    skip: !userId,
  });

  const apps = appsRes?.data ?? [];
  const essays = essaysRes?.data?.essays ?? [];
  const docs = docsRes?.data ?? [];

  const recent = useMemo(() => {
    type Item = {
      key: string;
      kind: string;
      title: string;
      status?: string;
      variant?: CcPillVariant;
      at: number;
    };
    const items: Item[] = [];
    apps.forEach((a) =>
      items.push({
        key: `app-${a.id}`,
        kind: 'Application',
        title: a.universityName || 'University application',
        status: prettify(a.status),
        variant: APPLICATION_PILL[a.status] ?? 'neutral',
        at: new Date(a.updatedAt || a.createdAt).getTime(),
      }),
    );
    essays.forEach((e) =>
      items.push({
        key: `essay-${e.id}`,
        kind: 'Essay',
        title: e.title || prettify(e.essayType),
        status: prettify(e.status),
        variant: ESSAY_PILL[e.status] ?? 'neutral',
        at: new Date(e.updatedAt || e.createdAt || 0).getTime(),
      }),
    );
    docs.forEach((d) =>
      items.push({
        key: `doc-${d.id}`,
        kind: 'Document',
        title: d.fileName || prettify(d.documentType),
        status: d.isVerified ? 'Verified' : undefined,
        variant: d.isVerified ? 'success' : 'neutral',
        at: new Date(d.updatedAt || d.createdAt || 0).getTime(),
      }),
    );
    return items
      .filter((i) => !Number.isNaN(i.at))
      .sort((a, b) => b.at - a.at)
      .slice(0, 6);
  }, [apps, essays, docs]);

  if (dashboardLoading && !profile) {
    return <TabFallback />;
  }

  if (dashboardError && !profile) {
    return (
      <InlineError
        title="Couldn’t load the summary"
        text="The student overview failed to load. Try switching tabs or refreshing."
      />
    );
  }

  const infoRows: { label: string; value: ReactNode }[] = [
    { label: 'Status', value: prettify(profile?.profileStatus) },
    { label: 'Completion', value: `${profile?.completionPercentage ?? 0}%` },
    {
      label: 'Last active',
      value: profile?.lastActiveAt ? formatDate(profile.lastActiveAt) : '—',
    },
    { label: 'Scholarships', value: stats?.totalScholarships ?? 0 },
  ];

  return (
    <div className="cc-profile-overview">
      <Section title="Student information">
        <dl className="cc-profile-info">
          {infoRows.map((row) => (
            <div className="cc-profile-info-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Application summary">
        {stats ? (
          <div className="cc-profile-summary-grid">
            <SummaryCell label="Applications" value={stats.totalApplications} />
            <SummaryCell label="Submitted" value={stats.submittedApplications} />
            <SummaryCell label="Essays" value={stats.totalEssays} />
            <SummaryCell label="In-progress essays" value={stats.inProgressEssays} />
            <SummaryCell label="Documents" value={stats.totalDocuments} />
            <SummaryCell label="Scholarships" value={stats.totalScholarships} />
          </div>
        ) : (
          <EmptyState>No summary data yet.</EmptyState>
        )}
      </Section>

      <Section title="Recent activity">
        {recent.length > 0 ? (
          <ul className="cc-profile-activity">
            {recent.map((item) => (
              <li className="cc-profile-activity-row" key={item.key}>
                <span className="cc-profile-activity-kind">{item.kind}</span>
                <span className="cc-profile-activity-title" title={item.title}>
                  {item.title}
                </span>
                {item.status ? (
                  <CcPill variant={item.variant}>{item.status}</CcPill>
                ) : (
                  <span />
                )}
                <span className="cc-profile-activity-date">
                  {formatDate(new Date(item.at).toISOString())}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            No applications, essays or documents recorded yet.
          </EmptyState>
        )}
      </Section>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="cc-profile-summary-cell">
      <span className="cc-profile-summary-value">{value ?? 0}</span>
      <span className="cc-profile-summary-label">{label}</span>
    </div>
  );
}

// ── Programs tab: one editorial card per enrolled TopCoach program ───────────
function ProgramsTab({
  userId,
  orgId,
}: {
  userId: string;
  orgId: string | null;
}) {
  const { data, isLoading, isError } = useGetStudentProgramsQuery(
    { orgId: orgId ?? '', userId },
    { skip: !userId || !orgId },
  );

  if (isLoading) {
    return <ProgramsSkeleton />;
  }

  if (isError) {
    return (
      <InlineError
        title="Couldn’t load programs"
        text="The student’s program enrollments failed to load. Try again shortly."
      />
    );
  }

  const p = data;
  const hasAny =
    !!p &&
    (!!p.admissions ||
      !!p.sat ||
      !!p.research ||
      !!p.fullSupport ||
      !!p.community?.active);

  if (!p || !hasAny) {
    return (
      <Section title="Programs">
        <EmptyState>Not enrolled in any program yet.</EmptyState>
      </Section>
    );
  }

  return (
    <div className="cc-programs-grid">
      {p.admissions ? <AdmissionsCard data={p.admissions} /> : null}
      {p.sat ? <SatCard data={p.sat} /> : null}
      {p.fullSupport ? <FullSupportCard data={p.fullSupport} /> : null}
      {p.research ? <ResearchCard data={p.research} /> : null}
      {p.community?.active ? <CommunityCard /> : null}
    </div>
  );
}

function ProgramsSkeleton() {
  return (
    <div className="cc-programs-grid">
      {[0, 1].map((i) => (
        <section className="cc-program-card" key={i}>
          <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 3 }} />
        </section>
      ))}
    </div>
  );
}

// ── Program card primitives ──────────────────────────────────────────────────
function ProgramCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cc-program-card">
      <div className="cc-program-card-head">
        <span className="cc-program-card-ico" aria-hidden="true">
          {icon}
        </span>
        <h3 className="cc-program-card-title">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ProgMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="cc-program-metric">
      <span className="cc-program-metric-value">{value}</span>
      <span className="cc-program-metric-label">{label}</span>
    </div>
  );
}

function ProgBar({ pct, label }: { pct: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="cc-program-progress">
      <div className="cc-program-progress-top">
        <span className="cc-program-progress-label">{label}</span>
        <span className="cc-program-progress-pct">{v}%</span>
      </div>
      <div className="cc-program-bar-track">
        <div className="cc-program-bar-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function AdmissionsCard({ data }: { data: StudentAdmissionsProgram }) {
  return (
    <ProgramCard icon={<GraduationCap size={16} />} title="Admissions">
      <ProgBar pct={data.progress} label="Progress" />
      <div className="cc-program-metrics">
        <ProgMetric label="Applications" value={data.applications.total} />
        <ProgMetric label="Submitted" value={data.applications.submitted} />
      </div>
    </ProgramCard>
  );
}

function SatCard({ data }: { data: StudentSatProgram }) {
  return (
    <ProgramCard icon={<Target size={16} />} title="SAT Prep">
      <div className="cc-program-metrics">
        <ProgMetric
          label="Best mock"
          value={
            <>
              {data.bestScore}
              <span className="cc-program-metric-suffix"> / 1600</span>
            </>
          }
        />
        <ProgMetric label="Accuracy" value={`${Math.round(data.accuracy)}%`} />
        <ProgMetric label="Questions" value={data.questionsAttempted} />
      </div>
      <ProgBar pct={data.lessonsProgress} label="Lessons" />
    </ProgramCard>
  );
}

function FullSupportCard({ data }: { data: StudentFullSupportProgram }) {
  return (
    <ProgramCard icon={<LifeBuoy size={16} />} title="Full Support">
      <div className="cc-program-metrics">
        <ProgMetric
          label="Sessions"
          value={`${data.sessions.completed}/${data.sessions.total}`}
        />
        <ProgMetric
          label="Milestones"
          value={`${data.milestones.done}/${data.milestones.total}`}
        />
        <ProgMetric
          label="Tasks pending"
          value={`${data.tasks.pending}/${data.tasks.total}`}
        />
      </div>
      <ProgBar pct={data.milestones.progress} label="Milestones" />
      {data.applications.length > 0 ? (
        <div className="cc-program-applist">
          <div className="cc-program-applist-title">Applications</div>
          <ul>
            {data.applications.map((a, i) => (
              <li
                className="cc-program-applist-row"
                key={`${a.program}-${a.stage}-${i}`}
              >
                <span className="cc-program-applist-name" title={a.program}>
                  {a.program}
                </span>
                <span className="cc-program-applist-stage">
                  {prettify(a.stage)}
                </span>
                <CcPill
                  variant={PROGRAM_PILL[(a.status || '').toLowerCase()] ?? 'neutral'}
                >
                  {prettify(a.status)}
                </CcPill>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ProgramCard>
  );
}

function ResearchCard({ data }: { data: StudentResearchProgram }) {
  return (
    <ProgramCard icon={<FlaskConical size={16} />} title="Research Prep">
      <div className="cc-program-metrics">
        <ProgMetric
          label="Weeks completed"
          value={`${data.weeksCompleted}/${data.totalWeeks}`}
        />
      </div>
      <ProgBar pct={data.progress} label="Progress" />
    </ProgramCard>
  );
}

function CommunityCard() {
  return (
    <ProgramCard icon={<Users size={16} />} title="Community">
      <div className="cc-program-community">
        <CcPill variant="success">Active member</CcPill>
        <p className="cc-program-community-text">
          Participating in the TopCoach student community.
        </p>
      </div>
    </ProgramCard>
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

// ── Notes tab: private counselor notes on the student ────────────────────────
function NotesTab({ userId, orgId }: { userId: string; orgId: string | null }) {
  const currentUserId = useTypedSelector((s) => s.auth.profile?.id);
  const [draft, setDraft] = useState('');

  const { data, isLoading, isError } = useGetStudentNotesQuery(
    { orgId: orgId ?? '', userId },
    { skip: !orgId || !userId },
  );
  const [addNote, { isLoading: adding }] = useAddStudentNoteMutation();
  const [deleteNote] = useDeleteStudentNoteMutation();

  const notes = useMemo(() => {
    const items = data?.items ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data]);

  const handleAdd = async () => {
    const body = draft.trim();
    if (!body || !orgId) return;
    try {
      await addNote({ orgId, userId, body }).unwrap();
      setDraft('');
      message.success('Note added');
    } catch {
      message.error('Could not save the note. Please try again.');
    }
  };

  const handleDelete = (noteId: string) => {
    if (!orgId) return;
    Modal.confirm({
      title: 'Delete this note?',
      content: 'This permanently removes the note and cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteNote({ orgId, userId, noteId }).unwrap();
          message.success('Note deleted');
        } catch {
          message.error('Could not delete the note. Please try again.');
        }
      },
    });
  };

  return (
    <Section title="Counselor notes">
      <div className="cc-note-composer">
        <textarea
          className="cc-note-input"
          value={draft}
          maxLength={2000}
          rows={3}
          placeholder="Add a private note about this student — only counselors on this team can see it."
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="cc-note-composer-foot">
          <Button
            type="primary"
            className="cc-profile-action-btn"
            loading={adding}
            disabled={!draft.trim() || !orgId}
            onClick={handleAdd}
            icon={<Plus size={14} />}
          >
            Save note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TabFallback />
      ) : isError ? (
        <InlineError
          title="Couldn’t load notes"
          text="The student’s notes failed to load. Try again shortly."
        />
      ) : notes.length > 0 ? (
        <ul className="cc-note-list">
          {notes.map((note) => {
            const mine = !!currentUserId && note.authorUserId === currentUserId;
            return (
              <li className="cc-note" key={note.id}>
                <div className="cc-note-head">
                  <span className="cc-note-author">
                    {note.authorName || 'Counselor'}
                  </span>
                  <span className="cc-note-dot" aria-hidden="true">
                    ·
                  </span>
                  <span className="cc-note-time">
                    {dayjs(note.createdAt).fromNow()}
                  </span>
                  {mine ? (
                    <button
                      type="button"
                      className="cc-note-del"
                      aria-label="Delete note"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <p className="cc-note-body">{note.body}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>
          No notes yet. Add the first note to keep the team in the loop.
        </EmptyState>
      )}
    </Section>
  );
}

// ── Tasks tab: read-only journey tasks + counselor "Assign task" action ──────
function TasksTabWithActions({
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
          <span className="cc-tasks-toolbar-title">Tasks</span>
          <span className="cc-tasks-toolbar-sub">
            Assign follow-ups and track {firstName}’s to-dos.
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

      <Suspense fallback={<TabFallback />}>
        <TasksTab studentId={userId} studentName={studentName} />
      </Suspense>

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
