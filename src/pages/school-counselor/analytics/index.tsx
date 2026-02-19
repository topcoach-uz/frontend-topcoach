import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  TeamOutlined,
  TrophyOutlined,
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
import './analytics.scss';


const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
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
        <div style={{ marginTop: 16 }}>{t('schoolCounselor.analytics.loading', 'Loading analytics...')}</div>
      </div>
    );
  }

  if (!isSuperAdmin && !isCounselor) {
    return (
      <Alert
        message={t('schoolCounselor.analytics.accessDenied', 'Access Denied')}
        description={t('schoolCounselor.analytics.accessDeniedDesc', 'You need to be a counselor or SuperAdmin to access this page.')}
        type="error"
        showIcon
      />
    );
  }

  if (!analytics) {
    return <Alert message={t('schoolCounselor.analytics.noData', 'No analytics data available')} type="info" />;
  }

  // Calculate overall statistics
  const uniqueStudentIds = new Set(data.map(d => d.userId));
  const totalStudents = uniqueStudentIds.size;
  const averageProgress = analytics.averageProgress || 0;

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
          <h1>{t('schoolCounselor.analytics.title', 'Analytics & Reports')}</h1>
          <p className="page-subtitle">{t('schoolCounselor.analytics.subtitle', 'Track performance metrics and student engagement')}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} className="metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title={t('schoolCounselor.analytics.totalStudents', 'Total Students')}
              value={totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#8b0000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title={t('schoolCounselor.analytics.averageProgress', 'Average Progress')}
              value={averageProgress}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="charts-row">
        {/* Enrollment Trends */}
        <Col xs={24} lg={12}>
          <Card title={t('schoolCounselor.analytics.enrollmentTrends', 'Enrollment Trends')} className="chart-card">
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
                        t('schoolCounselor.analytics.enrollments', 'Enrollments')
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
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{t('schoolCounselor.analytics.noEnrollmentData', 'No enrollment data available')}</div>
              </div>
            )}
          </Card>
        </Col>

        {/* Progress Distribution */}
        <Col xs={24} lg={12}>
          <Card title={t('schoolCounselor.analytics.studentProgressDistribution', 'Student Progress Distribution')} className="chart-card">
            <div className="progress-distribution">
              {progressDistribution.map((item, index) => (
                <div key={index} className="distribution-item">
                  <div className="dist-header">
                    <span className="dist-range">{item.range}</span>
                    <span className="dist-count">{item.count} {t('schoolCounselor.analytics.students', 'students')}</span>
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

      {/* Additional Insights */}
      <Row gutter={[24, 24]} className="insights-row">
        <Col xs={24} lg={12}>
          <Card title={t('schoolCounselor.analytics.topPerformers', 'Top Performers')} className="insight-card">
            <div className="top-performers">
              {topPerformers.length > 0 ? (
                topPerformers.map((student, index) => {
                  const courseDisplay = student.courseName === 'admissions' 
                    ? t('schoolCounselor.dashboard.admissionsProgram', 'Admissions Program')
                    : student.courseName === 'sat' 
                    ? t('schoolCounselor.dashboard.satPrepCourse', 'SAT Prep Course')
                    : student.courseName?.toUpperCase() || t('common.notAvailable', 'N/A');
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
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>{t('schoolCounselor.analytics.noTopPerformers', 'No top performers yet')}</div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('schoolCounselor.analytics.needsAttention', 'Needs Attention')} className="insight-card">
            <div className="needs-attention">
              {needsAttention.length > 0 ? (
                needsAttention.map((student, index) => {
                  const courseDisplay = student.courseName === 'admissions' 
                    ? t('schoolCounselor.dashboard.admissionsProgram', 'Admissions Program')
                    : student.courseName === 'sat' 
                    ? t('schoolCounselor.dashboard.satPrepCourse', 'SAT Prep Course')
                    : student.courseName?.toUpperCase() || t('common.notAvailable', 'N/A');
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
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>{t('schoolCounselor.dashboard.allStudentsOnTrack', 'All students are on track! 🎉')}</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
