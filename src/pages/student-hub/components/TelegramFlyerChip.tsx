/**
 * Compact "flyer" chip that prompts the student to connect Telegram.
 *
 * Replaces the old full-width `TelegramConnectionChecklist` card on the
 * non-Community dashboard with a small, left-aligned dark ribbon/tag —
 * a lighter-weight nudge that sits under the Major Match video instead
 * of occupying a full header-width card. Same show/hide + Connect vs.
 * Continue logic as the checklist it replaces (mirrors
 * `TelegramConnectionChecklist.tsx`, which is still used elsewhere —
 * e.g. `Dashboard.tsx` — so it was left untouched).
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import TelegramConnectionModal from 'src/components/TelegramConnectionModal';
import './TelegramFlyerChip.scss';

const TelegramFlyerChip: React.FC = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const { data: telegramStatus, refetch, isLoading } = useGetTelegramStatusQuery(undefined);

  if (isLoading) return null;
  const connected = telegramStatus?.status === 'connected';
  if (connected) return null;

  const label =
    telegramStatus?.status === 'pending'
      ? t('studentHub.myProgress.telegramFlyerContinue', 'Continue on Telegram')
      : t('studentHub.myProgress.telegramFlyerConnect', 'Connect Telegram');

  return (
    <>
      <button type="button" className="tg-flyer" onClick={() => setShowModal(true)}>
        <Send size={13} className="tg-flyer__icon" aria-hidden="true" />
        <span className="tg-flyer__label">{label}</span>
        <span className="tg-flyer__chevron" aria-hidden="true">
          ›
        </span>
      </button>
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

export default TelegramFlyerChip;
