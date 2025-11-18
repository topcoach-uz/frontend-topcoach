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
        path: `/b2b-dashboard/analytics?${params.toString()}`,
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
        path: `/b2b-dashboard?${params.toString()}`,
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
  const totalStudents = analytics.totalStudents || 0;
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

  // Course type breakdown
  const courseTypeBreakdown = analytics.courseTypeBreakdown || [];

  const courseTypeColumns: ColumnsType<any> = [
    {
      title: 'Course Type',
      dataIndex: 'courseType',
      key: 'courseType',
      width: 200,
      render: (type: string) => (
        <Tag color={type === 'premium' ? 'gold' : 'blue'}>
          {type?.toUpperCase() || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Students',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      width: 200,
      render: (_, record) => {
        const percentage = totalStudents > 0 ? Math.round((record.count / totalStudents) * 100) : 0;
        return (
          <div>
            <Progress
              percent={percentage}
              strokeColor={record.courseType === 'premium' ? '#faad14' : '#1890ff'}
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

  // Top performers
  const topPerformers = data
    .filter((s) => s.progressPercentage !== null && s.progressPercentage >= 80)
    .sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
    .slice(0, 5);

  // Needs attention
  const needsAttention = data
    .filter((s) => s.progressPercentage !== null && s.progressPercentage < 50 && s.status === 'completed')
    .sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0))
    .slice(0, 5);

  return (
    <div className="b2b-analytics">
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.enrollmentTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    allowDecimals={false}
                    tickFormatter={(value) => Math.floor(value).toString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Enrollments']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8b0000" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>No enrollment data available</div>
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

      {/* Course Type Breakdown */}
      <Card title="Course Type Breakdown" className="performance-card" style={{ marginBottom: 24 }}>
        <Table
          columns={courseTypeColumns}
          dataSource={courseTypeBreakdown}
          rowKey="courseType"
          pagination={false}
        />
      </Card>

      {/* Additional Insights */}
      <Row gutter={[24, 24]} className="insights-row">
        <Col xs={24} lg={12}>
          <Card title="Top Performers" className="insight-card">
            <div className="top-performers">
              {topPerformers.length > 0 ? (
                topPerformers.map((student) => (
                  <div key={student.userId} className="performer-item">
                    <div className="performer-info">
                      <span className="performer-name">{student.userName}</span>
                      <span className="performer-email">{student.userEmail}</span>
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
                ))
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
                needsAttention.map((student) => (
                  <div key={student.userId} className="attention-item">
                    <div className="attention-info">
                      <span className="attention-name">{student.userName}</span>
                      <span className="attention-email">{student.userEmail}</span>
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
                ))
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
