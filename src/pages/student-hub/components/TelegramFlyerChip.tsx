/**
 * Compact "flyer" chip that prompts the student to connect Telegram.
 *
 * Replaces the old full-width `TelegramConnectionChecklist` card on the
 * non-Community dashboard with a small dark ribbon/tag pinned as a
 * floating tab on the LEFT edge of the viewport (vertically centered) —
 * the bottom-right corner is already occupied by the global chat FAB, so
 * left was picked to avoid collision. Same show/hide + Connect vs.
 * Continue logic as the checklist it replaces (mirrors
 * `TelegramConnectionChecklist.tsx`, which is still used elsewhere —
 * e.g. `Dashboard.tsx` — so it was left untouched). Mounted page-scoped
 * from `MyProgressEditorialView`, not a global layout.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  // Portaled straight to <body> — MyProgressEditorialView renders inside
  // CommunityHubMockPage's section-swap transition wrapper, which sets a
  // (identity) CSS `transform`. Any non-`none` transform on an ancestor
  // becomes the containing block for `position: fixed` descendants, so
  // without the portal this tab would anchor to that wrapper instead of
  // the viewport. Still page-scoped: it unmounts with MyProgressEditorialView.
  return createPortal(
    <>
      <button
        type="button"
        className="tg-flyer"
        onClick={() => setShowModal(true)}
        aria-label={label}
      >
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
    </>,
    document.body,
  );
};

export default TelegramFlyerChip;
