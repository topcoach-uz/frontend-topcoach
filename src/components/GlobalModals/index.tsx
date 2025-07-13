import React from 'react';
import { Modal, Button, Typography } from 'antd';
import { useTypedSelector, useAppDispatch } from 'src/app/store';
import { hide } from 'src/app/slices/profilePopupSlice';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const ProfilePopupModal: React.FC = () => {
  const visible = useTypedSelector((state) => state.profilePopup.visible);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleGoHome = () => {
    dispatch(hide());
    navigate('/');
  };

  const handleCancel = () => {
    dispatch(hide());
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      centered
      closable={false}
      width={440}
      bodyStyle={{ textAlign: 'center', padding: '18px 18px 24px 18px', borderRadius: 16 }}
      maskStyle={{ background: 'rgba(0,0,0,0.15)' }}
    >
      <Text strong style={{ fontSize: 16, lineHeight: 1.5 }}>
        You must complete your profile<br />
        <span style={{ whiteSpace: 'nowrap' }}>(phone number and Telegram connection)</span><br />
        before using this feature.
      </Text>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Button type="primary" onClick={handleGoHome} style={{ minWidth: 110 }}>
          Go to Home
        </Button>
        <Button onClick={handleCancel} style={{ minWidth: 80 }}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export const GlobalModals: React.FC = () => {
  return <ProfilePopupModal />;
}; 