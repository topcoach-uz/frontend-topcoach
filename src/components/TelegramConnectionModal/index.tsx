import React from 'react';
import { Modal } from 'antd';
import { Send } from 'lucide-react';
import TelegramConnectionContent from './TelegramConnectionContent';
import './TelegramConnectionModal.scss';

interface TelegramConnectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const TelegramConnectionModal: React.FC<TelegramConnectionModalProps> = ({
  visible,
  onClose,
}) => {
  // TelegramConnectionContent refetches the status query itself on mount,
  // and AntD Modal mounts its children fresh each time it opens (no
  // forceRender/destroyOnClose here), so "refetch on open" already happens
  // without a separate query subscription in this wrapper.

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
      {/* onConnected fires after the connect flow's own status-refetch delay
          settles (see TelegramConnectionContent) — matches the modal's
          original auto-close-on-success behavior exactly. */}
      <TelegramConnectionContent onConnected={onClose} />
    </Modal>
  );
};

export default TelegramConnectionModal;
