import React, { useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Statistic, Progress, Table, Tag } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { mockStudents, mockCourses, type Student } from '../data/mockData';
import type { ColumnsType } from 'antd/es/table';
import './analytics.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Calculate overall statistics
  const totalStudents = mockStudents.length;
  const activeStudents = mockStudents.filter((s) => s.status === 'active').length;
  const completedStudents = mockStudents.filter((s) => s.status === 'completed').length;
  const averageProgress = Math.round(
    mockStudents.reduce((sum, s) => sum + s.totalProgress, 0) / totalStudents
  );

  // Course performance data
  const coursePerformance = mockCourses.map((course) => {
    const enrolledStudents = mockStudents.filter((student) =>
      student.enrolledCourses.some((c) => c.courseId === course.id)
    );
    const completed = enrolledStudents.filter((student) =>
      student.enrolledCourses.some((c) => c.courseId === course.id && c.status === 'completed')
    ).length;
    const totalProgress = enrolledStudents.reduce((sum, student) => {
      const enrollment = student.enrolledCourses.find((c) => c.courseId === course.id);
      return sum + (enrollment?.progress || 0);
    }, 0);
    const avgProgress = enrolledStudents.length > 0 ? Math.round(totalProgress / enrolledStudents.length) : 0;

    return {
      ...course,
      enrolled: enrolledStudents.length,
      completed,
      avgProgress,
      completionRate: enrolledStudents.length > 0 ? Math.round((completed / enrolledStudents.length) * 100) : 0,
    };
  });

  // Student progress distribution
  const progressDistribution = [
    { range: '0-25%', count: mockStudents.filter((s) => s.totalProgress >= 0 && s.totalProgress <= 25).length },
    { range: '26-50%', count: mockStudents.filter((s) => s.totalProgress > 25 && s.totalProgress <= 50).length },
    { range: '51-75%', count: mockStudents.filter((s) => s.totalProgress > 50 && s.totalProgress <= 75).length },
    { range: '76-100%', count: mockStudents.filter((s) => s.totalProgress > 75).length },
  ];

  // Enrollment trends (mock data)
  const enrollmentTrends = [
    { month: 'Jan', enrollments: 5 },
    { month: 'Feb', enrollments: 8 },
    { month: 'Mar', enrollments: 12 },
    { month: 'Apr', enrollments: 10 },
    { month: 'May', enrollments: 15 },
    { month: 'Jun', enrollments: 18 },
    { month: 'Jul', enrollments: 20 },
    { month: 'Aug', enrollments: 22 },
    { month: 'Sep', enrollments: 25 },
    { month: 'Oct', enrollments: 28 },
    { month: 'Nov', enrollments: 30 },
  ];

  const coursePerformanceColumns: ColumnsType<any> = [
    {
      title: 'Course',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Enrolled',
      dataIndex: 'enrolled',
      key: 'enrolled',
      width: 100,
      sorter: (a, b) => a.enrolled - b.enrolled,
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      key: 'completed',
      width: 100,
      sorter: (a, b) => a.completed - b.completed,
    },
    {
      title: 'Completion Rate',
      key: 'completionRate',
      width: 200,
      render: (_, record) => (
        <div>
          <Progress
            percent={record.completionRate}
            strokeColor={record.completionRate >= 70 ? '#52c41a' : record.completionRate >= 50 ? '#faad14' : '#8b0000'}
            size="small"
            showInfo={false}
            style={{ marginBottom: 4 }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{record.completionRate}%</span>
        </div>
      ),
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
    {
      title: 'Avg Progress',
      dataIndex: 'avgProgress',
      key: 'avgProgress',
      width: 150,
      render: (progress: number) => (
        <Progress
          type="circle"
          percent={progress}
          size={50}
          strokeColor={progress >= 80 ? '#52c41a' : progress >= 50 ? '#faad14' : '#ff4d4f'}
        />
      ),
      sorter: (a, b) => a.avgProgress - b.avgProgress,
    },
  ];

  return (
    <div className="b2b-analytics">
      <div className="analytics-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p className="page-subtitle">Track performance metrics and student engagement</p>
        </div>
        <div className="filters">
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 150, marginRight: 12 }}
          >
            <Option value="7days">Last 7 days</Option>
            <Option value="30days">Last 30 days</Option>
            <Option value="90days">Last 90 days</Option>
            <Option value="1year">Last year</Option>
          </Select>
          <RangePicker />
        </div>
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
              prefix={<TeamOutlined />}
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
              title="Completion Rate"
              value={Math.round((completedStudents / totalStudents) * 100)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="metric-change positive">
              <ArrowUpOutlined /> {completedStudents} students completed
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

      <Row gutter={[24, 24]} className="charts-row">
        {/* Enrollment Trends */}
        <Col xs={24} lg={12}>
          <Card title="Enrollment Trends" className="chart-card">
            <div className="simple-chart">
              {enrollmentTrends.map((item, index) => (
                <div key={index} className="chart-bar-item">
                  <div className="bar-label">{item.month}</div>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${(item.enrollments / 30) * 100}%`,
                        backgroundColor: '#8b0000',
                      }}
                    >
                      <span className="bar-value">{item.enrollments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Progress Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Student Progress Distribution" className="chart-card">
            <div className="progress-distribution">
              {progressDistribution.map((item, index) => (
                <div key={index} className="distribution-item">
                  <div className="dist-header">
                    <span className="dist-range">{item.range}</span>
                    <span className="dist-count">{item.count} students</span>
                  </div>
                  <Progress
                    percent={Math.round((item.count / totalStudents) * 100)}
                    strokeColor="#8b0000"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Course Performance */}
      <Card title="Course Performance Analysis" className="performance-card" style={{ marginBottom: 24 }}>
        <Table
          columns={coursePerformanceColumns}
          dataSource={coursePerformance}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Additional Insights */}
      <Row gutter={[24, 24]} className="insights-row">
        <Col xs={24} lg={12}>
          <Card title="Top Performers" className="insight-card">
            <div className="top-performers">
              {mockStudents
                .filter((s) => s.totalProgress >= 80)
                .sort((a, b) => b.totalProgress - a.totalProgress)
                .slice(0, 5)
                .map((student) => (
                  <div key={student.id} className="performer-item">
                    <div className="performer-info">
                      <span className="performer-name">{student.name}</span>
                      <span className="performer-email">{student.email}</span>
                    </div>
                    <div className="performer-progress">
                      <Progress
                        type="circle"
                        percent={student.totalProgress}
                        size={50}
                        strokeColor="#52c41a"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Needs Attention" className="insight-card">
            <div className="needs-attention">
              {mockStudents
                .filter((s) => s.status === 'active' && s.totalProgress < 50)
                .sort((a, b) => a.totalProgress - b.totalProgress)
                .slice(0, 5)
                .map((student) => (
                  <div key={student.id} className="attention-item">
                    <div className="attention-info">
                      <span className="attention-name">{student.name}</span>
                      <span className="attention-email">{student.email}</span>
                    </div>
                    <div className="attention-progress">
                      <Progress
                        type="circle"
                        percent={student.totalProgress}
                        size={50}
                        strokeColor="#ff4d4f"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
