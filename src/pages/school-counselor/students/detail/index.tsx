import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Avatar, Tag, Progress, Timeline, Descriptions, Button, Space, Spin, Alert } from 'antd';
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
import { api } from 'src/app/api';
import { useOrganization } from '../../context/OrganizationContext';
import './detail.scss';

interface StudentData {
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null;
  courseName: string | null;
  paymentStatus: string | null;
  status: string | null;
  enrolledAt: string | null;
  updatedAt: string | null;
  progressPercentage: number | null;
  organizationId?: string | null;
}

interface CourseProgress {
  courseName: string;
  courseType: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledDate: string;
  status: string;
}

interface Activity {
  id: string;
  message: string;
  timestamp: string;
  courseName?: string;
}

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id, selectedOrganizationId, isCounselor]);

  const fetchStudentData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch student from School Counselor dashboard
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedOrganizationId) {
        params.append('organizationId', selectedOrganizationId);
      }
      
      const dashboardResponse = await api.request({
        path: `/school-counselor-dashboard?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      
      // Get all enrollments for this student
      const studentEnrollments = dashboardResponse.data?.filter((s: StudentData) => s.userId === id) || [];
      
      if (studentEnrollments.length === 0) {
        setLoading(false);
        return;
      }
      
      // Use the first enrollment for basic student info
      const firstEnrollment = studentEnrollments[0];
      setStudent({
        ...firstEnrollment,
        // Calculate overall progress across all courses
        progressPercentage: studentEnrollments.length > 0
          ? Math.round(studentEnrollments.reduce((sum: number, e: StudentData) => sum + (e.progressPercentage || 0), 0) / studentEnrollments.length)
          : firstEnrollment.progressPercentage,
      });

      // Fetch user details
      try {
        const userResponse = await api.request({
          path: `/users/user/${id}`,
          method: 'GET',
          secure: true,
        });
        setUserDetails(userResponse.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }

      // Set course data from all enrollments
      const courseData: CourseProgress[] = studentEnrollments
        .filter((e: StudentData) => e.courseName || e.courseType)
        .map((enrollment: StudentData) => {
          const courseName = enrollment.courseName 
            ? (enrollment.courseName === 'admissions' ? 'Admissions Program' : enrollment.courseName === 'sat' ? 'SAT Prep Course' : enrollment.courseName.toUpperCase())
            : enrollment.courseType 
            ? `${enrollment.courseType.toUpperCase()} Course`
            : 'Unknown Course';
          
          // Status should be based on actual progress, not just enrollment status
          const progress = Math.round(enrollment.progressPercentage || 0);
          const status = progress >= 100 
            ? 'completed' 
            : progress > 0 
            ? 'in-progress' 
            : 'not-started';
          
          return {
            courseName,
            courseType: enrollment.courseType || enrollment.courseName || 'unknown',
            progress,
            lessonsCompleted: 0,
            totalLessons: 0,
            enrolledDate: enrollment.enrolledAt || new Date().toISOString(),
            status,
          };
        });
      setCourses(courseData);

      // Generate activities from all enrollments
      const mockActivities: Activity[] = [];
      studentEnrollments.forEach((enrollment: StudentData, index: number) => {
        const courseName = enrollment.courseName 
          ? (enrollment.courseName === 'admissions' ? 'Admissions Program' : enrollment.courseName === 'sat' ? 'SAT Prep Course' : enrollment.courseName.toUpperCase())
          : enrollment.courseType 
          ? `${enrollment.courseType.toUpperCase()} Course`
          : 'Course';
        
        if (enrollment.enrolledAt) {
          mockActivities.push({
            id: `enroll-${index}`,
            message: `${firstEnrollment.userName} enrolled in ${courseName}`,
            timestamp: enrollment.enrolledAt,
            courseName,
          });
        }
        if (enrollment.progressPercentage && enrollment.progressPercentage > 0) {
          mockActivities.push({
            id: `progress-${index}`,
            message: `${firstEnrollment.userName} reached ${Math.round(enrollment.progressPercentage || 0)}% progress in ${courseName}`,
            timestamp: enrollment.updatedAt || new Date().toISOString(),
            courseName,
          });
        }
      });
      
      // Sort activities by timestamp
      mockActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(mockActivities);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-detail">
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading student details...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-detail">
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Student not found</h2>
            <Button onClick={() => navigate('/school-counselor/students')}>Back to Students</Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      active: 'blue',
      inactive: 'default',
      completed: 'green',
      pending: 'orange',
      connected: 'green',
    };
    return colors[status || ''] || 'default';
  };

  const getCourseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'in-progress': 'blue',
      completed: 'green',
      'not-started': 'default',
    };
    return colors[status] || 'default';
  };

  const studentStatus = student.status === 'completed' && student.paymentStatus === 'completed' 
    ? 'active' 
    : student.status || 'inactive';

  return (
    <div className="student-detail">
      <div className="detail-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/school-counselor/students')}
          style={{ marginBottom: 16 }}
        >
          Back to Students
        </Button>
        <div className="header-content">
          <Avatar size={80} icon={<TeamOutlined />} style={{ backgroundColor: '#8b0000' }} />
          <div className="header-info">
            <h1>{student.userName}</h1>
            <Space>
              <Tag color={getStatusColor(studentStatus)} style={{ textTransform: 'capitalize', fontSize: 14 }}>
                {studentStatus}
              </Tag>
              {student.enrolledAt && (
                <span style={{ color: '#6b7280' }}>
                  Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                </span>
              )}
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
                  {student.userEmail}
                </Space>
              </Descriptions.Item>
              {student.telegramPhoneNumber && (
                <Descriptions.Item label="Phone">
                  <Space>
                    <PhoneOutlined />
                    {student.telegramPhoneNumber}
                  </Space>
                </Descriptions.Item>
              )}
              {userDetails?.profile?.organization && (
                <Descriptions.Item label="Organization">
                  {userDetails.profile.organization}
                </Descriptions.Item>
              )}
              {student.enrolledAt && (
                <Descriptions.Item label="Enrollment Date">
                  <Space>
                    <CalendarOutlined />
                    {new Date(student.enrolledAt).toLocaleDateString()}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Last Activity">
                {student.enrolledAt ? new Date(student.enrolledAt).toLocaleString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Overall Progress">
                <Progress
                  percent={Math.round(student.progressPercentage || 0)}
                  strokeColor={student.progressPercentage && Math.round(student.progressPercentage) >= 80 ? '#52c41a' : student.progressPercentage && Math.round(student.progressPercentage) >= 50 ? '#faad14' : '#ff4d4f'}
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
              <div className="stat-value">{courses.length || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">
                <CheckCircleOutlined /> Completed Courses
              </div>
              <div className="stat-value">
                {courses.filter((c) => c.status === 'completed' && c.progress >= 100).length}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">
                <ClockCircleOutlined /> In Progress
              </div>
              <div className="stat-value">
                {courses.filter((c) => c.status === 'in-progress' || (c.status !== 'completed' && c.progress > 0 && c.progress < 100)).length}
              </div>
            </div>
          </Card>
        </Col>

        {/* Courses & Progress */}
        <Col xs={24} lg={16}>
          <Card title="Enrolled Courses" className="courses-card">
            {courses.length > 0 ? (
              <div className="courses-list">
                {courses.map((course, index) => (
                  <div key={index} className="course-item">
                    <div className="course-header">
                      <div>
                        <h3>{course.courseName}</h3>
                        <Space>
                          <Tag color={getCourseStatusColor(course.progress >= 100 ? 'completed' : course.progress > 0 ? 'in-progress' : 'not-started')} style={{ textTransform: 'capitalize' }}>
                            {course.progress >= 100 ? 'completed' : course.progress > 0 ? 'in-progress' : 'not-started'}
                          </Tag>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>
                            Enrolled {new Date(course.enrolledDate).toLocaleDateString()}
                          </span>
                        </Space>
                      </div>
                    </div>
                    <div className="course-progress">
                      <div className="progress-info">
                        <span>Progress: {Math.round(course.progress)}%</span>
                        {course.totalLessons > 0 && (
                          <span>
                            {course.lessonsCompleted} of {course.totalLessons} lessons completed
                          </span>
                        )}
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
            {activities.length > 0 ? (
              <Timeline>
                {activities.map((activity) => (
                  <Timeline.Item
                    key={activity.id}
                    color={
                      activity.message.includes('completed') || activity.message.includes('reached')
                        ? 'green'
                        : activity.message.includes('progress')
                        ? 'blue'
                        : activity.message.includes('enrolled')
                        ? 'orange'
                        : 'purple'
                    }
                  >
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{student.userName}</strong>
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
