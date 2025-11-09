import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Avatar, Progress } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { mockStudents, mockCourses, mockActivities, mockOrganization } from '../data/mockData';
import type { ColumnsType } from 'antd/es/table';
import './dashboard.scss';

const DashboardPage: React.FC = () => {
  // Calculate metrics
  const totalStudents = mockStudents.length;
  const activeStudents = mockStudents.filter(s => s.status === 'active').length;
  const completedStudents = mockStudents.filter(s => s.status === 'completed').length;
  const averageProgress = Math.round(
    mockStudents.reduce((sum, s) => sum + s.totalProgress, 0) / totalStudents
  );
  const totalEnrollments = mockStudents.reduce(
    (sum, s) => sum + s.enrolledCourses.length,
    0
  );

  // Recent activities for table
  const recentActivities = mockActivities.slice(0, 5).map(activity => {
    const student = mockStudents.find(s => s.id === activity.studentId);
    return {
      key: activity.id,
      student: student?.name || activity.studentName,
      activity: activity.message,
      course: activity.courseName || '-',
      time: new Date(activity.timestamp).toLocaleString(),
      type: activity.type,
    };
  });

  const activityColumns: ColumnsType<any> = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      render: (text) => (
        <span>{text}</span>
      ),
    },
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 180,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          enrollment: 'blue',
          completion: 'green',
          progress: 'orange',
          assignment: 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
  ];

  // Top performing courses
  const topCourses = [...mockCourses]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 3);

  // Students needing attention (low progress)
  const studentsNeedingAttention = mockStudents
    .filter(s => s.status === 'active' && s.totalProgress < 50)
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
            <div className="metric-change positive">
              <ArrowUpOutlined /> +12% from last month
            </div>
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
            <div className="metric-change positive">
              <ArrowUpOutlined /> {Math.round((activeStudents / totalStudents) * 100)}% of total
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Completed"
              value={completedStudents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="metric-change positive">
              <ArrowUpOutlined /> {Math.round((completedStudents / totalStudents) * 100)}% completion rate
            </div>
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
            />
            <div className="metric-change positive">
              <ArrowUpOutlined /> +5% from last week
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        {/* Recent Activity */}
        <Col xs={24} lg={16}>
          <Card
            title="Recent Activity"
            className="activity-card"
            extra={<a href="#more">View all</a>}
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} lg={8}>
          <Card title="Quick Stats" className="stats-card">
            <div className="stat-item">
              <div className="stat-label">Total Enrollments</div>
              <div className="stat-value">{totalEnrollments}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Active Courses</div>
              <div className="stat-value">{mockCourses.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Organization</div>
              <div className="stat-value">{mockOrganization.name}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Subscription Plan</div>
              <div className="stat-value">
                <Tag color="blue">{mockOrganization.subscriptionPlan}</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        {/* Top Performing Courses */}
        <Col xs={24} lg={12}>
          <Card title="Top Performing Courses" className="courses-card">
            {topCourses.map((course) => (
              <div key={course.id} className="course-item">
                <div className="course-header">
                  <h4>{course.name}</h4>
                  <Tag color="green">{course.completionRate}%</Tag>
                </div>
                <div className="course-stats">
                  <span>{course.enrolledStudents} students</span>
                  <span>•</span>
                  <span>{course.totalLessons} lessons</span>
                </div>
                <Progress
                  percent={course.completionRate}
                  strokeColor="#52c41a"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* Students Needing Attention */}
        <Col xs={24} lg={12}>
          <Card title="Students Needing Attention" className="attention-card">
            {studentsNeedingAttention.length > 0 ? (
              studentsNeedingAttention.map((student) => (
                <div key={student.id} className="student-item">
                  <div className="student-info">
                    <div>
                      <div className="student-name">{student.name}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                  </div>
                  <div className="student-progress">
                    <Progress
                      percent={student.totalProgress}
                      size="small"
                      strokeColor="#faad14"
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">All students are on track! 🎉</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

