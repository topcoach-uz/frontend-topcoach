import React from 'react';
import { Modal, Typography } from 'antd';
import TelegramConnectionContent from './TelegramConnectionContent';

const { Title } = Typography;

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
  const CRIMSON = '#8b0000';

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
      {/* onConnected fires after the connect flow's own status-refetch delay
          settles (see TelegramConnectionContent) — matches the modal's
          original auto-close-on-success behavior exactly. */}
      <TelegramConnectionContent onConnected={onClose} />
    </Modal>
  );
};

export default TelegramConnectionModal;
