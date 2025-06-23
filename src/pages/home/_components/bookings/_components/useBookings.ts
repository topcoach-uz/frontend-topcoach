import { Form, message } from 'antd';
import React, { useState } from 'react';
import { SessionsSchema } from 'src/app/api/Api';
import { useCancelSessionMutation } from 'src/app/services/sessions';

interface UpcomingCardProps extends SessionsSchema {
  onCancelOk?: (id: string) => void;
}

export default function useBookings({ onCancelOk, id }: UpcomingCardProps) {
  const [form] = Form.useForm();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const [cancelSession, { isLoading }] = useCancelSessionMutation();
  const handleCancelMeeting = async () => {
    try {
      await form.validateFields(); // runs validator inside Form.Item
    } catch {
      return;
    }

    const formValues = form.getFieldsValue();
    const finalReason =
      selectedReason === 'Other' ? formValues.customReason : selectedReason;

    if (!finalReason) {
      message.warning('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      await cancelSession({ id, reason: finalReason });
      message.success('Meeting canceled successfully');

      if (onCancelOk) {
        onCancelOk(id);
      }

      setIsModalVisible(false);
      setSelectedReason('');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Something went wrong');
      setIsModalVisible(false);
    } finally {
      setLoading(false);
    }
  };
  return { selectedReason, form, handleCancelMeeting, setSelectedReason };
}
