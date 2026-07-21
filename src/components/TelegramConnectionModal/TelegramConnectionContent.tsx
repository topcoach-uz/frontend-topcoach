import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, Alert, Card, Divider, message } from 'antd';
import { CheckCircle2, Clock, AlertCircle, Send, Key } from 'lucide-react';
import { useVerifyTelegramCodeMutation, useUnlinkTelegramMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import { RtkApi } from 'src/app/services/api';

const { Title, Text } = Typography;

interface TelegramConnectionContentProps {
  /**
   * Called once the account has finished connecting (after the status
   * query has been refetched and reflects `status === 'connected'`).
   * The Modal wrapper uses this to auto-close; the onboarding wizard step
   * uses it to auto-advance.
   */
  onConnected?: () => void;
}

/**
 * The actual Telegram-connect UI (status display, connected card w/
 * Disconnect/Re-link, and the share-contact + code-entry form) — extracted
 * out of TelegramConnectionModal so it can be reused inline inside the
 * onboarding wizard's Step 3, not just inside a Modal. Behavior is
 * unchanged from the original inline implementation; only the
 * close-on-success side effect moved to the optional `onConnected` callback.
 */
const TelegramConnectionContent: React.FC<TelegramConnectionContentProps> = ({ onConnected }) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [verifyTelegramCode, { isLoading }] = useVerifyTelegramCodeMutation();
  const [unlinkTelegram, { isLoading: isUnlinking }] = useUnlinkTelegramMutation();
  const { data: telegramStatus, refetch } = useGetTelegramStatusQuery();
  const typedTelegramStatus = telegramStatus as { status: 'pending' | 'connected' | 'failed' | null; phoneNumber?: string; attempts: number; lastAttempt?: string } | undefined;

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setErrorMsg('');

    try {
      const result = await verifyTelegramCode({
        code: code.trim()
      }).unwrap(); // Use unwrap() to properly handle errors

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
            onConnected?.();
          }, 500);
        }, 1000);
      } else {
        // Handle case where result exists but success is false
        setErrorMsg(result?.message || 'Failed to verify code');
      }
    } catch (error: any) {
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

  const handleUnlink = () => {
    Modal.confirm({
      title: 'Disconnect Telegram?',
      content:
        "You'll stop receiving session confirmations, updates, and cancellations on Telegram until you re-link your account.",
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await unlinkTelegram().unwrap();
          message.success('Telegram disconnected');
          setCode('');
          setErrorMsg('');
          RtkApi.util.invalidateTags(['TelegramStatus']);
          await refetch();
        } catch (error: any) {
          const errorMessage =
            error?.data?.message || error?.error?.data?.message || error?.message || 'Failed to disconnect Telegram';
          message.error(errorMessage);
        }
      },
    });
  };

  // Refetch data on mount to ensure we have the latest status.
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = () => {
    switch (typedTelegramStatus?.status) {
      case 'connected':
        return <CheckCircle2 size={48} color="#52c41a" />;
      case 'pending':
        return <Clock size={48} color="#faad14" />;
      case 'failed':
        return <AlertCircle size={48} color="#ff4d4f" />;
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

  return (
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
              <Divider style={{ margin: '12px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connected to a different Telegram? Disconnect to link another account.
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button danger size="small" loading={isUnlinking} onClick={handleUnlink}>
                  Disconnect / Re-link Telegram
                </Button>
              </div>
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
                prefix={<Key size={16} />}
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
  );
};

export default TelegramConnectionContent;
