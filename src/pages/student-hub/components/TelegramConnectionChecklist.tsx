/**
 * Telegram connection checklist for mentees — shown at top of My Journey until connected.
 * Hidden when connected or in read-only mode.
 */

import React, { useState } from 'react';
import { Card, Button } from 'antd';
import { useGetTelegramStatusQuery } from '../../../app/services/users';
import TelegramConnectionModal from '../../../components/TelegramConnectionModal';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';

const TELEGRAM_BLUE = '#0088cc';

interface TelegramConnectionChecklistProps {
  /** When true, do not fetch or render (e.g. read-only / counselor view) */
  skip?: boolean;
}

const TelegramConnectionChecklist: React.FC<TelegramConnectionChecklistProps> = ({ skip }) => {
  const [showModal, setShowModal] = useState(false);
  const { data: telegramStatus, refetch, isLoading } = useGetTelegramStatusQuery(undefined, { skip: !!skip });

  if (skip || isLoading) return null;
  const connected = telegramStatus?.status === 'connected';
  if (connected) return null;

  const buttonText = telegramStatus?.status === 'pending' ? 'Continue' : 'Connect';

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Card size="small" style={{ borderColor: TELEGRAM_BLUE, borderWidth: 2, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <UnifiedIcon name="user" size="md" style={{ color: TELEGRAM_BLUE }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>Complete your profile</span>
          </div>
          <div style={{ paddingTop: 8, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <UnifiedIcon name="message" size="sm" style={{ color: TELEGRAM_BLUE }} />
                <span>Telegram Connection</span>
              </span>
              <Button
                type="primary"
                size="middle"
                onClick={() => setShowModal(true)}
                style={{
                  backgroundColor: TELEGRAM_BLUE,
                  borderColor: TELEGRAM_BLUE,
                }}
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <TelegramConnectionModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setTimeout(() => refetch(), 500);
        }}
      />
    </>
  );
};

export default TelegramConnectionChecklist;
