import { Modal } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
// Import the JSON file
import upcomingEventTranslations from 'public/JSON/upcomingEventTranslations.json';

export default function useCurrentEvent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const navigate = useNavigate();

  const { i18n } = useTranslation();
  // Get the data based on the current language
  const upcomingEventData =
    upcomingEventTranslations[
      i18n.language as keyof typeof upcomingEventTranslations
    ];

  const showModal = () => {
    if (isAuthenticated) {
      setIsModalOpen(true);
    } else {
      Modal.confirm({
        title: 'You need to sign in first',
        content: 'Please sign in to apply for the event.',
        okText: 'Sign In',
        cancelText: 'Cancel',
        onOk() {
          navigate('/auth/signin?redirect=/events/apply');
        },
      });
    }
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onApplyClick = () => {
    navigate('apply');
  };

  return {
    showModal,
    handleOk,
    handleCancel,
    isModalOpen,
    upcomingEventData,
    onApplyClick,
  };
}

export const EVENT_DEADLINE = new Date('2025-05-30T18:59:00Z');
