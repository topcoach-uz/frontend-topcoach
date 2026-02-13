/**
 * Counselor-specific Dashboard: Student Information + Mentor bookings + Events + Deadlines + Recent Activity
 * Replaces the student-facing Dashboard when counselor views a student's My Journey
 */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Descriptions, Progress, Timeline, Tag, Button, Empty, Tabs, List, Spin } from 'antd';
import { Space } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useOrganization } from '../../../context/OrganizationContext';
import { useGetStudentJourneyCollegeApplicationsQuery, useGetStudentJourneyScholarshipApplicationsQuery } from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import StudentDataBookingsCard from './StudentDataBookingsCard';
import GlobalActivityTimeline from 'src/pages/student-hub/applications/components/GlobalActivityTimeline';
import UnifiedIcon from 'src/components/common/icons/UnifiedIcon';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import './CounselorDashboard.scss';

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

const UniversityNameDisplay: React.FC<{ universityId?: string; universityName?: string }> = ({ universityId, universityName }) => {
  const { data: university, isLoading } = useGetUniversityDetailQuery(universityId || '', { skip: !universityId });
  if (universityId && isLoading) return <span>Loading...</span>;
  if (universityId && university) return <>{getTranslation(university.name) || universityName || 'Unknown'}</>;
  return <>{universityName || 'Unknown'}</>;
};

const CounselorDashboard: React.FC<CounselorDashboardProps> = ({ studentId, studentName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          if (e.enrolledAt) acts.push({ id: `enroll-${i}`, message: `${first.userName} enrolled in ${cn}`, timestamp: e.enrolledAt, courseName: cn });
          if (e.progressPercentage && e.progressPercentage > 0) {
            acts.push({ id: `prog-${i}`, message: `${first.userName} reached ${Math.round(e.progressPercentage)}% progress in ${cn}`, timestamp: e.updatedAt || e.enrolledAt || '', courseName: cn });
          }
        });
        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(acts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, selectedOrganizationId, isSuperAdmin, isCounselor]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return <div style={{ padding: 24 }}>Student data not found.</div>;
  }

  const name = studentName || student.userName;
  const lastActivity = userDetails?.updatedAt || student.updatedAt || student.enrolledAt;

  // Upcoming deadlines from applications + scholarships
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = [
    ...applications.filter((a: any) => a.deadline && new Date(a.deadline) >= now && new Date(a.deadline) <= in14Days).map((a: any) => ({ ...a, type: 'application', deadlineDate: a.deadline })),
    ...scholarships.filter((s: any) => s.applicationDeadline && new Date(s.applicationDeadline) >= now && new Date(s.applicationDeadline) <= in14Days).map((s: any) => ({ ...s, type: 'scholarship', deadlineDate: s.applicationDeadline })),
  ].sort((a: any, b: any) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime()).slice(0, 5);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString() : 'N/A';

  return (
    <div className="counselor-dashboard">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="Student Information" className="info-card">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">
                <Space><MailOutlined />{student.userEmail}</Space>
              </Descriptions.Item>
              {student.telegramPhoneNumber && (
                <Descriptions.Item label="Phone">
                  <Space><PhoneOutlined />{student.telegramPhoneNumber}</Space>
                </Descriptions.Item>
              )}
              {student.enrolledAt && (
                <Descriptions.Item label="Enrollment Date">
                  <Space><CalendarOutlined />{formatDate(student.enrolledAt)}</Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Last Activity">{formatDateTime(lastActivity)}</Descriptions.Item>
              <Descriptions.Item label="Overall Progress">
                <Progress percent={Math.round(student.progressPercentage || 0)} strokeColor="#8b0000" />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Enrolled Courses" style={{ marginTop: 24 }}>
            {courses.length > 0 ? (
              courses.map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{c.courseName}</strong>
                    <Tag color={c.status === 'completed' ? 'green' : 'blue'}>{c.status === 'completed' ? 'Completed' : 'In-Progress'}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Enrolled {formatDate(c.enrolledDate)}</div>
                  <Progress percent={c.progress} size="small" />
                </div>
              ))
            ) : (
              <Empty description="No courses enrolled" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card title="Activity Timeline" style={{ marginTop: 24 }}>
            {activities.length > 0 ? (
              <Timeline>
                {activities.map((a: any) => (
                  <Timeline.Item key={a.id} color="blue">
                    <div><strong>{name}</strong> <span style={{ fontSize: 12, color: '#666' }}>{formatDateTime(a.timestamp)}</span></div>
                    {a.courseName && <Tag color="blue">{a.courseName}</Tag>} {a.message}
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card title="Mentor bookings">
                <StudentDataBookingsCard studentUserId={studentId} />
              </Card>
            </Col>
            <Col xs={24}>
              <Card title={t('studentHub.dashboard.upcomingDeadlines', 'Upcoming Deadlines')}>
                {upcomingDeadlines.length > 0 ? (
                  <List
                    dataSource={upcomingDeadlines}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div>
                          <div><UniversityNameDisplay universityId={item.universityId} universityName={item.universityName || item.scholarshipName} /></div>
                          {item.major && <div style={{ fontSize: 12, color: '#666' }}>{item.major}</div>}
                          <div style={{ fontSize: 12 }}>{formatDate(item.deadlineDate)}</div>
                        </div>
                        <Tag color={item.type === 'scholarship' ? 'purple' : 'blue'}>{item.type === 'scholarship' ? 'Scholarship' : 'University'}</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No upcoming deadlines" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <Button type="link" onClick={() => navigate(`/school-counselor/students/${studentId}/my-journey`)}>Add to List</Button>
                  </Empty>
                )}
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="Recent Activity">
                <GlobalActivityTimeline
                  applications={applications}
                  scholarships={scholarships}
                  emptyMessage="No activity yet"
                  onApplicationClick={(appId) => navigate(`/school-counselor/students/${studentId}/my-journey`)}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default CounselorDashboard;
