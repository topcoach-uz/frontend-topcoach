import React from 'react';
import { Card, Button, Row, Col, Typography, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../common/icons/FontAwesomeIcon';
import { PROFILE_ICONS, ACTION_ICONS } from '../../constants/icons';
import './LoginPrompt.scss';

const { Title, Paragraph, Text } = Typography;

const LoginPrompt: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/auth/signin');
  };

  const handleSignUp = () => {
    navigate('/auth/signup');
  };

  const features = [
    {
      icon: <FontAwesomeIcon icon="user" style={{ color: '#8b0000', fontSize: '24px' }} />,
      title: 'Complete Profile',
      description: 'Build your comprehensive student profile with academic achievements, extracurricular activities, and personal information.'
    },
    {
      icon: <FontAwesomeIcon icon="building" style={{ color: '#8b0000', fontSize: '24px' }} />,
      title: 'Track Applications',
      description: 'Manage your college and scholarship applications with deadlines, requirements, and status tracking.'
    },
    {
      icon: <FontAwesomeIcon icon="pen" style={{ color: '#8b0000', fontSize: '24px' }} />,
      title: 'Essay Management',
      description: 'Upload and organize your essays. Essay prompts and AI-powered feedback features coming soon.'
    },
    {
      icon: <FontAwesomeIcon icon="file" style={{ color: '#8b0000', fontSize: '24px' }} />,
      title: 'Document Storage',
      description: 'Securely store and organize all your important documents, transcripts, and certificates.'
    },
  ];

  return (
    <div className="login-prompt">
      <div className="login-prompt-container">
        <Card className="welcome-card">
          <div className="welcome-header">
            <div className="welcome-icon">
              <FontAwesomeIcon icon="graduation-cap" style={{ color: '#8b0000', fontSize: '48px' }} />
            </div>
            <Title level={1} className="welcome-title">
              Welcome to My Journey
            </Title>
            <Paragraph className="welcome-description">
              Your comprehensive college application management platform. Track applications, manage essays, 
              store documents, and get personalized guidance from experienced mentors.
            </Paragraph>
          </div>

          <Divider />

          <div className="login-actions">
            <Space size="large" direction="vertical" style={{ width: '100%' }}>
              <div className="action-buttons">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSignIn}
                  icon={<FontAwesomeIcon icon="sign-in-alt" />}
                  className="signin-button"
                >
                  Sign In
                </Button>
                <Button
                  size="large"
                  onClick={handleSignUp}
                  icon={<FontAwesomeIcon icon="user-plus" />}
                  className="signup-button"
                >
                  Create Account
                </Button>
              </div>
              <Text type="secondary" className="login-note">
                Sign in to access your personalized dashboard and start your college application journey
              </Text>
            </Space>
          </div>
        </Card>

        <div className="features-section">
          <Title level={2} className="features-title">
            What You Can Do
          </Title>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={12} key={index}>
                <Card className="feature-card" hoverable>
                  <div className="feature-content">
                    <div className="feature-icon">
                      {feature.icon}
                    </div>
                    <Title level={4} className="feature-title">
                      {feature.title}
                    </Title>
                    <Paragraph className="feature-description">
                      {feature.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

      </div>
    </div>
  );
};

export default LoginPrompt;
