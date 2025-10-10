import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Result, Spin } from 'antd';
import { CheckCircleOutlined, RocketOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useTypedSelector } from 'src/app/store';
import { useGetEnrollmentStatusQuery } from 'src/app/services/courses';
import './success.scss';

const ProgramsSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useTypedSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);

  // Get enrollment status
  const { data: enrollmentStatus, refetch } = useGetEnrollmentStatusQuery(undefined, {
    skip: !isAuthenticated
  });

  useEffect(() => {
    const success = searchParams.get('success');
    
    if (success === 'true' && isAuthenticated) {
      // Refetch enrollment status to get latest data
      refetch().then(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [searchParams, isAuthenticated, refetch]);

  useEffect(() => {
    if (enrollmentStatus?.enrollment) {
      setEnrollmentData(enrollmentStatus.enrollment);
    }
  }, [enrollmentStatus]);

  const handleGoToPrograms = () => {
    navigate('/programs');
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="programs-success-page">
        <div className="programs-success-loading-content">
          <div className="loading-spinner-container">
            <Spin size="large" />
            <p>Verifying your enrollment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="programs-success-page">
      <div className="success-container">
        <Card className="success-card">
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            status="success"
            title="Payment Successful!"
            subTitle={
              <div className="success-subtitle">
                <p>Thank you for enrolling in our course program!</p>
                <div className="approval-notice">
                  <ClockCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  <span>
                    <strong>Your application has been submitted!</strong> Our administrator will review and contact you within 12 hours.
                  </span>
                </div>
                {enrollmentData && (
                  <div className="enrollment-details">
                    <div className="detail-item">
                      <UserOutlined />
                      <span>Plan: <strong>{enrollmentData.courseType === 'standard' ? 'Standard' : 'Premium'}</strong></span>
                    </div>
                    <div className="detail-item">
                      <ClockCircleOutlined />
                      <span>Status: <strong className="status-pending">Pending Approval</strong></span>
                    </div>
                  </div>
                )}
              </div>
            }
            extra={[
              <Button 
                type="primary" 
                size="large" 
                key="programs"
                onClick={handleGoToPrograms}
                icon={<RocketOutlined />}
              >
                View Program Details
              </Button>,
              <Button 
                size="large" 
                key="dashboard"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </Button>
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default ProgramsSuccessPage; 