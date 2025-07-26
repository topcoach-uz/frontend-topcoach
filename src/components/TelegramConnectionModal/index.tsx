import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, Alert, Card, Divider, message } from 'antd';
import { PhoneOutlined, CheckCircleTwoTone, ClockCircleTwoTone, ExclamationCircleTwoTone, UserOutlined, SendOutlined, RobotOutlined, SafetyOutlined } from '@ant-design/icons';
import { useVerifyTelegramOTPMutation, useGetTelegramStatusQuery } from 'src/app/services/users';

const { Text, Title } = Typography;

interface TelegramConnectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const TelegramConnectionModal: React.FC<TelegramConnectionModalProps> = ({
  visible,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyTelegramOTP, { isLoading }] = useVerifyTelegramOTPMutation();
  const { data: telegramStatus, refetch } = useGetTelegramStatusQuery();

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setPhoneNumber('');
      setOtp('');
      setErrorMsg('');
      refetch(); // Refetch status when modal opens
    }
  }, [visible, refetch]);

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || !otp.trim()) return;
    setErrorMsg('');
    try {
      await verifyTelegramOTP({ 
        phoneNumber: phoneNumber.trim(), 
        otp: otp.trim() 
      });
      
      // Force refetch after successful connection
      setTimeout(() => {
        refetch();
      }, 500);
      
      message.success('Telegram connected successfully!');
      
      // Close modal after a short delay to show success state
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      const backendMsg = error?.data?.message || error?.message || 'Failed to verify OTP';
      setErrorMsg(backendMsg);
    }
  };

  const getStatusIcon = () => {
    switch (telegramStatus?.status) {
      case 'connected':
        return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 48 }} />;
      case 'pending':
        return <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 48 }} />;
      case 'failed':
        return <ExclamationCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 48 }} />;
      default:
        return <RobotOutlined style={{ fontSize: 48, color: '#8B0000' }} />;
    }
  };

  const getStatusText = () => {
    switch (telegramStatus?.status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending Connection';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Not Connected';
    }
  };

  const MAIN_RED = '#C8102E';

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <Title level={3} style={{ margin: 0, color: MAIN_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RobotOutlined style={{ fontSize: 24 }} />
            Connect Telegram
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
      styles={{
        header: {
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: 16,
        },
        body: {
          padding: '24px 32px',
        }
      }}
    >
      <div style={{ padding: '20px 0' }}>
        <Card 
          style={{ 
            border: 'none', 
            boxShadow: 'none',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: 12
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Status Display */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '16px',
                borderRadius: '50%',
                background: telegramStatus?.status === 'connected' ? '#f6ffed' : '#fff7e6',
                border: `2px solid ${telegramStatus?.status === 'connected' ? '#b7eb8f' : '#ffd591'}`,
                marginBottom: 12
              }}>
                {getStatusIcon()}
              </div>
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 18, color: telegramStatus?.status === 'connected' ? '#52c41a' : '#8B0000' }}>
                  {getStatusText()}
                </Text>
              </div>
            </div>

            {/* Connected State */}
            {telegramStatus?.status === 'connected' && (
              <Card 
                type="inner" 
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)', 
                  borderColor: '#91d5ff',
                  borderRadius: 8,
                  border: '1px solid #91d5ff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <SafetyOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <Text strong style={{ color: '#52c41a' }}>Successfully Connected!</Text>
                </div>
                <Text style={{ color: '#1890ff' }}>
                  Your Telegram account is now connected to TopCoach. You'll receive:
                </Text>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, color: '#1890ff' }}>
                  <li>Session confirmations</li>
                  <li>Session updates and changes</li>
                  <li>Session cancellations</li>
                </ul>
              </Card>
            )}

            {/* Connection Form */}
            {telegramStatus?.status !== 'connected' && (
              <div style={{ width: '100%' }}>
                {/* Steps */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 12,
                    padding: '12px 16px',
                    background: telegramStatus?.status === 'connected' ? '#f6ffed' : '#fff7e6',
                    borderRadius: 8,
                    border: `1px solid ${telegramStatus?.status === 'connected' ? '#b7eb8f' : '#ffd591'}`
                  }}>
                    <div style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: telegramStatus?.status === 'connected' ? '#52c41a' : '#faad14',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>1</Text>
                    </div>
                    <div>
                      <Text strong>Share Contact with Bot</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Open <a href="https://t.me/topcoach_official_bot" target="_blank" rel="noopener noreferrer">@topcoach_official_bot <SendOutlined /></a> and click <b>'Share my contact'</b>
                      </Text>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 12,
                    padding: '12px 16px',
                    background: '#f0f0f0',
                    borderRadius: 8,
                    border: '1px solid #d9d9d9'
                  }}>
                    <div style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: '#d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>2</Text>
                    </div>
                    <div>
                      <Text strong>Enter Verification Code</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Enter the 4-digit code you received from the bot
                      </Text>
                    </div>
                  </div>
                </div>
                
                <Divider style={{ margin: '24px 0' }} />
                
                <div style={{ 
                  background: '#fafafa', 
                  padding: '20px', 
                  borderRadius: 8, 
                  border: '1px solid #f0f0f0' 
                }}>
                  <Title level={5} style={{ marginBottom: 16, color: MAIN_RED }}>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    Enter Verification Details
                  </Title>
                  
                  <Input
                    placeholder="Phone number (e.g., +998901234567)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    prefix={<PhoneOutlined style={{ color: '#8B0000' }} />}
                    size="large"
                    style={{ 
                      margin: '12px 0',
                      borderRadius: 8,
                      border: '1px solid #d9d9d9'
                    }}
                  />
                  
                  <Input
                    placeholder="4-digit verification code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    size="large"
                    style={{ 
                      margin: '12px 0',
                      borderRadius: 8,
                      border: '1px solid #d9d9d9'
                    }}
                  />
                  
                  {errorMsg && (
                    <Alert
                      message={errorMsg}
                      type="error"
                      showIcon
                      style={{ marginBottom: 16, borderRadius: 8 }}
                    />
                  )}
                  
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={!phoneNumber.trim() || !otp.trim() || otp.length !== 4}
                    size="large"
                    style={{ 
                      width: '100%',
                      height: 48,
                      borderRadius: 8,
                      background: MAIN_RED,
                      borderColor: MAIN_RED,
                      fontSize: 16,
                      fontWeight: 600
                    }}
                    icon={<SafetyOutlined />}
                  >
                    {isLoading ? 'Verifying...' : 'Verify and Connect'}
                  </Button>
                </div>
              </div>
            )}
          </Space>
        </Card>
      </div>
    </Modal>
  );
};

export default TelegramConnectionModal; 