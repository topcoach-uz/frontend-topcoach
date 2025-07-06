import React, { useState } from 'react';
import { Modal, Input, Button, Typography, Space, Alert, Card, Divider, message } from 'antd';
import { PhoneOutlined, CheckCircleTwoTone, ClockCircleTwoTone, ExclamationCircleTwoTone, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useUpdateTelegramPhoneNumberMutation, useGetTelegramStatusQuery } from 'src/app/services/users';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [updateTelegramPhoneNumber, { isLoading }] = useUpdateTelegramPhoneNumberMutation();
  const { data: telegramStatus, refetch } = useGetTelegramStatusQuery();

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) return;
    setErrorMsg('');
    try {
      await updateTelegramPhoneNumber({ phoneNumber: phoneNumber.trim() });
      refetch();
    } catch (error: any) {
      const backendMsg = error?.data?.message || error?.message || 'Failed to update Telegram phone number';
      setErrorMsg(backendMsg);
      // No toast, just inline error
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
        return null;
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

  // Custom stepper data and rendering
  const steps = [
    {
      title: 'Add Telegram Phone Number',
      description: 'Enter the phone number associated with your Telegram account',
      status: telegramStatus?.phoneNumber ? 'finish' : 'process',
    },
    {
      title: 'Start Telegram Bot',
      description: (
        <>
          Open <a href="https://t.me/topcoach_official_bot" target="_blank" rel="noopener noreferrer">@topcoach_official_bot <SendOutlined /></a> and click <b>'Share my contact'</b>
        </>
      ),
      status: telegramStatus?.status === 'connected' ? 'finish' : telegramStatus?.status === 'pending' ? 'process' : 'wait',
    },
    {
      title: 'Connection Complete',
      description: 'You will receive session confirmations and updates',
      status: telegramStatus?.status === 'connected' ? 'finish' : 'wait',
    },
  ];

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={540}
      centered
      bodyStyle={{ padding: 0 }}
    >
      <Card
        style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: 'none' }}
        bodyStyle={{ padding: 32, paddingLeft: 32 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
          {/* Large Status Icon (only for known status) */}
          {getStatusIcon() && getStatusIcon()}
          <Title level={4} style={{ marginBottom: 0 }}>{getStatusText()}</Title>
          {telegramStatus?.status === 'connected' ? (
            <Text type="success">Your Telegram account is successfully connected. You will receive session notifications.</Text>
          ) : telegramStatus?.status === 'pending' ? (
            <Text type="warning">Please complete the connection by following the steps below.</Text>
          ) : telegramStatus?.status === 'failed' ? (
            <Text type="danger">Connection failed. Please try again.</Text>
          ) : (
            <Text type="secondary">Connect your Telegram account to receive notifications.</Text>
          )}

          <Divider style={{ margin: '1px 0' }} />

          {/* Custom Steps Card */}
          <div style={{ width: '100%' }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 5 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: step.status === 'finish' ? '#52c41a' : step.status === 'process' ? MAIN_RED : '#fff1f0',
                  color: step.status === 'finish' ? '#fff' : step.status === 'process' ? '#fff' : MAIN_RED,
                  fontWeight: 700,
                  fontSize: 16,
                  border: step.status === 'finish' ? '2px solid #52c41a' : step.status === 'process' ? `2px solid ${MAIN_RED}` : `2px solid ${MAIN_RED}33`,
                  marginRight: 16,
                  marginTop: 2,
                }}>
                  {step.status === 'finish' ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 20 }} /> : idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{step.title}</div>
                  <div style={{ color: '#888' }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Phone Number Input */}
          {telegramStatus?.status !== 'connected' && (
            <div style={{ width: '100%' }}>
              <Title level={5} style={{ marginBottom: 4 }}>Telegram Phone Number</Title>
              <Text type="secondary">
                Enter the phone number associated with your Telegram account (e.g., +998901234567)
              </Text>
              <Input
                placeholder="+998901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                prefix={<PhoneOutlined />}
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
                loading={isLoading}
                disabled={!phoneNumber.trim()}
                size="large"
                style={{ width: '100%' }}
              >
                {telegramStatus?.phoneNumber ? 'Update Phone Number' : 'Add Phone Number'}
              </Button>
            </div>
          )}

          {/* Instructions for Pending State */}
          {/* {telegramStatus?.status === 'pending' && (
            <Card type="inner" style={{ width: '100%', marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Text strong>Next Steps:</Text>
              <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>Open Telegram and search for <Text code>@topcoach_official_bot</Text></li>
                <li>Start the bot by clicking <Text code>Start</Text></li>
                <li>Click <Text code>Share my contact</Text> when prompted</li>
                <li>Wait for the success message</li>
              </ol>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Once connected, you'll receive notifications for session confirmations, updates, and cancellations.
              </Text>
            </Card>
          )} */}

          {/* Connected State */}
          {telegramStatus?.status === 'connected' && (
            <Card type="inner" style={{ width: '100%', marginTop: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Text>Your Telegram account is now connected to TopCoach.</Text>
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>Session confirmations</li>
                <li>Session updates and changes</li>
                <li>Session cancellations</li>
              </ul>
            </Card>
          )}
        </Space>
      </Card>
    </Modal>
  );
};

export default TelegramConnectionModal; 