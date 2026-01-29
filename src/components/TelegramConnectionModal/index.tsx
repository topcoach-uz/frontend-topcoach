import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, Alert, Card, Divider, message } from 'antd';
import { PhoneOutlined, CheckCircleTwoTone, ClockCircleTwoTone, ExclamationCircleTwoTone, UserOutlined, SendOutlined, KeyOutlined } from '@ant-design/icons';
import { useVerifyTelegramCodeMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import { RtkApi } from 'src/app/services/api';

const { Title, Text } = Typography;

interface TelegramConnectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const TelegramConnectionModal: React.FC<TelegramConnectionModalProps> = ({
  visible,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [verifyTelegramCode, { isLoading }] = useVerifyTelegramCodeMutation();
  const { data: telegramStatus, refetch } = useGetTelegramStatusQuery();
  const typedTelegramStatus = telegramStatus as { status: 'pending' | 'connected' | 'failed' | null; phoneNumber?: string; attempts: number; lastAttempt?: string } | undefined;

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setErrorMsg('');
    
    console.log('Attempting to verify code:', code.trim());
    
    try {
      const result = await verifyTelegramCode({ 
        code: code.trim()
      }).unwrap(); // Use unwrap() to properly handle errors
      
      console.log('Verification result:', result);
      
      // Only show success if we actually got a successful result
      if (result && result.success) {
        message.success('Telegram connected successfully!');
        
        // Show loading state while updating status
        setIsUpdatingStatus(true);
        
        // Manually invalidate cache and force refetch
        RtkApi.util.invalidateTags(['TelegramStatus']);
        
        // Wait for backend to update database, then refetch
        setTimeout(async () => {
          await refetch();
          // Second refetch after a short delay
          setTimeout(async () => {
            await refetch();
            setIsUpdatingStatus(false);
            onClose();
          }, 500);
        }, 1000);
      } else {
        // Handle case where result exists but success is false
        setErrorMsg(result?.message || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      // Handle different error formats
      let errorMessage = 'Failed to verify code';
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.error?.data?.message) {
        errorMessage = error.error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setErrorMsg(errorMessage);
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

  const CRIMSON = '#8b0000';

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
      title: 'Enter Connection Code',
      description: 'Enter the 6-character code you received from the bot',
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
        <div style={{ textAlign: 'center', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={3} style={{ margin: 0, color: CRIMSON, fontWeight: 700, fontSize: 22, letterSpacing: '0.02em' }}>
            Connect Telegram
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      styles={{ body: { paddingTop: 12 } }}
    >
      <div style={{ padding: '0' }}>
        <Card style={{ border: 'none', boxShadow: 'none' }} bodyStyle={{ padding: 0 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Status Display */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              {isUpdatingStatus ? (
                <div>
                  <div style={{ fontSize: 48, color: '#1890ff' }}>⏳</div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16, color: CRIMSON }}>
                      Status: Updating...
                    </Text>
                  </div>
                </div>
              ) : (
                <>
                  {getStatusIcon()}
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16, color: CRIMSON, fontWeight: 600 }}>
                      Status: {getStatusText()}
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
                
                <Title level={5} style={{ marginBottom: 4 }}>Step 2: Enter Connection Code</Title>
                <Text type="secondary">
                  Enter the 6-character connection code you received from the bot
                </Text>
                
                <Input
                  placeholder="6-character connection code (e.g., A1B2C3)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6))}
                  maxLength={6}
                  prefix={<KeyOutlined />}
                  size="large"
                  style={{ margin: '12px 0' }}
                />
                
                <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
                  💡 <strong>Tips:</strong> Make sure you're using the code from the Telegram bot, not your phone number. 
                  Codes are case-insensitive and expire after 10 minutes.
                </div>
                
                {errorMsg && (
                  <Alert
                    message="Connection Failed"
                    description={errorMsg}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                      <Button size="small" type="link" onClick={() => setErrorMsg('')}>
                        Dismiss
                      </Button>
                    }
                  />
                )}
                
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={isLoading || isUpdatingStatus}
                  disabled={!code.trim() || code.length !== 6}
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