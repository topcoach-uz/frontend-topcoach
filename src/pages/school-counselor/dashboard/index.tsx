import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Spin, Alert } from 'antd';
import { Users, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import type { ColumnsType } from 'antd/es/table';
import './dashboard.scss';

interface DashboardData {
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null; // Keep for backward compatibility
  courseName: string | null; // Admissions or SAT
  amount: number | null;
  paymentStatus: string | null;
  status: string | null;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessGrantedAt: string | null;
  progressPercentage: number | null;
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    // For counselors, fetch immediately (they always have an organization)
    // For SuperAdmins, only fetch if an organization is selected
    if (isCounselor || (isSuperAdmin && selectedOrganizationId)) {
      fetchData();
      fetchAnalytics();
    }
  }, [selectedOrganizationId, isCounselor, isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedOrganizationId) {
        params.append('organizationId', selectedOrganizationId);
      }
      
      const response = await api.request({
        path: `/school-counselor-dashboard?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      setData(response.data || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedOrganizationId) {
        params.append('organizationId', selectedOrganizationId);
      }
      
      const response = await api.request({
        path: `/school-counselor-dashboard/analytics?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>{t('schoolCounselor.dashboard.loading', 'Loading dashboard...')}</div>
      </div>
    );
  }

  if (!isSuperAdmin && !isCounselor) {
    return (
      <Alert
        message={t('schoolCounselor.dashboard.accessDenied', 'Access Denied')}
        description={t('schoolCounselor.dashboard.accessDeniedDesc', 'You need to be a counselor or SuperAdmin to access this page.')}
        type="error"
        showIcon
      />
    );
  }

  // Calculate metrics - count unique students
  const uniqueStudentIds = new Set(data.map(d => d.userId));
  const totalStudents = uniqueStudentIds.size;
  
  // Count total enrollments
  const totalEnrollments = data.filter(d => d.courseName).length;
  
  // Use average progress from backend analytics to ensure consistency
  const averageProgress = analytics?.averageProgress || 0;

  // Recent enrollments for table
  const recentEnrollments = data
    .filter(d => d.enrolledAt)
    .sort((a, b) => new Date(b.enrolledAt!).getTime() - new Date(a.enrolledAt!).getTime())
    .slice(0, 5)
    .map((item, index) => ({
      key: index,
      student: item.userName,
      email: item.userEmail,
      course: item.courseName || item.courseType || 'N/A', // Prefer courseName, fallback to courseType
      enrolledAt: item.enrolledAt,
      progress: Math.round(item.progressPercentage || 0),
    }));

  const enrollmentColumns: ColumnsType<any> = [
    {
      title: t('schoolCounselor.dashboard.student', 'Student'),
      dataIndex: 'student',
      key: 'student',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: t('schoolCounselor.dashboard.course', 'Course'),
      dataIndex: 'course',
      key: 'course',
      render: (course: string) => {
        if (!course) return t('common.notAvailable', 'N/A');
        const courseDisplay = course.toLowerCase() === 'admissions' 
          ? t('schoolCounselor.dashboard.admissionsProgram', 'Admissions Program')
          : course.toLowerCase() === 'sat' 
          ? t('schoolCounselor.dashboard.satPrepCourse', 'SAT Prep Course')
          : course.toUpperCase();
        const color = course.toLowerCase() === 'admissions' ? 'blue' : course.toLowerCase() === 'sat' ? 'purple' : 'default';
        return <Tag color={color}>{courseDisplay}</Tag>;
      },
    },
    {
      title: t('schoolCounselor.dashboard.enrolledAt', 'Enrolled At'),
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('schoolCounselor.dashboard.progress', 'Progress'),
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
  ];

  // Students needing attention (low progress) - show all enrollments with low progress
  const studentsNeedingAttention = data
    .filter(s => s.progressPercentage !== null && s.progressPercentage < 50 && s.status === 'completed' && s.courseName)
    .slice(0, 5);

  return (
    <div className="school-counselor-dashboard">
      <div className="dashboard-header">
        <h1>{t('schoolCounselor.dashboard.title', 'Dashboard')}</h1>
        <p className="dashboard-subtitle">{t('schoolCounselor.dashboard.subtitle', 'Welcome back! Here\'s what\'s happening with your students.')}</p>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} className="metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title={t('schoolCounselor.dashboard.totalStudents', 'Total Students')}
              value={totalStudents}
              prefix={<Users size={16} />}
              valueStyle={{ color: '#8b0000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title={t('schoolCounselor.dashboard.averageProgress', 'Average Progress')}
              value={averageProgress}
              suffix="%"
              prefix={<Trophy size={16} />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        {/* Recent Enrollments */}
        <Col xs={24}>
          <Card
            title={t('schoolCounselor.dashboard.recentEnrollments', 'Recent Enrollments')}
            className="activity-card"
          >
            <Table
              columns={enrollmentColumns}
              dataSource={recentEnrollments}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        {/* Students Needing Attention */}
        <Col xs={24}>
          <Card title={t('schoolCounselor.dashboard.studentsNeedingAttention', 'Students Needing Attention')} className="attention-card">
            {studentsNeedingAttention.length > 0 ? (
              studentsNeedingAttention.map((student, index) => {
                const courseDisplay = student.courseName === 'admissions' 
                  ? t('schoolCounselor.dashboard.admissionsProgram', 'Admissions Program')
                  : student.courseName === 'sat' 
                  ? t('schoolCounselor.dashboard.satPrepCourse', 'SAT Prep Course')
                  : student.courseName?.toUpperCase() || t('common.notAvailable', 'N/A');
                return (
                  <div key={`${student.userId}-${student.courseName}-${index}`} className="student-item">
                    <div className="student-info">
                      <div>
                        <div className="student-name">{student.userName}</div>
                        <div className="student-email">{student.userEmail}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={student.courseName === 'admissions' ? 'blue' : student.courseName === 'sat' ? 'purple' : 'default'} style={{ fontSize: '11px' }}>
                            {courseDisplay}
                          </Tag>
                        </div>
                      </div>
                    </div>
                    <div className="student-progress">
                      <Progress
                        percent={Math.round(student.progressPercentage || 0)}
                        size="small"
                        strokeColor="#faad14"
                        format={(percent) => `${Math.round(percent || 0)}%`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">{t('schoolCounselor.dashboard.allStudentsOnTrack', 'All students are on track! 🎉')}</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
