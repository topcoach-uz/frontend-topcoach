import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { Phone, CheckCircle2, Clock, AlertCircle, User, Send, Key } from 'lucide-react';
import { useVerifyTelegramCodeMutation, useUnlinkTelegramMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import { RtkApi } from 'src/app/services/api';
import './TelegramConnectionModal.scss';

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
  const [unlinkTelegram, { isLoading: isUnlinking }] = useUnlinkTelegramMutation();
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

  const handleUnlink = () => {
    Modal.confirm({
      title: 'Disconnect Telegram?',
      content:
        "You'll stop receiving session confirmations, updates and cancellations on Telegram until you link an account again.",
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      // Portalled separately from the modal below, so it needs its own class.
      className: 'tc-telegram-confirm',
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

  // Refetch data when modal opens to ensure we have the latest status
  useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible, refetch]);

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


  // Custom stepper data and rendering
  const steps = [
    {
      title: 'Share Contact with Bot',
      description: (
        <>
          Open <a href="https://t.me/topcoach_official_bot" target="_blank" rel="noopener noreferrer">@topcoach_official_bot <Send size={16} /></a> and click <b>'Share my contact'</b>
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
        <h2 className="tc-tg-title">
          <Send size={17} />
          Connect Telegram
        </h2>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      className="tc-telegram-modal"
    >
      <div>
        <div style={{ width: '100%' }}>
          <div>
            {/* Status reads as one calm line rather than a large centred
                icon block, matching the settings cards behind the modal. */}
            <div
              className={`tc-tg-status${
                typedTelegramStatus?.status === 'connected' && !isUpdatingStatus
                  ? ' tc-tg-status--connected'
                  : ''
              }`}
            >
              {isUpdatingStatus ? <Clock size={18} /> : getStatusIcon()}
              <div>
                <div className="tc-tg-statusText">
                  {isUpdatingStatus ? 'Updating…' : getStatusText()}
                </div>
                {typedTelegramStatus?.status === 'connected' &&
                  !isUpdatingStatus && (
                    <div className="tc-tg-statusSub">
                      You'll get session updates on Telegram.
                    </div>
                  )}
              </div>
            </div>

            {/* Connected State */}
            {(typedTelegramStatus?.status === 'connected' || isUpdatingStatus) && (
              <div className="tc-tg-panel">
                <p className="tc-tg-panelLead">You'll receive:</p>
                <ul className="tc-tg-list">
                  <li>Session confirmations</li>
                  <li>Session updates and changes</li>
                  <li>Session cancellations</li>
                </ul>
                <hr className="tc-tg-divider" />
                <p className="tc-tg-note">
                  Linked to the wrong Telegram? Disconnect to link a different
                  account.
                </p>
                <Button
                  className="tc-tg-ghostBtn"
                  loading={isUnlinking}
                  onClick={handleUnlink}
                >
                  Disconnect
                </Button>
              </div>
            )}

            {/* Connection Form */}
            {typedTelegramStatus?.status !== 'connected' && !isUpdatingStatus && (
              <div style={{ width: '100%' }}>
                <h3 className="tc-tg-stepTitle">1. Share your contact</h3>
                <p className="tc-tg-stepHint">
                  Open{' '}
                  <a
                    href="https://t.me/topcoach_official_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @topcoach_official_bot
                  </a>{' '}
                  and tap "Share my contact".
                </p>

                <hr className="tc-tg-divider" />

                <h3 className="tc-tg-stepTitle">2. Enter the code</h3>
                <p className="tc-tg-stepHint">
                  The bot replies with a 6-character code.
                </p>

                <Input
                  className="tc-tg-codeInput"
                  placeholder="A1B2C3"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6))}
                  maxLength={6}
                  prefix={<Key size={16} />}
                />

                <div className="tc-tg-tips">
                  Use the code from the bot, not your phone number. Codes expire
                  after 10 minutes.
                </div>

                {errorMsg && (
                  <div className="tc-tg-error" role="alert">
                    <strong>We couldn't connect that code</strong>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  className="tc-tg-submit"
                  type="primary"
                  onClick={handleSubmit}
                  loading={isLoading || isUpdatingStatus}
                  disabled={!code.trim() || code.length !== 6}
                >
                  Verify and connect
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TelegramConnectionModal; 