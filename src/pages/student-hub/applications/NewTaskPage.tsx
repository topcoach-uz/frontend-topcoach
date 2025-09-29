import React, { useState } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useCreateApplicationTaskMutation } from '../../../app/services/student-hub/applicationTrackingApi';
import './NewTaskPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const NewTaskPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [createApplicationTask, { isLoading }] = useCreateApplicationTaskMutation();

  const handleSubmit = async (values: any) => {
    try {
      console.log('Creating task:', values);
      
      // Transform form values to API format
      const taskData = {
        title: values.title,
        description: values.description,
        taskType: values.taskType || 'document',
        status: values.status || 'pending',
        priority: values.priority || 'medium',
        dueDate: values.dueDate?.toISOString(),
        collegeApplicationId: values.collegeApplicationId,
        metadata: {}
      };
      
      await createApplicationTask(taskData).unwrap();
      
      message.success('Task created successfully!');
      navigate('/student-hub/applications?tab=tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/student-hub/applications?tab=tasks');
  };

  return (
    <div className="new-task-page">
      <div className="page-header">
        <h1 className="page-title">Add New Task</h1>
        <p className="page-subtitle">Create a new application task</p>
      </div>

      <Card className="task-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="task-form"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Task Title"
                rules={[{ required: true, message: 'Please enter task title' }]}
              >
                <Input
                  placeholder="e.g., Submit transcripts, Write essay, Request recommendation"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="Task Type"
                rules={[{ required: true, message: 'Please select task type' }]}
              >
                <Select placeholder="Select type" size="large">
                  <Option value="document">Document Submission</Option>
                  <Option value="essay">Essay Writing</Option>
                  <Option value="recommendation">Recommendation Request</Option>
                  <Option value="test_score">Test Score Submission</Option>
                  <Option value="interview">Interview</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority" size="large">
                  <Option value="high">High Priority</Option>
                  <Option value="medium">Medium Priority</Option>
                  <Option value="low">Low Priority</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker
                  placeholder="Select due date"
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="pending"
              >
                <Select placeholder="Select status" size="large">
                  <Option value="pending">Pending</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="applicationId"
                label="Related Application"
              >
                <Select placeholder="Select application (optional)" size="large">
                  <Option value="harvard">Harvard University</Option>
                  <Option value="mit">MIT</Option>
                  <Option value="stanford">Stanford University</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              placeholder="Add any additional details about this task..."
              rows={4}
            />
          </Form.Item>

          <div className="form-actions">
            <Space size="large">
              <Button
                type="default"
                icon={<FontAwesomeIcon icon="times" />}
                size="large"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon="save" />}
                size="large"
                htmlType="submit"
                loading={isLoading}
              >
                Create Task
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default NewTaskPage;