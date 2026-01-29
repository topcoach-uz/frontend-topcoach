import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Upload, 
  message, 
  Row, 
  Col, 
  Typography,
  Space,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  SaveOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { essayManagementApi } from '../../../app/services/student-hub/essayManagementApi';
import './NewEssayPage.scss';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const NewEssayPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [uploadEssay] = essayManagementApi.useUploadEssayMutation();

  const essayTypes = [
    { value: 'personal_statement', label: 'Personal Statement' },
    { value: 'supplemental', label: 'Supplemental Essay' },
    { value: 'scholarship', label: 'Scholarship Essay' },
    { value: 'why_school', label: 'Why School Essay' },
    { value: 'why_major', label: 'Why Major Essay' },
    { value: 'activity', label: 'Activity Essay' },
    { value: 'diversity', label: 'Diversity Essay' },
    { value: 'leadership', label: 'Leadership Essay' },
    { value: 'challenge', label: 'Challenge Essay' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileChange = (info: any) => {
    let newFileList = [...info.fileList];
    
    // Limit to 1 file
    newFileList = newFileList.slice(-1);
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file && !allowedTypes.includes(file.type)) {
        message.error('Only PDF, DOC, DOCX, and TXT files are allowed');
        newFileList = [];
      }
    }
    
    setFileList(newFileList);
  };

  const beforeUpload = (file: any) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      message.error('Only PDF, DOC, DOCX, and TXT files are allowed');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB');
      return false;
    }
    
    return false; // Prevent auto upload
  };

  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('title', values.title);
      formData.append('essayType', values.essayType);
      formData.append('prompt', values.prompt);
      if (values.purpose) {
        formData.append('purpose', values.purpose);
      }
      if (values.collegeApplicationId) {
        formData.append('collegeApplicationId', values.collegeApplicationId);
      }
      if (values.scholarshipApplicationId) {
        formData.append('scholarshipApplicationId', values.scholarshipApplicationId);
      }

      const result = await uploadEssay(formData).unwrap();
      
      message.success('Essay uploaded successfully!');
      navigate('/student-hub/essays?tab=my-essays');
    } catch (error: any) {
      console.error('Error uploading essay:', error);
      message.error(error?.data?.message || 'Failed to upload essay. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate('/student-hub/essays?tab=my-essays');
  };

  return (
    <div className="new-essay-page">
      <div className="page-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          className="back-button"
        >
          Back to Essays
        </Button>
        <Title level={2} className="page-title">
          <FileTextOutlined className="title-icon" />
          Upload New Essay
        </Title>
        <Text type="secondary" className="page-subtitle">
          Upload your essay file and provide metadata for better organization
        </Text>
      </div>

      <Card className="upload-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="upload-form"
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="title"
                label="Essay Title"
                rules={[{ required: true, message: 'Please enter essay title' }]}
              >
                <Input 
                  placeholder="Enter a descriptive title for your essay"
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} lg={12}>
              <Form.Item
                name="essayType"
                label="Essay Type"
                rules={[{ required: true, message: 'Please select essay type' }]}
              >
                <Select 
                  placeholder="Select the type of essay"
                  size="large"
                >
                  {essayTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="prompt"
            label="Essay Prompt"
            rules={[{ required: true, message: 'Please enter the essay prompt' }]}
          >
            <TextArea
              placeholder="Enter the essay prompt or question you're responding to"
              rows={4}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose (Optional)"
          >
            <Input 
              placeholder="Briefly describe the purpose or context of this essay"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Form.Item
            label="Upload Essay File"
            required
          >
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={beforeUpload}
              maxCount={1}
              accept=".pdf,.doc,.docx,.txt"
              className="essay-upload"
            >
              <Button 
                icon={<UploadOutlined />} 
                size="large"
                className="upload-button"
              >
                Choose File
              </Button>
            </Upload>
            <div className="upload-hint">
              <Text type="secondary">
                Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
              </Text>
              {fileList.length === 0 ? (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger">
                    ⚠️ Please select a file to upload
                  </Text>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <Text type="success">
                    ✅ File selected: {fileList[0]?.name}
                  </Text>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item className="submit-section">
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploading}
                disabled={fileList.length === 0}
                icon={<SaveOutlined />}
                size="large"
                className="submit-button"
              >
                {uploading ? 'Uploading...' : 'Upload Essay'}
              </Button>
              <Button 
                onClick={handleBack}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default NewEssayPage;