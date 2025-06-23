import { Form, message } from 'antd';
import React, { useState } from 'react';
import {
  useCancelSessionMutation,
  useReportSessionMutation,
} from 'src/app/services/sessions';

export default function UpcamingCards() {
  const [loading, setLoading] = useState<boolean>(false);
  const [reportMentor, { isLoading: reportLoading }] =
    useReportSessionMutation();
  const [cancelSession, { isLoading }] = useCancelSessionMutation();

  const [form] = Form.useForm();
  // modal states
  const [isModalVisibleReport, setIsModalVisibleReport] =
    useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  //report meeting
  const [selectedReportReason, setSelectedReportReason] = useState<string>('');
  const handleReportMeeting = async () => {
    console.log('report send');
    try {
      await form.validateFields(); // runs validator inside Form.Item
    } catch {
      return;
    }

    const values = form.getFieldsValue();
    // @ts-ignore
    const subjectId = mentor?.id;
    const finalReport = selectedReportReason;
    const finalComment = values.reportText;

    if (!finalReport) {
      message.warning('Please select a reason');
      return;
    }

    setLoading(true);

    try {
      await reportMentor({
        subjectId,
        reasons: [finalReport],
        comment: finalComment,
      });
      setIsModalVisibleReport(false);
      setSelectedReportReason('');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  // cancel meeting
  const [selectedReason, setSelectedReason] = useState<string>('');

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
      //   await cancelSession({ id, reason: finalReason });
      message.success('Meeting canceled successfully');

      //   if (onCancelOk) {
      //     onCancelOk(id);
      //   }

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
  return {
    form,
    loading,
    setLoading,
    //report meeting
    isModalVisibleReport,
    selectedReportReason,
    reportLoading,
    setIsModalVisibleReport,
    handleReportMeeting,
    setSelectedReportReason,
    // cancel meeting
    isModalVisible,
  };
}
