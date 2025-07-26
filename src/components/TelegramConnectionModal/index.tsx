import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, Alert, Card, Divider, message } from 'antd';
import { PhoneOutlined, CheckCircleTwoTone, ClockCircleTwoTone, ExclamationCircleTwoTone, UserOutlined, SendOutlined } from '@ant-design/icons';
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [verifyTelegramOTP, { isLoading }] = useVerifyTelegramOTPMutation();
  const { data: telegramStatus, refetch } = useGetTelegramStatusQuery();
  const typedTelegramStatus = telegramStatus as { status: 'pending' | 'connected' | 'failed' | null; phoneNumber?: string; attempts: number; lastAttempt?: string } | undefined;

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || !otp.trim()) return;
    setErrorMsg('');
    try {
      await verifyTelegramOTP({ 
        phoneNumber: phoneNumber.trim(), 
        otp: otp.trim() 
      });
      message.success('Telegram connected successfully!');
      
      // Show loading state while updating status
      setIsUpdatingStatus(true);
      
      // Wait for backend to update database, then refetch
      setTimeout(async () => {
        await refetch();
        setIsUpdatingStatus(false);
        onClose();
      }, 1000);
    } catch (error: any) {
      const backendMsg = error?.data?.message || error?.message || 'Failed to verify OTP';
      setErrorMsg(backendMsg);
    }
  };

  // Refetch data when modal opens to ensure we have the latest status
  useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible, refetch]);

  const getStatusIcon = () => {
    switch (typedTelegramStatus?.status) {
      case 'connected':
        return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 48 }} />;
      case 'pending':
        return <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 48 }} />;
      case 'failed':
        return <ExclamationCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 48 }} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (typedTelegramStatus?.status) {
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

  // Custom stepper data and rendering
  const steps = [
    {
      title: 'Share Contact with Bot',
      description: (
        <>
          Open <a href="https://t.me/topcoach_official_bot" target="_blank" rel="noopener noreferrer">@topcoach_official_bot <SendOutlined /></a> and click <b>'Share my contact'</b>
        </>
      ),
      status: typedTelegramStatus?.status === 'connected' ? 'finish' : 'process',
    },
    {
      title: 'Enter Verification Code',
      description: 'Enter the 4-digit code you received from the bot',
      status: typedTelegramStatus?.status === 'connected' ? 'finish' : 'wait',
    },
    {
      title: 'Connection Complete',
      description: 'You will receive session confirmations and updates',
      status: typedTelegramStatus?.status === 'connected' ? 'finish' : 'wait',
    },
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0, color: MAIN_RED }}>
            Connect Telegram
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        <Card style={{ border: 'none', boxShadow: 'none' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Status Display */}
            <div style={{ textAlign: 'center' }}>
              {isUpdatingStatus ? (
                <div>
                  <div style={{ fontSize: 48, color: '#1890ff' }}>⏳</div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      Updating status...
                    </Text>
                  </div>
                </div>
              ) : (
                <>
                  {getStatusIcon()}
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {getStatusText()}
                    </Text>
                  </div>
                </>
              )}
            </div>

            {/* Connected State */}
            {(typedTelegramStatus?.status === 'connected' || isUpdatingStatus) && (
              <Card type="inner" style={{ width: '100%', background: '#e6f7ff', borderColor: '#91d5ff' }}>
                <Text>Your Telegram account is now connected to TopCoach.</Text>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>Session confirmations</li>
                  <li>Session updates and changes</li>
                  <li>Session cancellations</li>
                </ul>
              </Card>
            )}

            {/* Connection Form */}
            {typedTelegramStatus?.status !== 'connected' && !isUpdatingStatus && (
              <div style={{ width: '100%' }}>
                <Title level={5} style={{ marginBottom: 4 }}>Step 1: Share Contact</Title>
                <Text type="secondary">
                  Open <a href="https://t.me/topcoach_official_bot" target="_blank" rel="noopener noreferrer">@topcoach_official_bot</a> and click "Share my contact"
                </Text>
                
                <Divider />
                
                <Title level={5} style={{ marginBottom: 4 }}>Step 2: Enter Details</Title>
                <Text type="secondary">
                  Enter your phone number and the 4-digit verification code you received
                </Text>
                
                <Input
                  placeholder="Phone number (e.g., +998901234567)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  prefix={<PhoneOutlined />}
                  size="large"
                  style={{ margin: '12px 0' }}
                />
                
                <Input
                  placeholder="4-digit verification code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  size="large"
                  style={{ margin: '12px 0' }}
                />
                
                {errorMsg && (
                  <div style={{ color: '#ff4d4f', marginBottom: 8, marginTop: 4 }}>
                    {errorMsg}
                  </div>
                )}
                
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={isLoading || isUpdatingStatus}
                  disabled={!phoneNumber.trim() || !otp.trim() || otp.length !== 4}
                  size="large"
                  style={{ width: '100%' }}
                >
                  Verify and Connect
                </Button>
              </div>
            )}
          </Space>
        </Card>
      </div>
    </Modal>
  );
};

export default TelegramConnectionModal; 