import React, { useState } from 'react';
import { Card, Table, Button, Alert, Row, Col, Statistic, Modal, Progress, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { User, Clock, FileText, Target, Users, ClipboardList, CalendarClock, BarChart2, CheckCircle2, Globe, History, Rocket, FlaskConical, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useColors from 'src/hooks/useColors';
import dayjs from 'src/lib/dayjs';
import {
  useGetAdminStatsQuery,
  useGetAdminStudentsQuery,
  useGetAdminMentorAssignmentsQuery,
  useAssignMentorMutation,
  useUnassignMentorMutation,
  useGetAdminCurriculumProgressQuery,
  useGetAdminRecentInteractionsQuery,
  useGetAdminStudentSessionsQuery,
  useGetAdminStudentTasksQuery,
  useGetAdminStudentMilestonesQuery,
  useGetAdminStudentPipelineQuery,
  useLazyGetWeeklyReportQuery,
  useGetScholarhubCourseProgressQuery,
  type AdminStudentRow,
  type AdminMentorRow,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import { generateWeeklyReportPdf } from 'src/utils/fullSupportWeeklyReportPdf';
import { SatProgressAdminTable } from 'src/utils/satProgressAdminTable';
import { AcPill, type AcPillVariant } from 'src/pages/admin/console/components/AcPill';
import {
  useGetAdminStudentsQuery as useGetResearchAdminStudentsQuery,
  useGetGraderInboxQuery as useGetResearchGraderInboxQuery,
  useGetResearchProgressSummaryQuery,
  type ResearchAdminStudent,
  type ResearchSubmission,
} from 'src/app/services/research-prep';
import './full-support.scss';

/**
 * Normalise an RTK Query response that we expect to be an array. Accepts a
 * plain array, a `{ data: [...] }` wrapper, or anything else (treated as
 * empty). Lets us call `.find` / `.filter` without crashing when the endpoint
 * returns an error envelope.
 */
function coerceArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const maybe = (value as { data?: unknown }).data;
    if (Array.isArray(maybe)) return maybe as T[];
  }
  return [];
}

function getTaskStatus(r: TaskDto): string {
  if (r.hasFeedback) return 'Reviewed';
  if (r.submissionText) return 'Needs review';
  return 'Pending';
}

function interactionPillVariant(type: string): AcPillVariant {
  const m: Record<string, AcPillVariant> = {
    Session: 'info',
    'Task Assigned': 'purple',
    'Task Review': 'warning',
    Feedback: 'cyan',
    Milestone: 'mint',
    'Milestone Added': 'cyan',
  };
  return m[type] ?? 'neutral';
}

function taskPillVariant(label: string): AcPillVariant {
  if (label === 'Reviewed') return 'mint';
  if (label === 'Needs review') return 'warning';
  if (label === 'Pending') return 'neutral';
  return 'info';
}

export type FullSupportAdminDashboardProps = {
  /** Rendered inside unified admin console — dark shell, mint accent, outline pills. */
  integratedInAdminConsole?: boolean;
};

export default function FullSupportAdminDashboard({
  integratedInAdminConsole = false,
}: FullSupportAdminDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = useColors();
  const primary = colors?.colorPrimary ?? '#8b0000';
  const accent = integratedInAdminConsole ? '#10b981' : primary;
  const muted = integratedInAdminConsole ? 'var(--ac-text-secondary)' : '#666';
  const subtle = integratedInAdminConsole ? 'var(--ac-text-muted)' : '#999';
  const { data: statsData } = useGetAdminStatsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetAdminStudentsQuery();
  const { data: mentorsFromPage } = useGetMentorsQuery(); // same API as Mentors page (accepted only)
  const { data: assignmentsData } = useGetAdminMentorAssignmentsQuery();
  const stats = statsData?.data;
  const [assignMentor] = useAssignMentorMutation();
  const [unassignMentor, { isLoading: unassignLoading }] = useUnassignMentorMutation();

  const students: AdminStudentRow[] = studentsData?.data ?? [];
  const assignmentCounts = assignmentsData?.data ?? {};
  const mentors: AdminMentorRow[] = (mentorsFromPage ?? [])
    .map((m) => {
      const c = assignmentCounts[m.id] ?? { studentCount: 0, students: [] };
      return {
        id: m.id,
        name: m.profile?.name ?? 'Unknown',
        specialization: m.mentorProfile?.major ?? m.mentorProfile?.university ?? '-',
        studentCount: c.studentCount,
        students: c.students,
      };
    })
    .sort((a, b) => b.studentCount - a.studentCount);
  const mentorsWithStudents = mentors.filter((m) => m.studentCount >= 1);
  const unassigned = students.filter((s) => !s.mentorId);

  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; mentorName: string } | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<{ id: string; name: string } | null>(null);
  const [assignModalStudent, setAssignModalStudent] = useState<AdminStudentRow | null>(null);
  const [showAllInteractions, setShowAllInteractions] = useState(false);
  const { data: adminCurriculumData } = useGetAdminCurriculumProgressQuery(selectedStudent?.id ?? '', { skip: !selectedStudent?.id });
  const adminCurriculumWatchlist = adminCurriculumData?.data ?? [];
  const { data: adminSessionsData } = useGetAdminStudentSessionsQuery(selectedStudent?.id ?? '', { skip: !selectedStudent?.id });
  const adminStudentSessions = adminSessionsData?.data?.sessions ?? [];
  const adminStudentUsedHours = adminSessionsData?.data?.usedHours ?? 0;
  const adminStudentAllocatedHours = adminSessionsData?.data?.allocatedHours ?? 6;
  const { data: adminTasksData } = useGetAdminStudentTasksQuery(selectedStudent?.id ?? '', { skip: !selectedStudent?.id });
  const adminStudentTasks = adminTasksData?.data ?? [];
  const { data: adminMilestonesData } = useGetAdminStudentMilestonesQuery(selectedStudent?.id ?? '', { skip: !selectedStudent?.id });
  const adminStudentMilestones = adminMilestonesData?.data ?? [];
  const { data: adminPipelineData } = useGetAdminStudentPipelineQuery(selectedStudent?.id ?? '', { skip: !selectedStudent?.id });
  const adminStudentPipeline = adminPipelineData?.data ?? [];
  const [fetchWeeklyReport, { isLoading: weeklyReportDownloading }] = useLazyGetWeeklyReportQuery();
  const { data: interactionsData } = useGetAdminRecentInteractionsQuery(50);
  const adminInteractions = interactionsData?.data ?? [];

  // Research Prep — admin per-student progress and grader inbox view.
  // Mock-mode today: matches by name fallback. Backend will accept selectedStudent.id directly.
  const { data: researchStudentsRaw } = useGetResearchAdminStudentsQuery();
  const { data: researchInboxRaw } = useGetResearchGraderInboxQuery();
  // Defensive coerce: the backend can return either a plain array or an
  // error/wrapper object on non-2xx responses. Treat anything non-array as [].
  const researchStudentsList = coerceArray<ResearchAdminStudent>(researchStudentsRaw);
  const researchInbox = coerceArray<ResearchSubmission>(researchInboxRaw);
  const researchStudentRow = researchStudentsList.find(
    (s) => (s?.name ?? '').toLowerCase() === (selectedStudent?.name ?? '').toLowerCase(),
  );
  const researchSubmissionsForStudent = researchInbox.filter(
    (s) => (s?.studentName ?? '').toLowerCase() === (selectedStudent?.name ?? '').toLowerCase(),
  );
  // Polling already keeps this fresh every 2 min while the tab is active.
  // `refetchOnFocus`/`refetchOnReconnect` on top of polling = double-fetching
  // every time the admin tabs back. Let polling own the freshness contract.
  const { data: satCourseData, isLoading: satCourseLoading } = useGetScholarhubCourseProgressQuery(
    { page: 1, perPage: 50 },
    { pollingInterval: 120000 },
  );
  const satCoursePayload = satCourseData?.data;

  const handleUnassign = (studentUserId: string) => {
    unassignMentor(studentUserId);
  };
  const handleAssignClick = (record: AdminStudentRow) => setAssignModalStudent(record);
  const handleAssignConfirm = (mentorUserId: string) => {
    if (!assignModalStudent) return;
    assignMentor({ studentUserId: assignModalStudent.id, mentorUserId: mentorUserId });
    setAssignModalStudent(null);
  };

  const columns = [
    { title: 'STUDENT', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: 'ASSIGNED MENTOR',
      dataIndex: 'mentorName',
      key: 'mentorName',
      render: (v: string | null) => v ?? <span style={{ color: '#999' }}>Unassigned</span>,
    },
    { title: 'SESSIONS', dataIndex: 'sessions', key: 'sessions', width: 100 },
    { title: 'TASKS', dataIndex: 'tasks', key: 'tasks', width: 100 },
    {
      title: 'RESEARCH',
      key: 'research',
      width: 130,
      render: (_: unknown, record: AdminStudentRow) => {
        const r = researchStudentsList.find(
          (rs) => (rs?.name ?? '').toLowerCase() === record.name.toLowerCase(),
        );
        if (!r) return <span style={{ color: '#999', fontSize: 12 }}>—</span>;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <FlaskConical size={12} color={accent} />
            <strong>{r.weeksCompleted}/8</strong>
            <span style={{ color: muted }}>· {r.overallPercent}%</span>
            {r.pendingSubmissions > 0 && (
              <AcPill variant="amber">{r.pendingSubmissions}</AcPill>
            )}
          </span>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 100,
        render: (s: string) => <AcPill variant={s === 'Active' ? 'mint' : 'neutral'}>{s}</AcPill>,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: AdminStudentRow) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button type="link" size="small" onClick={() => setSelectedStudent({ id: record.id, name: record.name, mentorName: record.mentorName ?? '' })}>View</Button>
          {record.mentorId ? (
            <Button type="link" size="small" danger loading={unassignLoading} onClick={() => handleUnassign(record.id)}>Unassign</Button>
          ) : (
            <Button
              type="primary"
              size="small"
              style={{
                backgroundColor: accent,
                borderColor: accent,
                marginLeft: 16,
                ...(integratedInAdminConsole ? { color: '#04120c' } : {}),
              }}
              onClick={() => handleAssignClick(record)}
            >
              Assign Mentor
            </Button>
          )}
        </span>
      ),
    },
  ];

  const statValueStyle = integratedInAdminConsole ? { color: 'var(--ac-text)' } : undefined;

  return (
    <div
      className={`full-support-page full-support-admin${integratedInAdminConsole ? ' full-support-page--admin-integrated' : ''}`}
    >
      {!integratedInAdminConsole && (
        <Card className="full-support-header">
          <h1 style={{ color: accent }}>Admin Dashboard for Full Support Program</h1>
          <p style={{ color: muted }}>
            System administration: assign students to mentors, monitor all interactions, and oversee program progress.
          </p>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: integratedInAdminConsole ? 0 : 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats?.totalStudents ?? students.length}
              prefix={<User size={16} style={{ color: accent }} />}
              loading={studentsLoading}
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sessions Conducted"
              value={stats?.sessionsConducted ?? 0}
              prefix={<Clock size={16} style={{ color: accent }} />}
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={stats?.tasksCompleted ?? 0}
              prefix={<FileText size={16} style={{ color: accent }} />}
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Applications Submitted"
              value={stats?.applicationsSubmitted ?? 0}
              prefix={<Target size={16} style={{ color: accent }} />}
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
      </Row>

      {unassigned.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${unassigned.length} students not assigned to a mentor`}
          description={
            <>
              Students cannot begin sessions, receive tasks, or track milestones until assigned.
              <div style={{ marginTop: 8 }}>
                {unassigned.map((s) => (
                  <span key={s.id} style={{ marginRight: 8 }}>{s.name}</span>
                ))}
              </div>
            </>
          }
          style={{ marginTop: 24 }}
        />
      )}

      <Card title={<><Users size={16} style={{ marginRight: 8, color: accent }} />Student–Mentor Assignments</>} style={{ marginTop: 24 }} className="full-support-card">
        <Table
          dataSource={students}
          columns={columns}
          rowKey="id"
          loading={studentsLoading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Card title={<><ClipboardList size={16} style={{ marginRight: 8, color: accent }} />Mentors</>} style={{ marginTop: 24 }} className="full-support-card">
        {mentorsWithStudents.length === 0 ? (
          <p style={{ color: '#666' }}>No mentors with assigned students yet. Assign a mentor to a student to see them here.</p>
        ) : (
        mentorsWithStudents.map((m) => (
          <div key={m.id} className="mentor-row" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <Button type="link" style={{ padding: 0, fontWeight: 600, height: 'auto' }} onClick={() => setSelectedMentor({ id: m.id, name: m.name })}>
                  {m.name}
                </Button>
              </div>
              <AcPill variant="info">{m.studentCount} students assigned</AcPill>
            </div>
            <div style={{ marginTop: 4 }}>
              {m.students.map((studentName) => (
                <AcPill key={studentName} variant="neutral" className="fs-mentor-student-pill">
                  {studentName}
                </AcPill>
              ))}
            </div>
          </div>
        ))
        )}
      </Card>

      <Card title={<><Rocket size={16} style={{ marginRight: 8, color: accent }} />{t('fullSupport.satProgressAllStudents', 'SAT progress (all students)')}</>} style={{ marginTop: 24 }} className="full-support-card">
        <p style={{ color: '#666', marginBottom: 16 }}>{t('fullSupport.satProgressAllStudentsDesc', 'Course-level SAT progress from ScholarHub. Data is synced when students are enrolled in Full Support.')}</p>
        {satCourseLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>{t('fullSupport.satProgressLoading', 'Loading SAT progress…')}</div>
        ) : satCoursePayload != null && typeof satCoursePayload === 'object' && Object.keys(satCoursePayload as object).length > 0 ? (
          <SatProgressAdminTable
            payload={satCoursePayload}
            emptyText={t('fullSupport.satProgressEmptyRecords', 'No student progress records yet.')}
            viewRawLabel={t('fullSupport.satViewRawResponse', 'View raw response')}
            pageSummary={(current, last, total) => t('fullSupport.satPageSummary', { current, last, total })}
          />
        ) : (
          <Alert type="info" message={t('fullSupport.satProgressNoData', 'No SAT progress data yet')} description={t('fullSupport.satProgressNoDataDesc', 'Ensure ScholarHub env vars are set and at least one Full Support student has been enrolled to sync with ScholarHub.')} />
        )}
      </Card>

      <Modal
        title={`Assign mentor: ${assignModalStudent?.name ?? ''}`}
        open={!!assignModalStudent}
        onCancel={() => setAssignModalStudent(null)}
        footer={null}
        width={400}
      >
        {assignModalStudent && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#666', marginBottom: 12 }}>Choose a mentor to assign to this student:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mentors.map((m) => (
                <Button
                  key={m.id}
                  type="primary"
                  block
                  style={{
                    backgroundColor: accent,
                    borderColor: accent,
                    ...(integratedInAdminConsole ? { color: '#04120c' } : {}),
                  }}
                  onClick={() => handleAssignConfirm(m.id)}
                >
                  {m.name}
                </Button>
              ))}
            </div>
            {mentors.length === 0 && <p style={{ color: '#999' }}>No mentors available. Add mentor profiles first.</p>}
          </div>
        )}
      </Modal>

      <Modal
        title={`Track ${selectedMentor?.name ?? ''}: actions`}
        open={!!selectedMentor}
        onCancel={() => setSelectedMentor(null)}
        footer={
          <Button
            type="primary"
            onClick={() => setSelectedMentor(null)}
            style={{
              backgroundColor: accent,
              borderColor: accent,
              ...(integratedInAdminConsole ? { color: '#04120c' } : {}),
            }}
          >
            Close
          </Button>
        }
        width={600}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {selectedMentor && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#666', marginBottom: 12 }}>
              Assigned students: {mentors.find((x) => x.id === selectedMentor.id)?.students.join(', ')}
            </p>
            <div style={{ marginTop: 16 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Recent actions</strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {adminInteractions.filter((i) => i.mentor === selectedMentor.name)
                  .map((i) => (
                    <li key={i.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <AcPill variant={interactionPillVariant(i.type)}>{i.type}</AcPill>
                        <span style={{ marginLeft: 6 }}><strong>{i.student}</strong></span>
                        <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{i.description}</div>
                      </div>
                      <span style={{ color: '#999', whiteSpace: 'nowrap', fontSize: 13 }}>{dayjs(i.date).format('MMM D, YYYY')}</span>
                    </li>
                  ))}
              </ul>
              {adminInteractions.filter((i) => i.mentor === selectedMentor.name).length === 0 && (
                <p style={{ color: '#999' }}>No recent actions for this mentor.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {(() => {
        // Some legacy profile rows have a trailing " undefined" in the name —
        // scrub it here so the modal header reads cleanly.
        const cleanStudentName = (selectedStudent?.name ?? '')
          .replace(/\s+(undefined|null)\b/gi, '')
          .trim() || 'Student';
        const usagePct = adminStudentAllocatedHours > 0
          ? Math.round((adminStudentUsedHours / adminStudentAllocatedHours) * 100)
          : 0;
        // Ant Modal renders in a portal outside the admin console's
        // ConfigProvider, so CSS variables declared on `.admin-console-app`
        // don't resolve here. Use concrete hex colors for the dark-theme path,
        // and lean on `.fs-progress-modal--dark` in the stylesheet for antd
        // sub-component overrides (table, card, etc.).
        const panelStyle: React.CSSProperties = integratedInAdminConsole
          ? {
              marginBottom: 16,
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(148, 163, 184, 0.22)',
            }
          : { marginBottom: 16 };
        const headStyle: React.CSSProperties = integratedInAdminConsole
          ? { color: '#e5e7eb', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }
          : {};
        const labelColor = integratedInAdminConsole ? '#e5e7eb' : '#222';
        const subtextColor = integratedInAdminConsole ? '#cbd5e1' : muted;
        const mutedColor = integratedInAdminConsole ? '#94a3b8' : subtle;
        const dividerColor = integratedInAdminConsole
          ? 'rgba(148, 163, 184, 0.22)'
          : '#f0f0f0';

        return (
      <Modal
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: mutedColor,
              }}
            >
              Full Support progress
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: integratedInAdminConsole ? '#ffffff' : '#111827',
                lineHeight: 1.2,
              }}
            >
              {cleanStudentName}
            </span>
          </div>
        }
        open={!!selectedStudent}
        onCancel={() => setSelectedStudent(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button
              type="link"
              size="small"
              loading={weeklyReportDownloading}
              onClick={async () => {
                if (!selectedStudent) return;
                try {
                  const res = await fetchWeeklyReport(selectedStudent.id).unwrap();
                  if (res?.data) generateWeeklyReportPdf(res.data);
                  else message.error('Could not load report.');
                } catch {
                  message.error('Could not load report.');
                }
              }}
              style={{ padding: 0, color: accent }}
            >
              Download {cleanStudentName}&apos;s weekly report
            </Button>
            <Button
              type="primary"
              onClick={() => setSelectedStudent(null)}
              style={{
                backgroundColor: accent,
                borderColor: accent,
                ...(integratedInAdminConsole ? { color: '#04120c' } : {}),
              }}
            >
              Close
            </Button>
          </div>
        }
        width={960}
        centered
        className={integratedInAdminConsole ? 'fs-progress-modal fs-progress-modal--dark' : 'fs-progress-modal'}
        styles={{
          body: {
            maxHeight: '72vh',
            overflow: 'auto',
            paddingTop: 8,
            background: integratedInAdminConsole ? 'transparent' : undefined,
          },
          content: integratedInAdminConsole
            ? {
                background: '#161922',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: 14,
              }
            : undefined,
          header: integratedInAdminConsole
            ? {
                // Dark-paint the header explicitly — relying on `transparent`
                // let antd's default colorBgContainer (white) flash through
                // as a white strip above the title.
                background: '#161922',
                borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
                margin: 0,
                padding: '16px 24px',
                borderRadius: '14px 14px 0 0',
              }
            : undefined,
          footer: integratedInAdminConsole
            ? {
                background: 'transparent',
                borderTop: '1px solid rgba(148, 163, 184, 0.22)',
              }
            : undefined,
          mask: integratedInAdminConsole ? { background: 'rgba(5, 8, 14, 0.65)' } : undefined,
        }}
      >
        {selectedStudent && (
          <div style={{ padding: '4px 0 8px' }}>
            <p style={{ color: subtextColor, marginBottom: 20, fontSize: 14 }}>
              Track sessions, applications, and deadlines for this student.
            </p>

            {(() => {
              const tileStyle: React.CSSProperties = {
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${dividerColor}`,
                background: integratedInAdminConsole ? 'rgba(255,255,255,0.045)' : '#fafafa',
              };
              const tileLabelStyle: React.CSSProperties = {
                fontSize: 11,
                letterSpacing: '0.08em',
                color: mutedColor,
                fontWeight: 700,
                textTransform: 'uppercase',
              };
              const tileValueStyle: React.CSSProperties = {
                fontSize: 24,
                fontWeight: 700,
                color: integratedInAdminConsole ? '#ffffff' : '#111827',
                marginTop: 6,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              };
              const tileCaptionStyle: React.CSSProperties = {
                fontSize: 12,
                color: subtextColor,
                marginTop: 8,
              };
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div style={tileStyle}>
                    <div style={tileLabelStyle}>Hours this month</div>
                    <div style={tileValueStyle}>
                      {adminStudentUsedHours}h / {adminStudentAllocatedHours}h
                    </div>
                    <Progress
                      percent={usagePct}
                      size="small"
                      strokeColor={accent}
                      showInfo={false}
                      style={{ marginTop: 8, marginBottom: 0 }}
                    />
                  </div>
                  <div style={tileStyle}>
                    <div style={tileLabelStyle}>Open tasks</div>
                    <div style={tileValueStyle}>
                      {
                        adminStudentTasks.filter(
                          (t) => getTaskStatus(t).toLowerCase() !== 'done',
                        ).length
                      }
                    </div>
                    <div style={tileCaptionStyle}>{adminStudentTasks.length} total</div>
                  </div>
                  <div style={tileStyle}>
                    <div style={tileLabelStyle}>Milestones</div>
                    <div style={tileValueStyle}>
                      {adminStudentMilestones.filter((m) => m.done).length} /{' '}
                      {adminStudentMilestones.length}
                    </div>
                    <div style={tileCaptionStyle}>completed</div>
                  </div>
                  <div style={tileStyle}>
                    <div style={tileLabelStyle}>Applications</div>
                    <div style={tileValueStyle}>{adminStudentPipeline.length}</div>
                    <div style={tileCaptionStyle}>in pipeline</div>
                  </div>
                  <div style={tileStyle}>
                    <div style={tileLabelStyle}>Research Prep</div>
                    <div style={tileValueStyle}>
                      {researchStudentRow?.weeksCompleted ?? 0} / 8
                    </div>
                    <Progress
                      percent={researchStudentRow?.overallPercent ?? 0}
                      size="small"
                      strokeColor={accent}
                      showInfo={false}
                      style={{ marginTop: 8, marginBottom: 0 }}
                    />
                    <div style={tileCaptionStyle}>
                      {researchStudentRow?.pendingSubmissions ?? 0} pending submission
                      {(researchStudentRow?.pendingSubmissions ?? 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <Card
              size="small"
              title={<><CalendarClock size={16} style={{ marginRight: 8, color: accent }} />Session timeline</>}
              style={panelStyle}
              styles={{ header: headStyle }}
            >
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {adminStudentSessions.length === 0 ? (
                  <li style={{ color: subtextColor, fontSize: 13, padding: '8px 0' }}>
                    No sessions logged yet.
                  </li>
                ) : (
                  adminStudentSessions.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        padding: '10px 0',
                        borderBottom: `1px solid ${dividerColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: labelColor }}>
                          {dayjs(s.dateTime).format('MMM D, YYYY · h:mm A')}
                        </div>
                        {s.description && (
                          <div style={{ color: subtextColor, fontSize: 13, marginTop: 2 }}>
                            {s.description}
                          </div>
                        )}
                      </div>
                      <AcPill variant="cyan">{s.duration}</AcPill>
                    </li>
                  ))
                )}
              </ul>
            </Card>

            <Card
              size="small"
              title={<><BarChart2 size={16} style={{ marginRight: 8, color: accent }} />Curriculum watchlist</>}
              style={panelStyle}
              styles={{ header: headStyle }}
            >
              {adminCurriculumWatchlist.length === 0 ? (
                <p style={{ color: subtextColor, fontSize: 13, margin: 0 }}>
                  No curriculum items yet.
                </p>
              ) : (
                adminCurriculumWatchlist.map((item) => (
                  <div key={item.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: labelColor, fontWeight: 500 }}>{item.label}</span>
                      <span style={{ color: subtextColor }}>{item.percent}%</span>
                    </div>
                    <Progress percent={item.percent} size="small" strokeColor={accent} showInfo={false} />
                    {item.target && (
                      <div style={{ fontSize: 11, color: subtextColor, marginTop: 4 }}>
                        {item.target}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>

            <Card
              size="small"
              title={<><FileText size={16} style={{ marginRight: 8, color: accent }} />Tasks from mentor</>}
              style={panelStyle}
              styles={{ header: headStyle }}
            >
              <Table
                dataSource={adminStudentTasks}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Task', dataIndex: 'task', key: 'task' },
                  {
                    title: 'Deadline',
                    dataIndex: 'deadline',
                    key: 'deadline',
                    width: 140,
                    render: (d: string) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
                  },
                  {
                    title: 'Status',
                    key: 'status',
                    width: 120,
                    render: (_: unknown, r: TaskDto) => (
                      <AcPill variant={taskPillVariant(getTaskStatus(r))}>{getTaskStatus(r)}</AcPill>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              size="small"
              title={<><CheckCircle2 size={16} style={{ marginRight: 8, color: accent }} />Milestone tracker</>}
              style={panelStyle}
              styles={{ header: headStyle }}
            >
              <p style={{ color: subtextColor, fontSize: 12, marginBottom: 8 }}>
                Mentor tracks these milestones for the student.
              </p>
              {adminStudentMilestones.length === 0 ? (
                <p style={{ color: subtextColor, fontSize: 13, margin: 0 }}>
                  No milestones yet.
                </p>
              ) : (
                adminStudentMilestones.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: `1px solid ${dividerColor}`,
                    }}
                  >
                    <div>
                      <div style={{ color: labelColor, fontWeight: 600 }}>{m.label}</div>
                      {m.date && (
                        <span style={{ fontSize: 12, color: subtextColor }}>
                          {dayjs(m.date).format('MMM D, YYYY')}
                        </span>
                      )}
                    </div>
                    {m.done ? <AcPill variant="mint">Done</AcPill> : <AcPill variant="neutral">Pending</AcPill>}
                  </div>
                ))
              )}
            </Card>

            <Card
              size="small"
              title={<><FlaskConical size={16} style={{ marginRight: 8, color: accent }} />Research Prep submissions</>}
              style={panelStyle}
              styles={{ header: headStyle }}
            >
              {researchSubmissionsForStudent.length === 0 ? (
                <p style={{ color: subtextColor, fontSize: 13, margin: 0 }}>
                  No Research Prep submissions yet for this student.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {researchSubmissionsForStudent.map((s) => {
                    const status = s.status;
                    const variant: AcPillVariant =
                      status === 'graded'
                        ? 'mint'
                        : status === 'returned_for_revision'
                          ? 'amber'
                          : status === 'under_review'
                            ? 'amber'
                            : 'cyan';
                    const statusLabel =
                      status === 'graded'
                        ? `Graded · ${s.score}/100`
                        : status === 'returned_for_revision'
                          ? 'Revision requested'
                          : status === 'under_review'
                            ? 'Under review'
                            : 'Submitted';
                    return (
                      <li
                        key={s.id}
                        style={{
                          padding: '10px 0',
                          borderBottom: `1px solid ${dividerColor}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: labelColor }}>
                            <Sparkles size={12} style={{ marginRight: 6, verticalAlign: -1, color: accent }} />
                            Week {s.weekNumber} — {s.weekTitle}
                          </div>
                          <div style={{ fontSize: 12, color: subtextColor, marginTop: 2 }}>
                            {dayjs(s.submittedAt).format('MMM D, YYYY · h:mm A')} · attempt #{s.attemptNumber}
                            {s.fileName ? ` · ${s.fileName}` : ''}
                          </div>
                        </div>
                        <AcPill variant={variant}>{statusLabel}</AcPill>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div style={{ marginTop: 12, fontSize: 12, color: subtextColor }}>
                Submissions from this student route to their assigned mentor's grading inbox.
              </div>
            </Card>

            <Card
              size="small"
              title={<><Globe size={16} style={{ marginRight: 8, color: accent }} />Application tracker</>}
              style={{ ...panelStyle, marginBottom: 0 }}
              styles={{ header: headStyle }}
            >
              <Table
                dataSource={adminStudentPipeline}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Program', dataIndex: 'program', key: 'program' },
                  { title: 'Stage', dataIndex: 'stage', key: 'stage', width: 140 },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: 120,
                    render: (s: string) => <AcPill variant={taskPillVariant(s)}>{s}</AcPill>,
                  },
                  {
                    title: 'Financial aid',
                    dataIndex: 'aid',
                    key: 'aid',
                    width: 130,
                    render: (v: boolean) => (v ? <AcPill variant="mint">Considering</AcPill> : '—'),
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </Modal>
        );
      })()}

      <Card title={<><History size={16} style={{ marginRight: 8, color: accent }} />Recent Mentor–Student Interactions</>} style={{ marginTop: 24 }} className="full-support-card">
        {adminInteractions.length === 0 ? (
          <p style={{ color: muted, padding: '12px 0', margin: 0 }}>No recent interactions yet.</p>
        ) : (
          <>
            <ul className="interactions-list" style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: showAllInteractions ? 400 : undefined, overflowY: showAllInteractions ? 'auto' : undefined }}>
              {(showAllInteractions ? adminInteractions : adminInteractions.slice(0, 4)).map((i) => (
                <li key={i.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span><strong>{i.student}</strong> ↔ <strong>{i.mentor}</strong></span>
                    <span style={{ marginLeft: 8, display: 'inline-block' }}>
                      <AcPill variant={interactionPillVariant(i.type)}>{i.type}</AcPill>
                    </span>
                    <div style={{ color: muted, marginTop: 4 }}>{i.description}</div>
                  </div>
                  <span style={{ color: subtle, whiteSpace: 'nowrap' }}>{dayjs(i.date).format('MMM D, YYYY')}</span>
                </li>
              ))}
            </ul>
            {adminInteractions.length > 4 && (
              <Button type="link" size="small" onClick={() => setShowAllInteractions((v) => !v)} style={{ marginTop: 8, padding: 0 }}>
                {showAllInteractions ? 'Show less' : `View more (${adminInteractions.length - 4} more)`}
              </Button>
            )}
          </>
        )}
      </Card>

      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          onClick={() => navigate(integratedInAdminConsole ? '/new-admin/dashboard' : '/')}
          style={{
            backgroundColor: accent,
            borderColor: accent,
            ...(integratedInAdminConsole ? { color: '#04120c' } : {}),
          }}
        >
          {integratedInAdminConsole ? 'Back to admin dashboard' : 'Back to Home'}
        </Button>
      </div>
    </div>
  );
}
