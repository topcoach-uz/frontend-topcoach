import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Statistic, Progress, Table, Tag, Spin, Alert } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import type { ColumnsType } from 'antd/es/table';
import './analytics.scss';

const { Option } = Select;

const AnalyticsPage: React.FC = () => {
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedOrganizationId || isCounselor) {
      fetchAnalytics();
      fetchData();
    }
  }, [selectedOrganizationId, isCounselor]);

  const fetchAnalytics = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
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
      console.error('Error fetching data:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading analytics...</div>
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

  if (!analytics) {
    return <Alert message="No analytics data available" type="info" />;
  }

  // Calculate overall statistics
  const uniqueStudentIds = new Set(data.map(d => d.userId));
  const totalStudents = uniqueStudentIds.size;
  const totalEnrollments = data.filter(d => d.courseName).length;
  const studentsWithAccess = analytics.studentsWithAccess || 0;
  const averageProgress = analytics.averageProgress || 0;
  const accessRate = totalStudents > 0 ? Math.round((studentsWithAccess / totalStudents) * 100) : 0;

  // Progress distribution based on data
  const progressDistribution = [
    { 
      range: '0-25%', 
      count: data.filter((s) => s.progressPercentage !== null && s.progressPercentage >= 0 && s.progressPercentage <= 25).length 
    },
    { 
      range: '26-50%', 
      count: data.filter((s) => s.progressPercentage !== null && s.progressPercentage > 25 && s.progressPercentage <= 50).length 
    },
    { 
      range: '51-75%', 
      count: data.filter((s) => s.progressPercentage !== null && s.progressPercentage > 50 && s.progressPercentage <= 75).length 
    },
    { 
      range: '76-100%', 
      count: data.filter((s) => s.progressPercentage !== null && s.progressPercentage > 75).length 
    },
  ];

  // Course name breakdown
  const courseNameBreakdown = analytics.courseNameBreakdown || [];

  const courseNameColumns: ColumnsType<any> = [
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 200,
      render: (courseName: string) => {
        const courseDisplay = courseName === 'admissions' 
          ? 'Admissions Program' 
          : courseName === 'sat' 
          ? 'SAT Prep Course' 
          : courseName?.toUpperCase() || 'N/A';
        const color = courseName === 'admissions' ? 'blue' : courseName === 'sat' ? 'purple' : 'default';
        return <Tag color={color}>{courseDisplay}</Tag>;
      },
    },
    {
      title: 'Enrollments',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: (a, b) => a.count - b.count,
      render: (count: number) => `${count} enrollment${count !== 1 ? 's' : ''}`,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      width: 200,
      render: (_, record) => {
        // Calculate percentage based on total enrollments, not total students
        const percentage = totalEnrollments > 0 ? Math.round((record.count / totalEnrollments) * 100) : 0;
        const strokeColor = record.courseName === 'admissions' ? '#1890ff' : record.courseName === 'sat' ? '#722ed1' : '#8b0000';
        return (
          <div>
            <Progress
              percent={percentage}
              strokeColor={strokeColor}
              size="small"
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{percentage}%</span>
          </div>
        );
      },
    },
  ];

  // Top performers - filter by courseName to show per-course
  const topPerformers = data
    .filter((s) => s.progressPercentage !== null && s.progressPercentage >= 80 && s.courseName)
    .sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
    .slice(0, 5);

  // Needs attention - filter by courseName to show per-course
  const needsAttention = data
    .filter((s) => s.progressPercentage !== null && s.progressPercentage < 50 && s.status === 'completed' && s.courseName)
    .sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0))
    .slice(0, 5);

  return (
    <div className="school-counselor-analytics">
      <div className="analytics-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p className="page-subtitle">Track performance metrics and student engagement</p>
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
              title="Average Progress"
              value={averageProgress}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Access Rate"
              value={accessRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="charts-row">
        {/* Enrollment Trends */}
        <Col xs={24} lg={12}>
          <Card title="Enrollment Trends" className="chart-card">
            {analytics.enrollmentTrends && analytics.enrollmentTrends.length > 0 ? (
              <div className="enrollment-chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={analytics.enrollmentTrends}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b0000" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a52a2a" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e5e7eb" 
                      vertical={false}
                      strokeOpacity={0.6}
                    />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      tickLine={{ stroke: '#d1d5db' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      height={50}
                      tickFormatter={(value: string) => {
                        // Extract just the month name for X-axis display (e.g., "Jan 2025" -> "Jan")
                        const parts = value.split(' ');
                        return parts[0] || value;
                      }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      tickLine={{ stroke: '#d1d5db' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      allowDecimals={false}
                      tickFormatter={(value) => Math.floor(value).toString()}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                      }}
                      labelStyle={{ 
                        color: '#1f2937', 
                        fontWeight: 600,
                        marginBottom: '4px',
                        fontSize: '13px',
                      }}
                      labelFormatter={(label: string) => {
                        // Label already includes year from backend (e.g., "Jan 2025")
                        return label;
                      }}
                      formatter={(value: any) => [
                        <span style={{ color: '#8b0000', fontWeight: 600 }}>{value}</span>,
                        'Enrollments'
                      ]}
                      cursor={{ fill: 'rgba(139, 0, 0, 0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#enrollmentGradient)"
                      radius={[8, 8, 0, 0]}
                      stroke="#8b0000"
                      strokeWidth={1}
                      animationDuration={800}
                      animationBegin={0}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>No enrollment data available</div>
              </div>
            )}
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
                    percent={totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0}
                    strokeColor="#8b0000"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Course Breakdown */}
      <Card title="Course Breakdown" className="performance-card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, fontSize: '14px', color: '#6b7280' }}>
          {totalStudents} student{totalStudents !== 1 ? 's' : ''} with {totalEnrollments} enrollment{totalEnrollments !== 1 ? 's' : ''}
        </div>
        <Table
          columns={courseNameColumns}
          dataSource={courseNameBreakdown}
          rowKey="courseName"
          pagination={false}
        />
      </Card>

      {/* Additional Insights */}
      <Row gutter={[24, 24]} className="insights-row">
        <Col xs={24} lg={12}>
          <Card title="Top Performers" className="insight-card">
            <div className="top-performers">
              {topPerformers.length > 0 ? (
                topPerformers.map((student, index) => {
                  const courseDisplay = student.courseName === 'admissions' 
                    ? 'Admissions Program' 
                    : student.courseName === 'sat' 
                    ? 'SAT Prep Course' 
                    : student.courseName?.toUpperCase() || 'N/A';
                  return (
                    <div key={`${student.userId}-${student.courseName}-${index}`} className="performer-item">
                      <div className="performer-info">
                        <span className="performer-name">{student.userName}</span>
                        <span className="performer-email">{student.userEmail}</span>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={student.courseName === 'admissions' ? 'blue' : student.courseName === 'sat' ? 'purple' : 'default'} style={{ fontSize: '11px' }}>
                            {courseDisplay}
                          </Tag>
                        </div>
                      </div>
                      <div className="performer-progress">
                        <Progress
                          type="circle"
                          percent={Math.round(student.progressPercentage || 0)}
                          size={50}
                          strokeColor="#52c41a"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>No top performers yet</div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Needs Attention" className="insight-card">
            <div className="needs-attention">
              {needsAttention.length > 0 ? (
                needsAttention.map((student, index) => {
                  const courseDisplay = student.courseName === 'admissions' 
                    ? 'Admissions Program' 
                    : student.courseName === 'sat' 
                    ? 'SAT Prep Course' 
                    : student.courseName?.toUpperCase() || 'N/A';
                  return (
                    <div key={`${student.userId}-${student.courseName}-${index}`} className="attention-item">
                      <div className="attention-info">
                        <span className="attention-name">{student.userName}</span>
                        <span className="attention-email">{student.userEmail}</span>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={student.courseName === 'admissions' ? 'blue' : student.courseName === 'sat' ? 'purple' : 'default'} style={{ fontSize: '11px' }}>
                            {courseDisplay}
                          </Tag>
                        </div>
                      </div>
                      <div className="attention-progress">
                        <Progress
                          type="circle"
                          percent={Math.round(student.progressPercentage || 0)}
                          size={50}
                          strokeColor="#ff4d4f"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>All students are on track! 🎉</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
