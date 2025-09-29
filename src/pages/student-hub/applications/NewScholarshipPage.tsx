import React, { useState } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useCreateScholarshipApplicationMutation } from '../../../app/services/student-hub/applicationTrackingApi';
import './NewScholarshipPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const NewScholarshipPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [createScholarshipApplication, { isLoading: loading }] = useCreateScholarshipApplicationMutation();

  const handleSubmit = async (values: any) => {
    try {
      // Map form values to the expected API format
      const scholarshipData = {
        scholarshipName: values.scholarshipName,
        organization: values.provider,
        amount: values.amount,
        status: values.status || 'researching',
        applicationDeadline: values.applicationDeadline ? values.applicationDeadline.toISOString() : undefined,
        essayRequired: values.requirements && values.requirements.toLowerCase().includes('essay'),
        essayPrompt: values.requirements,
        notes: values.notes,
        // These fields are required by the backend but not in the form
        externalScholarshipId: `ext_${Date.now()}`, // Generate a unique external ID
        currency: 'USD', // Default currency
      };

      console.log('🎯 Frontend: Creating scholarship with data:', scholarshipData);
      
      const result = await createScholarshipApplication(scholarshipData).unwrap();
      console.log('🎯 Frontend: Create scholarship API call successful:', result);
      
      message.success('Scholarship application created successfully!');
      navigate('/student-hub/applications?tab=scholarships');
    } catch (error) {
      console.error('🎯 Frontend: Error creating scholarship:', error);
      console.error('🎯 Frontend: Error details:', JSON.stringify(error, null, 2));
      message.error('Failed to create scholarship application. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/student-hub/applications?tab=scholarships');
  };

  return (
    <div className="new-scholarship-page">
      <div className="page-header">
        <h1 className="page-title">Add New Scholarship</h1>
        <p className="page-subtitle">Create a new scholarship application</p>
      </div>

      <Card className="scholarship-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="scholarship-form"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="scholarshipName"
                label="Scholarship Name"
                rules={[{ required: true, message: 'Please enter scholarship name' }]}
              >
                <Input
                  placeholder="e.g., Merit Scholarship, Need-based Grant"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="provider"
                label="Provider/Organization"
                rules={[{ required: true, message: 'Please enter provider' }]}
              >
                <Input
                  placeholder="e.g., University, Foundation, Corporation"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label="Scholarship Amount"
                rules={[{ required: true, message: 'Please enter scholarship amount' }]}
              >
                <InputNumber
                  placeholder="Enter amount"
                  size="large"
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="Scholarship Type"
                rules={[{ required: true, message: 'Please select scholarship type' }]}
              >
                <Select placeholder="Select type" size="large">
                  <Option value="merit">Merit-based</Option>
                  <Option value="need">Need-based</Option>
                  <Option value="athletic">Athletic</Option>
                  <Option value="academic">Academic</Option>
                  <Option value="minority">Minority/Diversity</Option>
                  <Option value="major">Major-specific</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="applicationDeadline"
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
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="researching"
              >
                <Select placeholder="Select status" size="large">
                  <Option value="researching">Researching</Option>
                  <Option value="eligible">Eligible</Option>
                  <Option value="applying">Applying</Option>
                  <Option value="submitted">Submitted</Option>
                  <Option value="under_review">Under Review</Option>
                  <Option value="awarded">Awarded</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="expired">Expired</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="eligibility"
                label="Eligibility Requirements"
              >
                <TextArea
                  placeholder="Describe eligibility requirements..."
                  rows={3}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="requirements"
                label="Application Requirements"
              >
                <TextArea
                  placeholder="List required documents, essays, etc..."
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              placeholder="Add any additional notes about this scholarship..."
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
                loading={loading}
              >
                Create Scholarship Application
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default NewScholarshipPage;