import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { CheckCircle2, Clock, AlertCircle, Key } from 'lucide-react';
import { useVerifyTelegramCodeMutation, useUnlinkTelegramMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import { RtkApi } from 'src/app/services/api';
import './TelegramConnectionModal.scss';

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
 *
 * Styled per TelegramConnectionModal.scss — the editorial language the rest
 * of My Journey uses (cream/serif/burgundy) rather than AntD defaults, so it
 * reads as one product whether it's mounted inside the settings modal or
 * inline in the onboarding wizard.
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
        "You'll stop receiving session confirmations, updates and cancellations on Telegram until you link an account again.",
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      // Portalled separately from the modal/inline content, so it needs its own class.
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

  // Refetch data on mount to ensure we have the latest status.
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = () => {
    switch (typedTelegramStatus?.status) {
      case 'connected':
        return <CheckCircle2 size={18} />;
      case 'pending':
        return <Clock size={18} />;
      case 'failed':
        return <AlertCircle size={18} />;
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

  return (
    <div>
      <div style={{ width: '100%' }}>
        <div>
          {/* Status reads as one calm line rather than a large centred
              icon block, matching the settings cards behind it. */}
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
                size="large"
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
  );
};

export default TelegramConnectionContent;
