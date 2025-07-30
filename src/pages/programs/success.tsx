import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Result, Spin } from 'antd';
import { CheckCircleOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons';
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
      <div className="programs-success-loading">
        <Spin size="large" />
        <p>Verifying your enrollment...</p>
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
                {enrollmentData && (
                  <div className="enrollment-details">
                    <div className="detail-item">
                      <UserOutlined />
                      <span>Plan: <strong>{enrollmentData.courseType === 'standard' ? 'Standard' : 'Premium'}</strong></span>
                    </div>
                    <div className="detail-item">
                      <RocketOutlined />
                      <span>Status: <strong className="status-completed">Completed</strong></span>
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
          
          <div className="next-steps">
            <h3>What's Next?</h3>
            <div className="steps-grid">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Welcome Email</h4>
                  <p>You'll receive a welcome email with your login credentials and course access information.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Course Access</h4>
                  <p>Once the program launches, you'll have full access to all course materials and sessions.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Start Learning</h4>
                  <p>Begin your journey with our comprehensive university admissions course.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProgramsSuccessPage; 