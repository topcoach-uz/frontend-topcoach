import { phoneMask } from 'src/constants/form';
import InputFormItem, { InputFormItemProps } from '../common/InputFormItem';
import { Modal, Form, Input, Button, Space } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneOutlined } from '@ant-design/icons';

interface Props extends InputFormItemProps {}

interface PhoneNumberModalProps {
  visible: boolean;
  onSubmit: (phoneNumber: string) => void;
  onCancel: () => void;
  loading?: boolean;
  initialPhoneNumber?: string;
}

export default function PhoneFormItem({ mask, ...rest }: Props) {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  return (
    <InputFormItem
      name="phone"
      label="Telefon raqam"
      message="Telefon raqamni kiriting"
      mask={mask || phoneMask}
      addonBefore="+998"
      {...rest}
    />
  );
}

export function PhoneNumberModal({
  visible,
  onSubmit,
  onCancel,
  loading = false,
  initialPhoneNumber = '',
}: PhoneNumberModalProps) {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // International phone number validation: +[country code][number] (7-15 chars total)
  const internationalPhonePattern = /^\+[1-9]\d{1,14}$/;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      title={<div style={{ textAlign: 'center', fontWeight: 600 }}>{t('editProfile.phoneNumberLabel')}</div>}
      maskClosable={false}
      destroyOnClose
      centered
    >
      <div style={{ marginBottom: 16, textAlign: 'center', color: '#888' }}>
        Please enter your phone number to continue.
      </div>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ phoneNumber: initialPhoneNumber }}
      >
        <Form.Item
          name="phoneNumber"
          label={t('editProfile.phoneNumberLabel')}
          rules={[
            { required: true, message: t('Phone number is required') },
            { pattern: internationalPhonePattern, message: 'Please enter a valid phone number (e.g., +998901234567, +1234567890)' },
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="e.g. +998901234567 or +1234567890"
            autoFocus
            maxLength={15}
            size="large"
          />
        </Form.Item>
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button onClick={onCancel} style={{ minWidth: 100 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={async () => {
              try {
                const values = await form.validateFields();
                onSubmit(values.phoneNumber);
              } catch (err) {
                // Validation error, do nothing
              }
            }}
            loading={loading}
            style={{ minWidth: 100 }}
          >
            Save
          </Button>
        </Space>
      </Form>
    </Modal>
  );
}
