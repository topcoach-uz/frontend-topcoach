import React, { useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { 
  useGetCollegeApplicationQuery,
  useUpdateCollegeApplicationMutation 
} from '../../../app/services/student-hub/applicationTrackingApi';
import './EditApplicationPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const EditApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  
  const { data: applicationResponse, isLoading } = useGetCollegeApplicationQuery(id!);
  const [updateCollegeApplication, { isLoading: updateLoading }] = useUpdateCollegeApplicationMutation();

  const application = applicationResponse?.data;

  // Populate form when application data is loaded
  useEffect(() => {
    if (application) {
      form.setFieldsValue({
        university: application.universityName,
        applicationType: application.applicationType,
        status: application.status,
        category: application.category,
        priority: application.priority,
        deadline: application.deadline ? new Date(application.deadline) : null,
        notes: application.notes,
      });
    }
  }, [application, form]);

  const handleSubmit = async (values: any) => {
    try {
      console.log('Updating application:', values);
      
      // Transform form values to API format
      const applicationData = {
        universityName: values.university,
        applicationType: values.applicationType || 'common-app',
        status: values.status || 'researching',
        category: values.category || 'target',
        priority: parseInt(values.priority) || 5,
        deadline: values.deadline?.toISOString(),
        notes: values.notes,
        financialInfo: application?.financialInfo || {},
        requirements: application?.requirements || {},
      };
      
      await updateCollegeApplication({ id: id!, data: applicationData }).unwrap();
      
      message.success('Application updated successfully!');
      navigate('/student-hub/applications');
    } catch (error) {
      console.error('Error updating application:', error);
      message.error('Failed to update application. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/student-hub/applications');
  };

  if (isLoading) {
    return (
      <div className="edit-application-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="edit-application-error">
        <div className="error-content">
          <h3>Application Not Found</h3>
          <p>The application you're trying to edit could not be found.</p>
          <Button type="primary" onClick={() => navigate('/student-hub/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-application-page">
      <div className="page-header">
        <h1 className="page-title">Edit Application</h1>
        <p className="page-subtitle">Update your college application details</p>
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
          </Row>

          <Row gutter={[24, 24]}>
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
            <Col xs={24} md={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category" size="large">
                  <Option value="reach">Reach</Option>
                  <Option value="target">Target</Option>
                  <Option value="safety">Safety</Option>
                </Select>
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
                rules={[{ required: true, message: 'Please select status' }]}
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
                loading={updateLoading}
              >
                Update Application
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditApplicationPage;