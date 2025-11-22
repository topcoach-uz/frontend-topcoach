import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Spin, Alert } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
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
        path: `/b2b-dashboard?${params.toString()}`,
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
        path: `/b2b-dashboard/analytics?${params.toString()}`,
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
        <div style={{ marginTop: 16 }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!isSuperAdmin && !isCounselor) {
    return (
      <Alert
        message="Access Denied"
        description="You need to be a counselor or SuperAdmin to access this page."
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
  
  // Count students with access (paymentStatus and status both completed) - unique students
  const studentsWithAccessSet = new Set(
    data
      .filter(s => s.status === 'completed' && s.paymentStatus === 'completed')
      .map(s => s.userId)
  );
  const studentsWithAccess = studentsWithAccessSet.size;
  
  // Calculate average progress from all enrollments with access
  const enrollmentsWithProgress = data.filter(
    s => s.status === 'completed' && s.paymentStatus === 'completed' && s.progressPercentage !== null
  );
  const averageProgress = enrollmentsWithProgress.length > 0
    ? Math.round(enrollmentsWithProgress.reduce((sum, s) => sum + (s.progressPercentage || 0), 0) / enrollmentsWithProgress.length)
    : Math.round(analytics?.averageProgress || 0);
  
  const activeStudents = studentsWithAccess;

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
      title: 'Student',
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
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      render: (course: string) => {
        if (!course) return 'N/A';
        // Map course names to display names
        const courseDisplay = course.toLowerCase() === 'admissions' 
          ? 'Admissions Program' 
          : course.toLowerCase() === 'sat' 
          ? 'SAT Prep Course' 
          : course.toUpperCase();
        const color = course.toLowerCase() === 'admissions' ? 'blue' : course.toLowerCase() === 'sat' ? 'purple' : 'default';
        return <Tag color={color}>{courseDisplay}</Tag>;
      },
    },
    {
      title: 'Enrolled At',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Progress',
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
    <div className="b2b-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening with your students.</p>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} className="metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Total Students"
              value={totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#8b0000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Students with Access"
              value={studentsWithAccess}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Active Students"
              value={activeStudents}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Average Progress"
              value={averageProgress}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        {/* Recent Enrollments */}
        <Col xs={24}>
          <Card
            title="Recent Enrollments"
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
        <Col xs={24} lg={12}>
          <Card title="Students Needing Attention" className="attention-card">
            {studentsNeedingAttention.length > 0 ? (
              studentsNeedingAttention.map((student, index) => {
                const courseDisplay = student.courseName === 'admissions' 
                  ? 'Admissions Program' 
                  : student.courseName === 'sat' 
                  ? 'SAT Prep Course' 
                  : student.courseName?.toUpperCase() || 'N/A';
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
              <div className="empty-state">All students are on track! 🎉</div>
            )}
          </Card>
        </Col>

        {/* Course Breakdown */}
        <Col xs={24} lg={12}>
          <Card title="Course Breakdown" className="courses-card">
            {analytics?.courseNameBreakdown && analytics.courseNameBreakdown.length > 0 ? (
              <>
                <div style={{ marginBottom: 16, fontSize: '14px', color: '#6b7280' }}>
                  {totalStudents} student{totalStudents !== 1 ? 's' : ''} with {totalEnrollments} enrollment{totalEnrollments !== 1 ? 's' : ''}
                </div>
                {analytics.courseNameBreakdown.map((item: any) => {
                  const courseDisplay = item.courseName === 'admissions' 
                    ? 'Admissions Program' 
                    : item.courseName === 'sat' 
                    ? 'SAT Prep Course' 
                    : item.courseName?.toUpperCase() || 'N/A';
                  const color = item.courseName === 'admissions' ? 'blue' : item.courseName === 'sat' ? 'purple' : 'default';
                  const strokeColor = item.courseName === 'admissions' ? '#1890ff' : item.courseName === 'sat' ? '#722ed1' : '#8b0000';
                  return (
                    <div key={item.courseName} className="course-item">
                      <div className="course-header">
                        <h4>{courseDisplay}</h4>
                        <Tag color={color}>
                          {item.count} enrollment{item.count !== 1 ? 's' : ''}
                        </Tag>
                      </div>
                      <Progress
                        percent={totalEnrollments > 0 ? Math.round((item.count / totalEnrollments) * 100) : 0}
                        strokeColor={strokeColor}
                        showInfo={false}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="empty-state">No course data available</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
