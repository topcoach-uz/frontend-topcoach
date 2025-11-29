import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Switch, Button, message, Card, Divider } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface LessonFormProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const LessonForm: React.FC<LessonFormProps> = ({ initialValues, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [videoType, setVideoType] = useState<'regular' | 'vdocipher'>('vdocipher');

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setVideoType(initialValues.useVdoCipher ? 'vdocipher' : 'regular');
    }
  }, [initialValues, form]);

  const handleSubmit = (values: any) => {
    const lessonData = {
      ...values,
      useVdoCipher: videoType === 'vdocipher',
      vdocipherVideoId: videoType === 'vdocipher' ? values.vdocipherVideoId : undefined,
      contentUrl: videoType === 'regular' ? values.contentUrl : undefined,
    };

    onSubmit(lessonData);
  };

  const validateVdoCipherVideoId = (_: any, value: string) => {
    if (videoType === 'vdocipher' && !value) {
      return Promise.reject(new Error('VdoCipher Video ID is required'));
    }
    return Promise.resolve();
  };

  const validateContentUrl = (_: any, value: string) => {
    if (videoType === 'regular' && !value) {
      return Promise.reject(new Error('Content URL is required'));
    }
    return Promise.resolve();
  };

  return (
    <Card title="Lesson Configuration" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          lessonType: 'video',
          isActive: true,
          isPremium: false,
          duration: 10,
          orderIndex: 1,
        }}
      >
        {/* Basic Information */}
        <Form.Item
          name="title"
          label="Lesson Title"
          rules={[{ required: true, message: 'Please enter lesson title' }]}
        >
          <Input placeholder="Enter lesson title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Enter lesson description" />
        </Form.Item>

        <Form.Item
          name="lessonType"
          label="Lesson Type"
          rules={[{ required: true, message: 'Please select lesson type' }]}
        >
          <Select>
            <Option value="video">Video</Option>
            <Option value="pdf">PDF</Option>
            <Option value="live_session">Live Session</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (minutes)"
          rules={[{ required: true, message: 'Please enter duration' }]}
        >
          <InputNumber min={1} max={480} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="orderIndex"
          label="Order Index"
          rules={[{ required: true, message: 'Please enter order index' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="isPremium"
          label="Premium Lesson"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        {/* Video Configuration */}
        <Divider orientation="left">Video Configuration</Divider>

        <Form.Item
          label="Video Type"
          required
        >
          <Select
            value={videoType}
            onChange={setVideoType}
            style={{ width: '100%' }}
          >
            <Option value="regular">Regular Video (URL/File)</Option>
            <Option value="vdocipher">VdoCipher Secure Video</Option>
          </Select>
        </Form.Item>

        {videoType === 'regular' && (
          <Form.Item
            name="contentUrl"
            label="Video URL"
            rules={[
              { required: true, message: 'Please enter video URL' },
              { validator: validateContentUrl }
            ]}
          >
            <Input 
              placeholder="Enter video URL (YouTube, Google Drive, etc.)" 
              addonBefore={<UploadOutlined />}
            />
          </Form.Item>
        )}

        {videoType === 'vdocipher' && (
          <>
            <Form.Item
              name="vdocipherVideoId"
              label="VdoCipher Video ID"
              rules={[
                { required: true, message: 'Please enter VdoCipher Video ID' },
                { validator: validateVdoCipherVideoId }
              ]}
            >
              <Input 
                placeholder="Enter VdoCipher Video ID (e.g., 1234567890abcdef)" 
                addonBefore={<PlusOutlined />}
              />
            </Form.Item>

            <Card 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
            >
              <h4 style={{ color: '#52c41a', margin: 0 }}>🔒 VdoCipher Security Features</h4>
            </Card>
          </>
        )}

        {/* Submit Button */}
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            style={{ width: '100%' }}
          >
            {initialValues ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LessonForm; 