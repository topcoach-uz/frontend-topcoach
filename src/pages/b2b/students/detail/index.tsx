import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Avatar, Tag, Progress, Timeline, Descriptions, Button, Space } from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { getStudentById, mockActivities } from '../../data/mockData';
import './detail.scss';

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const student = id ? getStudentById(id) : undefined;

  if (!student) {
    return (
      <div className="student-detail">
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Student not found</h2>
            <Button onClick={() => navigate('/b2b/students')}>Back to Students</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Get activities for this student
  const studentActivities = mockActivities
    .filter((activity) => activity.studentId === student.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'blue',
      inactive: 'default',
      completed: 'green',
      pending: 'orange',
    };
    return colors[status] || 'default';
  };

  const getCourseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'in-progress': 'blue',
      completed: 'green',
      'not-started': 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <div className="student-detail">
      <div className="detail-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/b2b/students')}
          style={{ marginBottom: 16 }}
        >
          Back to Students
        </Button>
        <div className="header-content">
          <Avatar size={80} icon={<TeamOutlined />} style={{ backgroundColor: '#8b0000' }} />
          <div className="header-info">
            <h1>{student.name}</h1>
            <Space>
              <Tag color={getStatusColor(student.status)} style={{ textTransform: 'capitalize', fontSize: 14 }}>
                {student.status}
              </Tag>
              <span style={{ color: '#6b7280' }}>Enrolled {new Date(student.enrollmentDate).toLocaleDateString()}</span>
            </Space>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Student Info */}
        <Col xs={24} lg={8}>
          <Card title="Student Information" className="info-card">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {student.email}
                </Space>
              </Descriptions.Item>
              {student.phone && (
                <Descriptions.Item label="Phone">
                  <Space>
                    <PhoneOutlined />
                    {student.phone}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Organization">
                {student.organization}
              </Descriptions.Item>
              <Descriptions.Item label="Enrollment Date">
                <Space>
                  <CalendarOutlined />
                  {new Date(student.enrollmentDate).toLocaleDateString()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Activity">
                {new Date(student.lastActivity).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Overall Progress">
                <Progress
                  percent={student.totalProgress}
                  strokeColor={student.totalProgress >= 80 ? '#52c41a' : student.totalProgress >= 50 ? '#faad14' : '#ff4d4f'}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Quick Stats */}
          <Card title="Quick Stats" className="stats-card" style={{ marginTop: 24 }}>
            <div className="stat-item">
              <div className="stat-label">
                <TrophyOutlined /> Enrolled Courses
              </div>
              <div className="stat-value">{student.enrolledCourses.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">
                <CheckCircleOutlined /> Completed Courses
              </div>
              <div className="stat-value">
                {student.enrolledCourses.filter((c) => c.status === 'completed').length}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">
                <ClockCircleOutlined /> In Progress
              </div>
              <div className="stat-value">
                {student.enrolledCourses.filter((c) => c.status === 'in-progress').length}
              </div>
            </div>
          </Card>
        </Col>

        {/* Courses & Progress */}
        <Col xs={24} lg={16}>
          <Card title="Enrolled Courses" className="courses-card">
            {student.enrolledCourses.length > 0 ? (
              <div className="courses-list">
                {student.enrolledCourses.map((course) => (
                  <div key={course.courseId} className="course-item">
                    <div className="course-header">
                      <div>
                        <h3>{course.courseName}</h3>
                        <Space>
                          <Tag color={getCourseStatusColor(course.status)} style={{ textTransform: 'capitalize' }}>
                            {course.status}
                          </Tag>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>
                            Enrolled {new Date(course.enrolledDate).toLocaleDateString()}
                          </span>
                          {course.completedDate && (
                            <span style={{ color: '#52c41a', fontSize: 12 }}>
                              Completed {new Date(course.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </Space>
                      </div>
                    </div>
                    <div className="course-progress">
                      <div className="progress-info">
                        <span>Progress: {course.progress}%</span>
                        <span>
                          {course.lessonsCompleted} of {course.totalLessons} lessons completed
                        </span>
                      </div>
                      <Progress
                        percent={course.progress}
                        strokeColor={course.progress >= 80 ? '#52c41a' : course.progress >= 50 ? '#faad14' : '#ff4d4f'}
                        showInfo={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No courses enrolled</div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card title="Activity Timeline" className="timeline-card" style={{ marginTop: 24 }}>
            {studentActivities.length > 0 ? (
              <Timeline>
                {studentActivities.map((activity) => (
                  <Timeline.Item
                    key={activity.id}
                    color={
                      activity.type === 'completion'
                        ? 'green'
                        : activity.type === 'progress'
                        ? 'blue'
                        : activity.type === 'enrollment'
                        ? 'orange'
                        : 'purple'
                    }
                  >
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{activity.studentName}</strong>
                        <span className="timeline-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="timeline-message">
                        {activity.courseName && (
                          <Tag color="blue" style={{ marginRight: 8 }}>
                            {activity.courseName}
                          </Tag>
                        )}
                        {activity.message}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div className="empty-state">No recent activity</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDetailPage;
