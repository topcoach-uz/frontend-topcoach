import React, { useState } from 'react';
import CustomModal from 'src/components/common/modal';
import { Form, Input, Button, Select, Alert } from 'antd';

const { Option } = Select;

interface PaymentModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (paymentInfo: { cardToken: string; smsCode: string; method: string }) => Promise<void>;
  plan: { name: string; price: number };
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onCancel, onSubmit, plan }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (err: any) {
      setError(err.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal
      open={visible}
      onCancel={onCancel}
      title={`Subscribe to ${plan.name}`}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <b>Amount:</b> {plan.price === 0 ? 'Free' : `$${plan.price}`}
      </div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="cardToken" label="Card Token" rules={[{ required: true, message: 'Card token is required' }]}> 
          <Input placeholder="Card token" autoFocus />
        </Form.Item>
        <Form.Item name="smsCode" label="SMS Code" rules={[{ required: true, message: 'SMS code is required' }]}> 
          <Input placeholder="SMS code" />
        </Form.Item>
        <Form.Item name="method" label="Payment Method" rules={[{ required: true, message: 'Payment method is required' }]}> 
          <Select placeholder="Select payment method">
            <Option value="payme">Payme</Option>
            <Option value="click">Click</Option>
            <Option value="atmos">Atmos</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Pay & Subscribe
          </Button>
        </Form.Item>
      </Form>
    </CustomModal>
  );
};

export default PaymentModal; 