import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Button, Spin, Alert, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import type { ColumnsType } from 'antd/es/table';
import './courses.scss';

interface CourseData {
  id: string;
  name: string;
  description: string;
  category?: string;
  duration?: string;
  totalLessons?: number;
  enrolledStudents: number;
  completedStudents: number;
  completionRate: number;
  averageProgress: number;
}

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // For counselors, fetch immediately (they always have an organization)
    // For SuperAdmins, only fetch if an organization is selected
    if (isCounselor || (isSuperAdmin && selectedOrganizationId)) {
      fetchData();
      fetchCourses();
    }
  }, [selectedOrganizationId, isCounselor, isSuperAdmin]);

  const fetchData = async () => {
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
      console.error('Error fetching data:', error);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedOrganizationId) {
        params.append('organizationId', selectedOrganizationId);
      }
      
      const response = await api.request({
        path: `/b2b-dashboard/courses?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      
      setCourses(response.data || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (courseId: string) => {
    navigate(`/b2b/students`);
  };

  const columns: ColumnsType<CourseData> = [
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
      render: (category: string) => <Tag color="blue">{category || 'N/A'}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration: string) => duration || 'N/A',
    },
    {
      title: 'Lessons',
      dataIndex: 'totalLessons',
      key: 'totalLessons',
      width: 100,
      render: (lessons: number) => (
        <span>
          <BookOutlined style={{ marginRight: 4 }} />
          {lessons || 0}
        </span>
      ),
    },
    {
      title: 'Enrolled Students',
      key: 'enrolled',
      width: 150,
      render: (_, record) => (
        <div>
          <Statistic
            value={record.enrolledStudents}
            prefix={<TeamOutlined />}
            valueStyle={{ fontSize: 16, fontWeight: 600 }}
          />
        </div>
      ),
      sorter: (a, b) => a.enrolledStudents - b.enrolledStudents,
    },
    {
      title: 'Completion Rate',
      key: 'completion',
      width: 200,
      render: (_, record) => (
        <div>
          <Progress
            percent={record.completionRate}
            strokeColor={record.completionRate >= 70 ? '#52c41a' : record.completionRate >= 50 ? '#faad14' : '#ff4d4f'}
            size="small"
            showInfo={false}
            style={{ marginBottom: 4 }}
          />
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {record.completionRate}% ({record.completedStudents} completed course)
          </div>
        </div>
      ),
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
    {
      title: 'Average Progress',
      key: 'avgProgress',
      width: 150,
      render: (_, record) => (
        <div>
          <Progress
            type="circle"
            percent={record.averageProgress}
            size={60}
            strokeColor={record.averageProgress >= 80 ? '#52c41a' : record.averageProgress >= 50 ? '#faad14' : '#ff4d4f'}
          />
        </div>
      ),
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
          onClick={() => handleViewStudents(record.id)}
          style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
        >
          View Students
        </Button>
      ),
    },
  ];

  // Calculate overall statistics
  const totalCourses = courses.length;
  const totalEnrollments = data.length;
  // Count students who have access (paymentStatus and status both completed)
  const studentsWithAccess = data.filter(
    s => s.paymentStatus === 'completed' && s.status === 'completed'
  );
  // Count students who actually completed the course (100% progress), not just enrollment status
  const totalCompleted = studentsWithAccess.filter(s => (s.progressPercentage || 0) >= 100).length;
  const overallCompletionRate = studentsWithAccess.length > 0
    ? Math.round((totalCompleted / studentsWithAccess.length) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading courses...</div>
      </div>
    );
  }

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
              value={totalCourses}
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
        {courses.length === 0 ? (
          <Empty
            description="No courses available. Courses are managed by TopCoach."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={courses}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} courses`,
              position: ['bottomRight'],
            }}
            scroll={{ x: 1400 }}
          />
        )}
      </Card>
    </div>
  );
};

export default CoursesPage;
