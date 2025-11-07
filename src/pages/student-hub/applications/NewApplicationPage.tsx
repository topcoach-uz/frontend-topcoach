import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space, AutoComplete } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { useCreateCollegeApplicationMutation } from '../../../app/services/student-hub/applicationTrackingApi';
import { api } from 'src/app/api';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import type { UniversitiesItemDto, MajorsSchema } from 'src/app/api/Api';
import './NewApplicationPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const NewApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [createCollegeApplication, { isLoading }] = useCreateCollegeApplicationMutation();
  
  // University search state
  const [universitySearchValue, setUniversitySearchValue] = useState('');
  const [universityOptions, setUniversityOptions] = useState<Array<{ value: string; label: string; id: string }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [majorOptions, setMajorOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isOtherUniversity, setIsOtherUniversity] = useState(false);

  // Fetch university detail when ID is selected
  const { data: universityDetail } = useGetUniversityDetailQuery(selectedUniversityId || '', {
    skip: !selectedUniversityId,
  });

  // Load all universities on component mount
  useEffect(() => {
    // Load ALL universities immediately on mount
    const loadAllUniversities = async () => {
      setSearchLoading(true);
      try {
        // Fetch ALL universities - NO FILTERS, just get everything
        const allResponse = await api.university.findAll(
          {
            _start: 0,
            _end: 1000, // Request a large number to get all
            majorType: 'undergraduate' as any, // Required field, use undergraduate as default
          }
        );
        
        let allUniversities: UniversitiesItemDto[] = [];
        const total = allResponse?.data?.total || 0;
        
        if (allResponse?.data?.data) {
          allUniversities = [...allResponse.data.data];
        }
        
        console.log('Fetched:', allUniversities.length, 'out of', total, 'universities');
        
        // If we didn't get all, fetch remaining in batches
        if (allUniversities.length < total) {
          const batchSize = 100;
          const remainingBatches = Math.ceil((total - allUniversities.length) / batchSize);
          const seenIds = new Set(allUniversities.map(u => u.id));
          
          for (let i = 1; i <= remainingBatches; i++) {
            const batchResponse = await api.university.findAll(
              {
                _start: allUniversities.length,
                _end: allUniversities.length + batchSize,
                majorType: 'undergraduate' as any, // Required field, use undergraduate as default
              }
            );
            
            if (batchResponse?.data?.data) {
              const newUnis = batchResponse.data.data.filter((uni: UniversitiesItemDto) => !seenIds.has(uni.id));
              allUniversities.push(...newUnis);
              newUnis.forEach(u => seenIds.add(u.id));
              console.log(`Batch ${i}: Added ${newUnis.length} more universities`);
            }
            
            if (allUniversities.length >= total) break;
          }
        }
        
        console.log('Final: Loaded', allUniversities.length, 'universities');
        
        // Map all universities to options
        const options = allUniversities.map((uni: UniversitiesItemDto) => {
          const name = getTranslation(uni.name) || '';
          return {
            value: name,
            label: name,
            id: uni.id,
          };
        });
        
        // Add "Other" option at the end
        options.push({
          value: '__OTHER__',
          label: 'Other (Type manually)',
          id: '',
        });
        
        console.log('Setting', options.length, 'options (including Other)');
        setUniversityOptions(options);
      } catch (error) {
        console.error('Error loading universities:', error);
        message.error('Failed to load universities');
      } finally {
        setSearchLoading(false);
      }
    };
    
    loadAllUniversities();
  }, []);

  // Update major options when university is selected
  useEffect(() => {
    if (universityDetail?.majors) {
      const majors = universityDetail.majors.map((major: MajorsSchema) => ({
        value: getTranslation(major.name) || '',
        label: getTranslation(major.name) || '',
      }));
      setMajorOptions(majors);
      // Clear major field when university changes
      form.setFieldsValue({ major: undefined });
    } else {
      setMajorOptions([]);
    }
  }, [universityDetail, form]);

  // Search universities - fetch all with pagination
  const handleUniversitySearch = async (searchText: string) => {
    setUniversitySearchValue(searchText);
    
    // Don't search if "Other" is selected
    if (isOtherUniversity) {
      return;
    }
    
    setSearchLoading(true);
    try {
      // First request to get total count - DON'T pass name parameter if searchText is empty to get ALL
      const firstResponse = await api.university.findAll(
        {
          ...(searchText ? { name: searchText } : {}), // Only pass name if there's actual search text
          majorType: 'undergraduate' as any, // Default to undergraduate
          _start: 0,
          _end: 100, // Initial batch
        }
      );
      
      const total = firstResponse?.data?.total || 0;
      let allUniversities: UniversitiesItemDto[] = [];
      
      if (firstResponse?.data?.data) {
        allUniversities = [...firstResponse.data.data];
      }
      
      // Always fetch all universities in batches, regardless of total
      const batchSize = 100;
      const batches = Math.ceil(total / batchSize);
      
      // Fetch remaining batches (if any)
      if (batches > 1) {
        const remainingPromises = [];
        for (let i = 1; i < batches; i++) {
          remainingPromises.push(
            api.university.findAll(
              {
                ...(searchText ? { name: searchText } : {}), // Only pass name if there's actual search text
                majorType: 'undergraduate' as any,
                _start: i * batchSize,
                _end: (i + 1) * batchSize,
              }
            )
          );
        }
        
        const remainingResponses = await Promise.all(remainingPromises);
        remainingResponses.forEach((response) => {
          if (response?.data?.data) {
            allUniversities = [...allUniversities, ...response.data.data];
          }
        });
      }
      
      // Map all universities to options
      const options = allUniversities.map((uni: UniversitiesItemDto) => {
        const name = getTranslation(uni.name) || '';
        return {
          value: name,
          label: name,
          id: uni.id,
        };
      });
      
      // Add "Other" option at the end
      options.push({
        value: '__OTHER__',
        label: 'Other (Type manually)',
        id: '',
      });
      
      setUniversityOptions(options);
    } catch (error) {
      console.error('Error searching universities:', error);
      message.error('Failed to search universities');
    } finally {
      setSearchLoading(false);
    }
  };

  // Load universities when field is focused (if not already loaded)
  const handleUniversityFocus = () => {
    // If we already have universities loaded, don't reload
    if (universityOptions.length > 0) {
      return;
    }
    // Only reload if we have no options and not currently loading
    if (!searchLoading) {
      handleUniversitySearch('');
    }
  };

  // Handle university selection
  const handleUniversitySelect = (value: string, option: any) => {
    if (value === '__OTHER__') {
      // User selected "Other"
      setIsOtherUniversity(true);
      setSelectedUniversityId(null);
      form.setFieldsValue({ 
        university: '',
        universityId: null,
        major: undefined
      });
      setMajorOptions([]);
    } else {
      // User selected a real university
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

  const handleSubmit = async (values: any) => {
    try {
      console.log('Creating application with values:', values);
      
      // Transform form values to API format - ensure all required fields are present
      // IMPORTANT: Database constraint requires EITHER universityId OR universityName, not both
      const applicationData: any = {
        applicationType: (values.applicationType || 'common-app') as any, // Ensure enum type
        status: (values.status || 'researching') as any, // Ensure enum type
        category: (values.category || 'target') as any, // Ensure enum type
        priority: parseInt(values.priority) || 5, // Ensure priority is a number
      };
      
      // If we have a universityId (from dropdown selection), use that and don't send universityName
      // If we don't have universityId (user selected "Other"), use universityName
      if (values.universityId || selectedUniversityId) {
        applicationData.universityId = values.universityId || selectedUniversityId;
        // Don't send universityName when universityId is present (constraint requirement)
      } else {
        // User selected "Other" - only send universityName
        applicationData.universityName = values.university || '';
      }
      
      // Add optional fields only if they have values
      if (values.major && values.major.trim()) {
        applicationData.major = values.major.trim();
      }
      
      if (values.deadline) {
        // Ensure deadline is properly formatted
        const deadlineDate = values.deadline instanceof Date 
          ? values.deadline 
          : new Date(values.deadline);
        applicationData.deadline = deadlineDate.toISOString();
      }
      
      if (values.notes && values.notes.trim()) {
        applicationData.notes = values.notes.trim();
      }
      
      // Send empty objects for financialInfo and requirements to match schema defaults
      applicationData.financialInfo = {};
      applicationData.requirements = {};
      
      console.log('Sending application data:', JSON.stringify(applicationData, null, 2));
      
      const result = await createCollegeApplication(applicationData).unwrap();
      console.log('Application created successfully:', result);
      
      message.success('Application created successfully!');
      navigate('/student-hub/applications');
    } catch (error: any) {
      console.error('Error creating application:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create application. Please try again.';
      console.error('Full error details:', JSON.stringify(error, null, 2));
      message.error(errorMessage);
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
              {!isOtherUniversity ? (
                <Form.Item
                  name="university"
                  label="University"
                  rules={[{ required: true, message: 'Please search and select a university' }]}
                >
                    <div style={{ position: 'relative' }}>
                      <AutoComplete
                        options={universityOptions}
                        onSearch={handleUniversitySearch}
                        onSelect={handleUniversitySelect}
                        onFocus={handleUniversityFocus}
                        placeholder="Search for a university (e.g., Harvard, MIT, Stanford)"
                        size="large"
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        notFoundContent={searchLoading ? 'Searching...' : 'No universities found'}
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
                      <Option key={major.value} value={major.value}>
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