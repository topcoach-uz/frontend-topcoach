import React, { useState, useMemo } from 'react';
import { Card, Input, Select, Table, Tag, Button, Space, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { mockStudents, type Student } from '../data/mockData';
import type { ColumnsType } from 'antd/es/table';
import './students.scss';

const { Search } = Input;
const { Option } = Select;

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return mockStudents.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.email.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      
      const matchesCourse =
        courseFilter === 'all' ||
        student.enrolledCourses.some((course) => course.courseId === courseFilter);

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [searchText, statusFilter, courseFilter]);

  const handleViewStudent = (studentId: string) => {
    navigate(`/b2b/students/${studentId}`);
  };

  const getStatusColor = (status: Student['status']) => {
    const colors: Record<string, string> = {
      active: 'blue',
      inactive: 'default',
      completed: 'green',
      pending: 'orange',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<Student> = [
    {
      title: 'Student',
      key: 'student',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>{record.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Student['status']) => (
        <Tag color={getStatusColor(status)} style={{ textTransform: 'capitalize' }}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Enrolled Courses',
      key: 'courses',
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {record.enrolledCourses.length > 0 ? (
            <div>
              <div style={{ marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {record.enrolledCourses.map((course) => (
                  <Tag 
                    key={course.courseId} 
                    style={{ 
                      marginBottom: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={course.courseName}
                  >
                    {course.courseName}
                  </Tag>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {record.enrolledCourses.length} course{record.enrolledCourses.length !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <span style={{ color: '#9ca3af' }}>No courses</span>
          )}
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 180,
      render: (_, record) => (
        <div style={{ minWidth: 160 }}>
          <Progress
            percent={record.totalProgress}
            strokeColor={record.totalProgress >= 80 ? '#52c41a' : record.totalProgress >= 50 ? '#faad14' : '#ff4d4f'}
            size="small"
            showInfo={false}
            style={{ marginBottom: 4 }}
          />
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {record.totalProgress}% complete
          </div>
        </div>
      ),
      sorter: (a, b) => a.totalProgress - b.totalProgress,
    },
    {
      title: 'Enrollment Date',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime(),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 180,
      render: (date: string) => {
        const activityDate = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - activityDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMs < 0) return 'Just now';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return activityDate.toLocaleDateString();
      },
      sorter: (a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewStudent(record.id)}
          style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
        >
          View
        </Button>
      ),
    },
  ];

  // Get unique courses for filter
  const allCourses = useMemo(() => {
    const courseSet = new Set<string>();
    mockStudents.forEach((student) => {
      student.enrolledCourses.forEach((course) => {
        courseSet.add(course.courseId);
      });
    });
    return Array.from(courseSet);
  }, []);

  return (
    <div className="b2b-students">
      <div className="students-header">
        <div>
          <h1>Students</h1>
          <p className="page-subtitle">Manage and track your students' progress</p>
        </div>
        <Space>
          <Button icon={<ExportOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <Space size="large" wrap>
          <Search
            placeholder="Search students by name or email"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="completed">Completed</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <Select
            placeholder="Filter by Course"
            style={{ width: 200 }}
            value={courseFilter}
            onChange={setCourseFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Courses</Option>
            {allCourses.map((courseId) => {
              const student = mockStudents.find((s) =>
                s.enrolledCourses.some((c) => c.courseId === courseId)
              );
              const course = student?.enrolledCourses.find((c) => c.courseId === courseId);
              return (
                <Option key={courseId} value={courseId}>
                  {course?.courseName || courseId}
                </Option>
              );
            })}
          </Select>
          <div className="results-count">
            Showing {filteredStudents.length} of {mockStudents.length} students
          </div>
        </Space>
      </Card>

      {/* Students Table */}
      <Card className="students-table-card">
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} students`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
};

export default StudentsPage;
