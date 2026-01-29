import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSubmitMentorRequestMutation } from 'src/app/services/contactApi';

interface RequestSessionModalProps {
  open: boolean;
  onClose: () => void;
  mentorName: string;
  mentorId: string;
}

export default function RequestSessionModal({
  open,
  onClose,
  mentorName,
  mentorId,
}: RequestSessionModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitMentorRequest, { isLoading: loading }] = useSubmitMentorRequestMutation();

  const handleSubmit = async (values: any) => {
    try {
      await submitMentorRequest({
        mentorId,
        mentorName,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        preferredDates: values.preferredDates,
        message: '', // Empty message since we removed the field
      }).unwrap();
      
      message.success(t('mentors.requestSession.success'));
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(t('mentors.requestSession.error'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('mentors.requestSession.title', { mentorName })}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          {t('mentors.requestSession.description')}
        </p>

        <div style={{ 
          background: '#e8f4fd', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          borderLeft: '4px solid #1890ff'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#1890ff', fontWeight: '500' }}>
            📅 <strong>{t('mentors.requestSession.notificationTitle')}</strong>
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
            {t('mentors.requestSession.notificationText')}
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="fullName"
            label={t('mentors.requestSession.fullName')}
            rules={[
              { required: true, message: t('mentors.requestSession.fullNameRequired') },
              { min: 2, message: t('mentors.requestSession.fullNameMin') }
            ]}
          >
            <Input
              placeholder={t('mentors.requestSession.fullNamePlaceholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label={t('mentors.requestSession.phoneNumber')}
            rules={[
              { required: true, message: t('mentors.requestSession.phoneNumberRequired') },
              { pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/, message: t('mentors.requestSession.phoneNumberInvalid') }
            ]}
          >
            <Input
              placeholder={t('mentors.requestSession.phoneNumberPlaceholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="preferredDates"
            label={t('mentors.requestSession.preferredDates')}
            rules={[
              { required: true, message: t('mentors.requestSession.preferredDatesRequired') },
              { min: 5, message: t('mentors.requestSession.preferredDatesMin') }
            ]}
          >
            <Input.TextArea
              placeholder={t('mentors.requestSession.preferredDatesPlaceholder')}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <Button size="large" onClick={handleCancel}>
              {t('btn.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                backgroundColor: '#8b0000',
                borderColor: '#8b0000',
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {t('mentors.requestSession.submit')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}