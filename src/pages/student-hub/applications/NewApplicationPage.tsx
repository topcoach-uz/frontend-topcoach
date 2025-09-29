import React, { useState } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { useCreateCollegeApplicationMutation } from '../../../app/services/student-hub/applicationTrackingApi';
import './NewApplicationPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const NewApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [createCollegeApplication, { isLoading }] = useCreateCollegeApplicationMutation();

  const handleSubmit = async (values: any) => {
    try {
      console.log('Creating application:', values);
      
      // Transform form values to API format
      const applicationData = {
        universityName: values.university, // Now sends university name as string
        major: values.major, // Include the intended major
        applicationType: values.applicationType || 'common-app',
        status: values.status || 'researching',
        category: values.category || 'target',
        priority: parseInt(values.priority) || 5, // Ensure priority is a number
        deadline: values.deadline?.toISOString(),
        notes: values.notes,
        financialInfo: {},
        requirements: {},
      };
      
      await createCollegeApplication(applicationData).unwrap();
      
      message.success('Application created successfully!');
      navigate('/student-hub/applications');
    } catch (error) {
      console.error('Error creating application:', error);
      message.error('Failed to create application. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/student-hub/applications');
  };

  return (
    <div className="new-application-page">
      <div className="page-header">
        <h1 className="page-title">Add New Application</h1>
        <p className="page-subtitle">Create a new college application</p>
      </div>

      <Card className="application-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="application-form"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="university"
                label="University"
                rules={[{ required: true, message: 'Please enter the university name' }]}
              >
                <Input
                  placeholder="e.g., Harvard University, MIT, Stanford University"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="major"
                label="Intended Major"
                rules={[{ required: true, message: 'Please enter your intended major' }]}
              >
                <Input
                  placeholder="e.g., Computer Science, Business, Medicine"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="applicationType"
                label="Application Type"
                rules={[{ required: true, message: 'Please select application type' }]}
              >
                <Select placeholder="Select type" size="large">
                  <Option value="common-app">Common Application</Option>
                  <Option value="coalition">Coalition Application</Option>
                  <Option value="direct">Direct Application</Option>
                  <Option value="ucas">UCAS Application</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deadline"
                label="Application Deadline"
                rules={[{ required: true, message: 'Please select deadline' }]}
              >
                <DatePicker
                  placeholder="Select deadline"
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="Priority Level"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority" size="large">
                  <Option value={8}>High Priority</Option>
                  <Option value={5}>Medium Priority</Option>
                  <Option value={2}>Low Priority</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="researching"
              >
                <Select placeholder="Select status" size="large">
                  <Option value="researching">Researching</Option>
                  <Option value="applying">Applying</Option>
                  <Option value="submitted">Submitted</Option>
                  <Option value="under_review">Under Review</Option>
                  <Option value="accepted">Accepted</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="waitlisted">Waitlisted</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              placeholder="Add any notes about this application..."
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
                Create Application
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default NewApplicationPage;