/**
 * Counselor-specific Dashboard: Student Information + Mentor bookings + Events + Deadlines + Recent Activity
 * Replaces the student-facing Dashboard when counselor views a student's My Journey
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Descriptions, Progress, Timeline, Tag, Empty, Spin, Typography } from 'antd';
import { Space } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { useOrganization } from '../../../context/OrganizationContext';
import { useGetStudentJourneyCollegeApplicationsQuery, useGetStudentJourneyScholarshipApplicationsQuery } from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import StudentDataBookingsCard from './StudentDataBookingsCard';
import UnifiedIcon from 'src/components/common/icons/UnifiedIcon';
import UniversityNameDisplay from 'src/pages/student-hub/applications/components/UniversityNameDisplay';
import type { ApplicationActivityEvent } from 'src/app/services/student-hub/types';
import './CounselorDashboard.scss';

const { Text } = Typography;

interface StudentData {
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  status: string | null;
  enrolledAt: string | null;
  updatedAt: string | null;
  progressPercentage: number | null;
  courseName: string | null;
  courseType: string | null;
}

interface CounselorDashboardProps {
  studentId: string;
  studentName?: string;
}

const CounselorDashboard: React.FC<CounselorDashboardProps> = ({ studentId, studentName }) => {
  const { t } = useTranslation();
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const { data: appsRes } = useGetStudentJourneyCollegeApplicationsQuery(studentId, { skip: !studentId });
  const { data: scholarshipsRes } = useGetStudentJourneyScholarshipApplicationsQuery(studentId, { skip: !studentId });
  const applications = appsRes?.data || [];
  const scholarships = scholarshipsRes?.data || [];

  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (isSuperAdmin && selectedOrganizationId) params.append('organizationId', selectedOrganizationId);
        const dashboardRes = await api.request({ path: `/school-counselor-dashboard?${params}`, method: 'GET', secure: true });
        const enrollments = (dashboardRes.data || []).filter((s: StudentData) => s.userId === studentId);
        if (enrollments.length === 0) {
          setLoading(false);
          return;
        }
        const first = enrollments[0];
        setStudent({
          ...first,
          progressPercentage: Math.round(enrollments.reduce((s: number, e: StudentData) => s + (e.progressPercentage || 0), 0) / enrollments.length),
        });
        try {
          const userRes = await api.request({ path: `/users/user/${studentId}`, method: 'GET', secure: true });
          setUserDetails(userRes.data);
        } catch (_) {}
        const courseData = enrollments
          .filter((e: StudentData) => e.courseName || e.courseType)
          .map((e: StudentData) => ({
            courseName: e.courseName === 'admissions' ? 'Admissions Program' : e.courseName === 'sat' ? 'SAT Prep Course' : (e.courseName || e.courseType || '').toUpperCase(),
            progress: Math.round(e.progressPercentage || 0),
            enrolledDate: e.enrolledAt,
            status: (e.progressPercentage || 0) >= 100 ? 'completed' : (e.progressPercentage || 0) > 0 ? 'in-progress' : 'not-started',
          }));
        setCourses(courseData);
        const acts: any[] = [];
        enrollments.forEach((e: StudentData, i: number) => {
          const cn = e.courseName === 'admissions' ? 'Admissions Program' : e.courseName === 'sat' ? 'SAT Prep Course' : (e.courseName || e.courseType || 'Course').toUpperCase();
          if (e.enrolledAt) acts.push({ id: `enroll-${i}`, message: `enrolled in ${cn}`, timestamp: e.enrolledAt, courseName: cn });
          if (e.progressPercentage && e.progressPercentage > 0) {
            acts.push({ id: `prog-${i}`, message: `reached ${Math.round(e.progressPercentage)}% progress in ${cn}`, timestamp: e.updatedAt || e.enrolledAt || '', courseName: cn });
          }
        });
        setActivities(acts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, selectedOrganizationId, isSuperAdmin, isCounselor]);

  // Must run unconditionally (before any early return) to satisfy Rules of Hooks
  const name = student ? (studentName || student.userName) : '';
  const mergedTimelineItems = useMemo(() => {
    const eventLabel = (ev: ApplicationActivityEvent): string => {
      switch (ev.type) {
        case 'checklist_item_completed':
          return ev.payload?.itemName
            ? `Completed: ${String(ev.payload.itemName)}`
            : 'Checklist item completed';
        case 'status_changed':
          return ev.payload?.to
            ? `Status → ${String(ev.payload.to).replace(/_/g, ' ')}`
            : 'Status updated';
        case 'mentor_assigned':
          return ev.payload?.mentorName
            ? `Mentor assigned: ${String(ev.payload.mentorName)}`
            : 'Mentor assigned';
        default:
          return ev.type.replace(/_/g, ' ');
      }
    };
    const eventIcon = (ev: ApplicationActivityEvent): React.ReactNode => {
      switch (ev.type) {
        case 'checklist_item_completed':
          return <UnifiedIcon name="check-circle" size="sm" color="success" />;
        case 'status_changed':
          return <UnifiedIcon name="edit" size="sm" color="primary" />;
        case 'mentor_assigned':
          return <UnifiedIcon name="users" size="sm" color="primary" />;
        default:
          return <UnifiedIcon name="info-circle" size="sm" color="default" />;
      }
    };

  // Merge course activities and application activities into one sorted timeline
    const items: Array<{
      id: string;
      at: string;
      type: 'course-enrollment' | 'course-progress' | 'application-created' | 'application-activity' | 'scholarship-created';
      label: React.ReactNode;
      dot: React.ReactNode;
      color: 'green' | 'blue';
    }> = [];

    // Add course activities (without student name)
    activities.forEach((a: any) => {
      const isEnrollment = a.message.includes('enrolled');
      const isProgress = a.message.includes('reached');
      
      let label: React.ReactNode;
      if (isEnrollment) {
        const courseName = a.courseName || '';
        label = (
          <>
            <Text strong>{t('schoolCounselor.dashboard.enrolledIn', 'Enrolled in')} </Text>
            <Text strong>{courseName}</Text>
          </>
        );
      } else if (isProgress) {
        const match = a.message.match(/reached (\d+)% progress in (.+)/);
        if (match) {
          const [, percent, courseName] = match;
          label = (
            <>
              <Text>{t('schoolCounselor.dashboard.reachedProgress', 'Reached {{percent}}% progress in', { percent })} </Text>
              <Text strong>{courseName}</Text>
            </>
          );
        } else {
          label = <Text>{a.message.replace(`${name} `, '')}</Text>;
        }
      } else {
        label = <Text>{a.message.replace(`${name} `, '')}</Text>;
      }

      items.push({
        id: a.id,
        at: a.timestamp,
        type: isEnrollment ? 'course-enrollment' : 'course-progress',
        label,
        dot: isEnrollment ? (
          <UnifiedIcon name="plus-circle" size="sm" color="success" />
        ) : (
          <UnifiedIcon name="trending-up" size="sm" color="primary" />
        ),
        color: isEnrollment ? 'green' : 'blue',
      });
    });

    // Add application activities
    applications.forEach((app: any) => {
      items.push({
        id: `created-${app.id}`,
        at: app.createdAt,
        type: 'application-created',
        label: (
          <>
            <Text strong>{t('schoolCounselor.dashboard.added', 'Added')} </Text>
            <Text strong><UniversityNameDisplay universityId={app.universityId} universityName={app.universityName} /></Text>
          </>
        ),
        dot: <UnifiedIcon name="plus-circle" size="sm" color="success" />,
        color: 'green',
      });

      (app.activity || []).forEach((ev: ApplicationActivityEvent, i: number) => {
        const university = (app.universityId || app.universityName) ? (
          <UniversityNameDisplay universityId={app.universityId} universityName={app.universityName} />
        ) : null;
        
        items.push({
          id: `activity-${app.id}-${i}`,
          at: ev.at,
          type: 'application-activity',
          label: (
            <>
              {university && (
                <>
                  <Text strong>{university}</Text>
                  <Text> — </Text>
                </>
              )}
              <Text>{eventLabel(ev)}</Text>
            </>
          ),
          dot: eventIcon(ev),
          color: 'blue',
        });
      });
    });

    // Add scholarship activities
    scholarships.forEach((sch: any) => {
      items.push({
        id: `sch-created-${sch.id}`,
        at: sch.createdAt,
        type: 'scholarship-created',
        label: (
          <>
            <Text strong>{t('schoolCounselor.dashboard.addedScholarship', 'Added scholarship')}: </Text>
            <Text strong>{sch.scholarshipName || t('common.scholarship', 'Scholarship')}</Text>
          </>
        ),
        dot: <UnifiedIcon name="plus-circle" size="sm" color="success" />,
        color: 'green',
      });
    });

    // Sort by date (most recent first)
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [activities, applications, scholarships, name]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return <div style={{ padding: 24 }}>{t('schoolCounselor.dashboard.studentNotFound', 'Student data not found.')}</div>;
  }

  const lastActivity = userDetails?.updatedAt || student.updatedAt || student.enrolledAt;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString() : 'N/A';
  const formatTimelineDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="counselor-dashboard">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title={t('schoolCounselor.dashboard.studentInformation', 'Student Information')} className="info-card">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('common.email', 'Email')}>
                <Space><MailOutlined />{student.userEmail}</Space>
              </Descriptions.Item>
              {student.telegramPhoneNumber && (
                <Descriptions.Item label={t('common.phone', 'Phone')}>
                  <Space><PhoneOutlined />{student.telegramPhoneNumber}</Space>
                </Descriptions.Item>
              )}
              {student.enrolledAt && (
                <Descriptions.Item label={t('schoolCounselor.dashboard.enrollmentDate', 'Enrollment Date')}>
                  <Space><CalendarOutlined />{formatDate(student.enrolledAt)}</Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('schoolCounselor.dashboard.lastActivity', 'Last Activity')}>{formatDateTime(lastActivity)}</Descriptions.Item>
              <Descriptions.Item label={t('schoolCounselor.dashboard.overallProgress', 'Overall Progress')}>
                <Progress percent={Math.round(student.progressPercentage || 0)} strokeColor="#8b0000" />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('schoolCounselor.dashboard.enrolledCourses', 'Enrolled Courses')} style={{ marginTop: 24 }}>
            {courses.length > 0 ? (
              courses.map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{c.courseName}</strong>
                    <Tag color={c.status === 'completed' ? 'green' : 'blue'}>{c.status === 'completed' ? t('common.completed', 'Completed') : t('common.inProgress', 'In-Progress')}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{t('schoolCounselor.dashboard.enrolled', 'Enrolled')} {formatDate(c.enrolledDate)}</div>
                  <Progress percent={c.progress} size="small" />
                </div>
              ))
            ) : (
              <Empty description={t('schoolCounselor.dashboard.noCoursesEnrolled', 'No courses enrolled')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

        </Col>

        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card title={t('schoolCounselor.dashboard.mentorBookings', 'Mentor bookings')}>
                <StudentDataBookingsCard studentUserId={studentId} />
              </Card>
            </Col>
            <Col xs={24}>
              <Card title={t('studentHub.dashboard.activityTimeline', 'Activity timeline')}>
                {mergedTimelineItems.length > 0 ? (
                  <Timeline
                    items={mergedTimelineItems.map((item) => ({
                      color: item.color,
                      dot: item.dot,
                      children: (
                        <div>
                          {item.label}
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTimelineDate(item.at)}
                          </Text>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description={t('schoolCounselor.dashboard.noActivity', 'No activity yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default CounselorDashboard;
