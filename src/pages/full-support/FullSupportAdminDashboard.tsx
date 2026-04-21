import React, { useState } from 'react';
import { Card, Table, Button, Alert, Row, Col, Statistic, Modal, Progress, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { User, Clock, FileText, Target, Users, ClipboardList, CalendarClock, BarChart2, CheckCircle2, Globe, History, Rocket } from 'lucide-react';
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
import './full-support.scss';

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

      <Modal
        title={`Full Support progress: ${selectedStudent?.name ?? ''}`}
        open={!!selectedStudent}
        onCancel={() => setSelectedStudent(null)}
        footer={
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
        }
        width={720}
        styles={{ body: { maxHeight: '75vh', overflow: 'auto' } }}
      >
        {selectedStudent && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#666', marginBottom: 16 }}>Track your mentorship sessions, applications, and deadlines.</p>
            <Card size="small" title={<><CalendarClock size={16} style={{ marginRight: 8, color: accent }} />Session timeline</>} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>This month</span>
                  <span>{adminStudentUsedHours}h used / {adminStudentAllocatedHours}h allocated</span>
                </div>
                <Progress percent={adminStudentAllocatedHours > 0 ? Math.round((adminStudentUsedHours / adminStudentAllocatedHours) * 100) : 0} size="small" strokeColor={accent} showInfo={false} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {adminStudentSessions.length === 0 ? (
                  <li style={{ color: '#666', fontSize: 13, padding: '8px 0' }}>No sessions logged yet.</li>
                ) : (
                  adminStudentSessions.map((s) => (
                    <li key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{dayjs(s.dateTime).format('MMM D, YYYY h:mm A')}</div>
                        <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{s.description}</div>
                      </div>
                      <AcPill variant="cyan">{s.duration}</AcPill>
                    </li>
                  ))
                )}
              </ul>
            </Card>
            <Card size="small" title={<><BarChart2 size={16} style={{ marginRight: 8, color: accent }} />Curriculum Watchlist</>} style={{ marginBottom: 16 }}>
              {adminCurriculumWatchlist.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>No curriculum items yet.</p>
              ) : (
                adminCurriculumWatchlist.map((item) => (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <Progress percent={item.percent} size="small" strokeColor={accent} showInfo={false} />
                    {item.target && <div style={{ fontSize: 11, color: '#666' }}>{item.target}</div>}
                  </div>
                ))
              )}
            </Card>
            <Card size="small" title={<><FileText size={16} style={{ marginRight: 8, color: accent }} />Tasks from mentor</>} style={{ marginBottom: 16 }}>
              <Table
                dataSource={adminStudentTasks}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'TASK', dataIndex: 'task', key: 'task', width: 180 },
                  { title: 'DEADLINE', dataIndex: 'deadline', key: 'deadline', width: 110, render: (d: string) => d ? dayjs(d).format('MMM D, YYYY') : '-' },
                  {
                    title: 'STATUS',
                    key: 'status',
                    width: 110,
                    render: (_: unknown, r: TaskDto) => (
                      <AcPill variant={taskPillVariant(getTaskStatus(r))}>{getTaskStatus(r)}</AcPill>
                    ),
                  },
                ]}
              />
            </Card>
            <Card size="small" title={<><CheckCircle2 size={16} style={{ marginRight: 8, color: accent }} />Milestone Tracker</>} style={{ marginBottom: 16 }}>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Mentor tracks these milestones for the student.</p>
              {adminStudentMilestones.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>No milestones yet.</p>
              ) : (
                adminStudentMilestones.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div><strong>{m.label}</strong></div>
                      {m.date && <span style={{ fontSize: 12, color: '#666' }}>{dayjs(m.date).format('MMM D, YYYY')}</span>}
                    </div>
                    {m.done ? <AcPill variant="mint">Done</AcPill> : <AcPill variant="neutral">Pending</AcPill>}
                  </div>
                ))
              )}
            </Card>
            <Card size="small" title={<><Globe size={16} style={{ marginRight: 8, color: accent }} />Application tracker</>} style={{ marginBottom: 8 }}>
              <Table
                dataSource={adminStudentPipeline}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'PROGRAM', dataIndex: 'program', key: 'program', width: 200 },
                  { title: 'STAGE', dataIndex: 'stage', key: 'stage', width: 120 },
                  {
                    title: 'STATUS',
                    dataIndex: 'status',
                    key: 'status',
                    width: 100,
                    render: (s: string) => <AcPill variant={taskPillVariant(s)}>{s}</AcPill>,
                  },
                  {
                    title: 'FINANCIAL AID',
                    dataIndex: 'aid',
                    key: 'aid',
                    width: 100,
                    render: (v: boolean) => (v ? <AcPill variant="mint">Considering</AcPill> : '-'),
                  },
                ]}
              />
            </Card>
            <Button
              type="link"
              size="small"
              loading={weeklyReportDownloading}
              onClick={async () => {
                try {
                  const res = await fetchWeeklyReport(selectedStudent.id).unwrap();
                  if (res?.data) generateWeeklyReportPdf(res.data);
                  else message.error('Could not load report.');
                } catch {
                  message.error('Could not load report.');
                }
              }}
              style={{ marginTop: 12, padding: 0 }}
            >
              Download {selectedStudent.name}&apos;s weekly report
            </Button>
          </div>
        )}
      </Modal>

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
