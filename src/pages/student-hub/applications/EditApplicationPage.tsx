import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space, AutoComplete } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { 
  useGetCollegeApplicationQuery,
  useUpdateCollegeApplicationMutation 
} from '../../../app/services/student-hub/applicationTrackingApi';
import type { CollegeApplication } from '../../../app/services/student-hub/types';
import { api } from 'src/app/api';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import type { UniversitiesItemDto, MajorsSchema } from 'src/app/api/Api';
import './EditApplicationPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const EDIT_ID_REGEX = /\/applications\/([^/]+)\/edit$/;

function parseEditIdFromPathname(pathname: string): string | null {
  const m = pathname.match(EDIT_ID_REGEX);
  const parsed = m?.[1]?.trim();
  if (!parsed || parsed === 'undefined') return null;
  if (parsed.length < 30) return null;
  return parsed;
}

const EditApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const paramId = useParams<{ id: string }>().id;
  const rawParam = paramId && paramId !== 'undefined' && paramId.trim() !== '' ? paramId.trim() : null;
  const id = (rawParam && rawParam.length >= 30 ? rawParam : null) ?? parseEditIdFromPathname(pathname);
  const [form] = Form.useForm();
  
  const { data: applicationResponse, isLoading, error } = useGetCollegeApplicationQuery(id ?? '', {
    skip: !id,
  });
  const [updateCollegeApplication, { isLoading: updateLoading }] = useUpdateCollegeApplicationMutation();

  const raw = applicationResponse?.data ?? applicationResponse;
  const application: CollegeApplication | undefined =
    raw && typeof raw === 'object' && raw !== null && 'id' in raw && typeof (raw as CollegeApplication).id === 'string'
      ? (raw as CollegeApplication)
      : undefined;

  // University search state
  const [universitySearchValue, setUniversitySearchValue] = useState('');
  const [universityOptions, setUniversityOptions] = useState<Array<{ value: string; label: string; id: string }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(application?.universityId ?? null);
  const [majorOptions, setMajorOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isOtherUniversity, setIsOtherUniversity] = useState(!application?.universityId && !!application?.universityName);

  // Fetch university detail when ID is selected
  const { data: universityDetail } = useGetUniversityDetailQuery(selectedUniversityId || '', {
    skip: !selectedUniversityId,
  });

  // Load all universities on component mount
  useEffect(() => {
    const loadAllUniversities = async () => {
      setSearchLoading(true);
      try {
        const allResponse = await api.university.findAll(
          {
            _start: 0,
            _end: 1000,
            majorType: 'undergraduate' as any,
          }
        );
        
        let allUniversities: UniversitiesItemDto[] = [];
        const total = allResponse?.data?.total || 0;
        
        if (allResponse?.data?.data) {
          allUniversities = [...allResponse.data.data];
        }
        
        if (allUniversities.length < total) {
          const batchSize = 100;
          const remainingBatches = Math.ceil((total - allUniversities.length) / batchSize);
          const seenIds = new Set(allUniversities.map(u => u.id));
          
          for (let i = 1; i <= remainingBatches; i++) {
            const batchResponse = await api.university.findAll(
              {
                _start: allUniversities.length,
                _end: allUniversities.length + batchSize,
                majorType: 'undergraduate' as any,
              }
            );
            
            if (batchResponse?.data?.data) {
              const newUnis = batchResponse.data.data.filter((uni: UniversitiesItemDto) => !seenIds.has(uni.id));
              allUniversities.push(...newUnis);
              newUnis.forEach(u => seenIds.add(u.id));
            }
            
            if (allUniversities.length >= total) break;
          }
        }
        
        const options = allUniversities.map((uni: UniversitiesItemDto) => {
          const name = getTranslation(uni.name) || '';
          return {
            value: name,
            label: name,
            id: uni.id,
          };
        });
        
        options.push({
          value: '__OTHER__',
          label: 'Other (Type manually)',
          id: '',
        });
        
        setUniversityOptions(options);
      } catch (error) {
        console.error('Error loading universities:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    loadAllUniversities();
  }, []);

  // Load majors when university is selected
  useEffect(() => {
    if (universityDetail?.majors && universityDetail.majors.length > 0) {
      const majors = (universityDetail.majors as MajorsSchema[]).map((major: MajorsSchema) => ({
        value: getTranslation(major.name) || '',
        label: getTranslation(major.name) || '',
      }));
      
      majors.push({ value: '__OTHER__', label: 'Other (Type manually)' });
      setMajorOptions(majors);
    } else {
      setMajorOptions([{ value: '__OTHER__', label: 'Other (Type manually)' }]);
    }
  }, [universityDetail]);

  // Populate form when application data is loaded
  useEffect(() => {
    if (application) {
      const deadlineValue = application.deadline && dayjs(application.deadline).isValid()
        ? dayjs(application.deadline)
        : null;

      if (application.universityId) {
        setSelectedUniversityId(application.universityId);
        setIsOtherUniversity(false);
      } else if (application.universityName) {
        setIsOtherUniversity(true);
        setSelectedUniversityId(null);
      }

      form.setFieldsValue({
        university: application.universityName || '',
        universityId: application.universityId || null,
        major: application.major || '',
        applicationType: application.applicationType,
        status: application.status,
        category: application.category,
        priority: application.priority,
        deadline: deadlineValue,
        notes: application.notes,
      });
    }
  }, [application, form]);

  // Handle university selection
  const handleUniversitySelect = (value: string, option: any) => {
    if (value === '__OTHER__') {
      setIsOtherUniversity(true);
      setSelectedUniversityId(null);
      form.setFieldsValue({ 
        university: '',
        universityId: null,
        major: undefined
      });
      setMajorOptions([]);
    } else {
      setIsOtherUniversity(false);
      const selectedOption = universityOptions.find(opt => opt.value === value);
      const universityId = selectedOption?.id;
      
      if (universityId) {
        setSelectedUniversityId(universityId);
        form.setFieldsValue({ 
          university: value,
          universityId: universityId 
        });
      }
    }
  };

  const handleUniversityFocus = () => {
    if (universityOptions.length > 0) {
      return;
    }
    if (!searchLoading) {
      // Already loaded in useEffect
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Transform form values to API format
      const applicationData: any = {
        applicationType: (values.applicationType || application?.applicationType || 'common-app') as any,
        status: (values.status || application?.status || 'researching') as any,
        category: (values.category || application?.category || 'target') as any,
        priority: parseInt(values.priority) || application?.priority || 5,
      };
      
      // Handle university ID vs name
      if (values.universityId || selectedUniversityId) {
        applicationData.universityId = values.universityId || selectedUniversityId;
      } else {
        applicationData.universityName = values.university || application?.universityName || '';
      }
      
      // Add optional fields
      if (values.major && values.major.trim()) {
        applicationData.major = values.major.trim();
      }
      
      if (values.deadline) {
        const d = dayjs(values.deadline);
        if (d.isValid()) applicationData.deadline = d.toISOString();
      }
      
      if (values.notes !== undefined) {
        applicationData.notes = values.notes?.trim() || '';
      }
      
      // Preserve existing financialInfo and requirements
      applicationData.financialInfo = application?.financialInfo || {};
      applicationData.requirements = application?.requirements || {};
      
      await updateCollegeApplication({ id: id!, data: applicationData }).unwrap();
      
      message.success('Application updated successfully!');
      navigate('/student-hub/applications');
    } catch (error: any) {
      console.error('Error updating application:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to update application. Please try again.';
      message.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/student-hub/applications');
  };

  if (!id) {
    return (
      <div className="edit-application-error">
        <div className="error-content">
          <h3>Invalid Application ID</h3>
          <p>The application ID is missing or invalid. Please go back and try again.</p>
          <Button type="primary" onClick={() => navigate('/student-hub/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

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

  if (error || (!isLoading && !application)) {
    return (
      <div className="edit-application-error">
        <div className="error-content">
          <h3>Application Not Found</h3>
          <p>
            {error 
              ? `Error loading application: ${(error as { data?: { message?: string }; message?: string })?.data?.message ?? (error as { message?: string })?.message ?? 'Unknown error'}`
              : 'The application you\'re trying to edit could not be found.'}
          </p>
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
              {!isOtherUniversity ? (
                <Form.Item
                  name="university"
                  label="University"
                  rules={[{ required: true, message: 'Please search and select a university' }]}
                >
                  <div style={{ position: 'relative' }}>
                    <AutoComplete
                      options={universityOptions}
                      onSelect={handleUniversitySelect}
                      onFocus={handleUniversityFocus}
                      placeholder="Search for a university (e.g., Harvard, MIT, Stanford)"
                      size="large"
                      filterOption={false}
                      defaultActiveFirstOption={false}
                      notFoundContent={searchLoading ? 'Loading...' : 'No universities found'}
                      style={{ width: '100%' }}
                    />
                    {searchLoading && (
                      <span style={{ 
                        position: 'absolute', 
                        right: 12, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#999',
                        fontSize: '12px'
                      }}>
                        Loading...
                      </span>
                    )}
                  </div>
                </Form.Item>
              ) : (
                <Form.Item
                  name="university"
                  label="University"
                  rules={[{ required: true, message: 'Please enter the university name' }]}
                >
                  <Input
                    placeholder="Type the university name"
                    size="large"
                    onChange={(e) => {
                      form.setFieldsValue({ university: e.target.value });
                    }}
                    addonAfter={
                      <Button
                        type="link"
                        onClick={() => {
                          setIsOtherUniversity(false);
                          form.setFieldsValue({ university: undefined });
                          handleUniversityFocus();
                        }}
                      >
                        Back to list
                      </Button>
                    }
                  />
                </Form.Item>
              )}
              <Form.Item name="universityId" hidden>
                <Input type="hidden" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="major"
                label="Intended Major"
                rules={[{ required: true, message: 'Please enter or select your intended major' }]}
              >
                {isOtherUniversity ? (
                  <Input
                    placeholder="Type your intended major"
                    size="large"
                  />
                ) : (
                  <Select
                    placeholder={selectedUniversityId ? "Select a major" : "Select a university first"}
                    size="large"
                    disabled={!selectedUniversityId || majorOptions.length === 0}
                    showSearch
                    filterOption={(input, option) => {
                      const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {majorOptions.map((major) => (
                      <Option key={major.value} value={major.value === '__OTHER__' ? '' : major.value}>
                        {major.label}
                      </Option>
                    ))}
                  </Select>
                )}
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

          <Row gutter={[24, 24]}>
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
