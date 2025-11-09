import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Descriptions, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { mockCourses, mockStudents, type Course } from '../data/mockData';
import type { ColumnsType } from 'antd/es/table';
import './courses.scss';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Calculate course statistics
  const getCourseStats = (courseId: string) => {
    const enrolledStudents = mockStudents.filter((student) =>
      student.enrolledCourses.some((c) => c.courseId === courseId)
    );
    const completedStudents = enrolledStudents.filter((student) =>
      student.enrolledCourses.some((c) => c.courseId === courseId && c.status === 'completed')
    );
    const inProgressStudents = enrolledStudents.filter((student) =>
      student.enrolledCourses.some((c) => c.courseId === courseId && c.status === 'in-progress')
    );
    
    const totalProgress = enrolledStudents.reduce((sum, student) => {
      const enrollment = student.enrolledCourses.find((c) => c.courseId === courseId);
      return sum + (enrollment?.progress || 0);
    }, 0);
    const averageProgress = enrolledStudents.length > 0 ? Math.round(totalProgress / enrolledStudents.length) : 0;

    return {
      enrolled: enrolledStudents.length,
      completed: completedStudents.length,
      inProgress: inProgressStudents.length,
      averageProgress,
    };
  };

  const handleViewStudents = (courseId: string) => {
    navigate(`/b2b/students?course=${courseId}`);
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'Course',
      key: 'course',
      width: 300,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
            {record.name}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
    },
    {
      title: 'Lessons',
      dataIndex: 'totalLessons',
      key: 'totalLessons',
      width: 100,
      render: (lessons: number) => (
        <span>
          <BookOutlined style={{ marginRight: 4 }} />
          {lessons}
        </span>
      ),
    },
    {
      title: 'Enrolled Students',
      key: 'enrolled',
      width: 150,
      render: (_, record) => {
        const stats = getCourseStats(record.id);
        return (
          <div>
            <Statistic
              value={stats.enrolled}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </div>
        );
      },
      sorter: (a, b) => {
        const statsA = getCourseStats(a.id);
        const statsB = getCourseStats(b.id);
        return statsA.enrolled - statsB.enrolled;
      },
    },
    {
      title: 'Completion Rate',
      key: 'completion',
      width: 200,
      render: (_, record) => {
        const stats = getCourseStats(record.id);
        return (
          <div>
            <Progress
              percent={record.completionRate}
              strokeColor={record.completionRate >= 70 ? '#52c41a' : record.completionRate >= 50 ? '#faad14' : '#ff4d4f'}
              size="small"
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {record.completionRate}% ({stats.completed} completed)
            </div>
          </div>
        );
      },
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
    {
      title: 'Average Progress',
      key: 'avgProgress',
      width: 150,
      render: (_, record) => {
        const stats = getCourseStats(record.id);
        return (
          <div>
            <Progress
              type="circle"
              percent={stats.averageProgress}
              size={60}
              strokeColor={stats.averageProgress >= 80 ? '#52c41a' : stats.averageProgress >= 50 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCourse(record);
            handleViewStudents(record.id);
          }}
          style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
        >
          View Students
        </Button>
      ),
    },
  ];

  // Overall statistics
  const totalEnrollments = mockStudents.reduce(
    (sum, student) => sum + student.enrolledCourses.length,
    0
  );
  const totalCompleted = mockStudents.reduce(
    (sum, student) =>
      sum + student.enrolledCourses.filter((c) => c.status === 'completed').length,
    0
  );
  const overallCompletionRate = totalEnrollments > 0
    ? Math.round((totalCompleted / totalEnrollments) * 100)
    : 0;

  return (
    <div className="b2b-courses">
      <div className="courses-header">
        <div>
          <h1>Courses</h1>
          <p className="page-subtitle">
            View available courses and track student enrollments. Courses are managed by TopCoach.
          </p>
        </div>
        <div className="info-badge">
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Read-only view
        </div>
      </div>

      {/* Overall Statistics */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Courses"
              value={mockCourses.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#8b0000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Enrollments"
              value={totalEnrollments}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Completed"
              value={totalCompleted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Overall Completion"
              value={overallCompletionRate}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Courses Table */}
      <Card className="courses-table-card">
        <Table
          columns={columns}
          dataSource={mockCourses}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} courses`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Course Detail Modal (if needed) */}
      {selectedCourse && (
        <Card
          title={`Course Details: ${selectedCourse.name}`}
          className="course-detail-card"
          style={{ marginTop: 24 }}
          extra={
            <Button onClick={() => setSelectedCourse(null)}>Close</Button>
          }
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Course Name">{selectedCourse.name}</Descriptions.Item>
            <Descriptions.Item label="Category">{selectedCourse.category}</Descriptions.Item>
            <Descriptions.Item label="Duration">{selectedCourse.duration}</Descriptions.Item>
            <Descriptions.Item label="Total Lessons">{selectedCourse.totalLessons}</Descriptions.Item>
            <Descriptions.Item label="Enrolled Students" span={2}>
              {getCourseStats(selectedCourse.id).enrolled} students
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedCourse.description}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default CoursesPage;
