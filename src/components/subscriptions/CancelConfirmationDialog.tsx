import React from 'react';
import CustomModal from 'src/components/common/modal';
import { Button } from 'antd';

interface CancelConfirmationDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

const CancelConfirmationDialog: React.FC<CancelConfirmationDialogProps> = ({ visible, onCancel, onConfirm, loading }) => {
  return (
    <CustomModal
      open={visible}
      onCancel={onCancel}
      title="Cancel Subscription"
      footer={null}
    >
      <div style={{ marginBottom: 24 }}>
        Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Keep Subscription
        </Button>
        <Button type="primary" danger onClick={onConfirm} loading={loading}>
          Cancel Subscription
        </Button>
      </div>
    </CustomModal>
  );
};

export default CancelConfirmationDialog; 