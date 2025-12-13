import { Modal, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, LinkOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import styles from './RegistrationModal.module.scss';

const { Title, Text } = Typography;

interface RegistrationModalProps {
  visible: boolean;
  eventId: string;
  eventTitle: string;
  eventType: 'event' | 'workshop';
  onClose: (success?: boolean) => void;
}

export default function RegistrationModal({
  visible,
  eventId,
  eventTitle,
  eventType,
  onClose
}: RegistrationModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { name: string; email: string }) => {
    setLoading(true);
    try {
      // Call the registration API
      if (eventType === 'workshop') {
        await api.request({
          path: `/camps/workshops/${eventId}/register`,
          method: 'POST',
          secure: true,
        });
      } else {
        await api.request({
          path: `/camps/events/${eventId}/register`,
          method: 'POST',
          secure: true,
        });
      }

      message.success(t('events.registrationSuccess'));
      form.resetFields();
      onClose(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle 401 Unauthorized with a clearer message
      if (error.response?.status === 401) {
        message.error(t('events.signInRequired') || 'You need to sign in first to register for workshops.');
        onClose(false);
        return;
      }
      
      message.error(error.response?.data?.message || t('events.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Check if this is the "Become a Startup Ambassador in your district!" event
  const isStartupScoutEvent = eventTitle.toLowerCase().includes('a startup ambassador in your district!');
  const ambassadorLink = 'https://ambassador.topcoach.uz';

  return (
    <Modal
      title={
        <div className={styles.modal_header}>
          <Title level={3} className={styles.modal_title}>
            {t('events.registerFor')} {eventTitle}
          </Title>
          <Text className={styles.modal_subtitle}>
            {eventType === 'workshop' ? t('events.workshopRegistration') : t('events.eventRegistration')}
          </Text>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={480}
      className={styles.registration_modal}
      centered
    >
      <div className={styles.modal_content}>
        {isStartupScoutEvent ? (
          <div className={styles.ambassador_link_section}>
            <Text className={styles.ambassador_link_text}>
              <span className={styles.link_line}>
                Go to{' '}
                <a 
                  href={ambassadorLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.ambassador_link}
                >
                  {ambassadorLink}
                </a>
              </span>
              <span className={styles.link_line}>and submit your application</span>
            </Text>
          </div>
        ) : (
          <>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className={styles.registration_form}
            >
              <Form.Item
                name="name"
                label={t('events.fullName')}
                rules={[
                  { required: true, message: t('events.nameRequired') },
                  { min: 2, message: t('events.nameMinLength') }
                ]}
              >
                <Input
                  prefix={<UserOutlined className={styles.input_icon} />}
                  placeholder={t('events.enterFullName')}
                  size="large"
                  className={styles.form_input}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('events.email')}
                rules={[
                  { required: true, message: t('events.emailRequired') },
                  { type: 'email', message: t('events.emailInvalid') }
                ]}
              >
                <Input
                  prefix={<MailOutlined className={styles.input_icon} />}
                  placeholder={t('events.enterEmail')}
                  size="large"
                  className={styles.form_input}
                />
              </Form.Item>

              <div className={styles.registration_info}>
                <Space direction="vertical" size="small">
                  <Text className={styles.info_text}>
                    <CalendarOutlined className={styles.info_icon} />
                    {t('events.registrationConfirmation')}
                  </Text>
                  <Text className={styles.info_text}>
                    <MailOutlined className={styles.info_icon} />
                    {t('events.emailConfirmation')}
                  </Text>
                </Space>
              </div>

              <div className={styles.form_actions}>
                <Button
                  onClick={handleCancel}
                  size="large"
                  className={styles.cancel_button}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className={styles.submit_button}
                >
                  {t('events.registerNow')}
                </Button>
              </div>
            </Form>
          </>
        )}
      </div>
    </Modal>
  );
}
