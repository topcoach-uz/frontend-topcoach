import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Row, Col, message, Space, AutoComplete, InputNumber, Typography, Checkbox } from 'antd';
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
const { Text } = Typography;

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
  const [localRequirements, setLocalRequirements] = useState<Record<string, any>>({});
  const [customInput, setCustomInput] = useState('');

  const addCustomItem = () => {
    const title = customInput.trim();
    if (!title) return;
    const list = ((localRequirements as any)?.custom?.items ?? []) as Array<{ id: string; title: string; completed: boolean }>;
    setLocalRequirements({
      ...localRequirements,
      custom: { items: [...list, { id: `custom-${Date.now()}`, title, completed: false }] },
    });
    setCustomInput('');
  };

  const removeCustomItem = (id: string) => {
    const list = ((localRequirements as any)?.custom?.items ?? []) as Array<{ id: string; title: string; completed: boolean }>;
    setLocalRequirements({
      ...localRequirements,
      custom: { items: list.filter((c) => c.id !== id) },
    });
  };

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
      
      if (values.whyThisSchool && values.whyThisSchool.trim()) {
        applicationData.whyThisSchool = values.whyThisSchool.trim();
      }

      applicationData.financialInfo = {};
      applicationData.requirements = localRequirements;
      
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
        <h1 className="page-title">{t('studentHub.applications.newApplication.title')}</h1>
        <p className="page-subtitle">{t('studentHub.applications.newApplication.subtitle')}</p>
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
                  label={t('studentHub.applications.university')}
                  rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseSelectUniversity') }]}
                >
                    <div style={{ position: 'relative' }}>
                      <AutoComplete
                        options={universityOptions}
                        onSearch={handleUniversitySearch}
                        onSelect={handleUniversitySelect}
                        onFocus={handleUniversityFocus}
                        placeholder={t('studentHub.applications.newApplication.searchUniversityPlaceholder')}
                        size="large"
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        notFoundContent={searchLoading ? t('studentHub.applications.newApplication.searching') : t('studentHub.applications.newApplication.noUniversitiesFound')}
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
                          {t('studentHub.applications.newApplication.loading')}
                        </span>
                      )}
                    </div>
                </Form.Item>
              ) : (
                <Form.Item
                  name="university"
                  label={t('studentHub.applications.university')}
                  rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseEnterUniversityName') }]}
                >
                  <Input
                    placeholder={t('studentHub.applications.newApplication.typeUniversityName')}
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
                        {t('studentHub.applications.newApplication.backToList')}
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
                label={t('studentHub.applications.newApplication.intendedMajor')}
                rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseEnterMajor') }]}
              >
                {isOtherUniversity ? (
                  <Input
                    placeholder={t('studentHub.applications.newApplication.typeIntendedMajor')}
                    size="large"
                  />
                ) : (
                  <Select
                    placeholder={selectedUniversityId ? t('studentHub.applications.newApplication.selectMajor') : t('studentHub.applications.newApplication.selectUniversityFirst')}
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
                label={t('studentHub.applications.newApplication.applicationType')}
                rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseSelectType') }]}
              >
                <Select placeholder={t('studentHub.applications.newApplication.selectType')} size="large">
                  <Option value="common-app">{t('studentHub.applications.applicationType.common_app')}</Option>
                  <Option value="coalition">{t('studentHub.applications.applicationType.coalition')}</Option>
                  <Option value="direct">{t('studentHub.applications.applicationType.direct')}</Option>
                  <Option value="ucas">{t('studentHub.applications.applicationType.ucas')}</Option>
                  <Option value="other">{t('studentHub.applications.applicationType.other')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deadline"
                label={t('studentHub.applications.newApplication.deadline')}
                rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseSelectDeadline') }]}
              >
                <DatePicker
                  placeholder={t('studentHub.applications.newApplication.selectDeadline')}
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
                label={t('studentHub.applications.newApplication.priorityLevel')}
                rules={[{ required: true, message: t('studentHub.applications.newApplication.pleaseSelectPriority') }]}
              >
                <Select placeholder={t('studentHub.applications.newApplication.selectPriority')} size="large">
                  <Option value={8}>{t('studentHub.applications.newApplication.highPriority')}</Option>
                  <Option value={5}>{t('studentHub.applications.newApplication.mediumPriority')}</Option>
                  <Option value={2}>{t('studentHub.applications.newApplication.lowPriority')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label={t('studentHub.applications.newApplication.status')}
                initialValue="researching"
              >
                <Select placeholder={t('studentHub.applications.newApplication.status')} size="large">
                  <Option value="researching">{t('studentHub.applications.status.researching')}</Option>
                  <Option value="applying">{t('studentHub.applications.status.applying')}</Option>
                  <Option value="submitted">{t('studentHub.applications.status.submitted')}</Option>
                  <Option value="under_review">{t('studentHub.applications.status.under_review')}</Option>
                  <Option value="accepted">{t('studentHub.applications.status.accepted')}</Option>
                  <Option value="rejected">{t('studentHub.applications.status.rejected')}</Option>
                  <Option value="waitlisted">{t('studentHub.applications.status.waitlisted')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="whyThisSchool"
            label={t('studentHub.applications.newApplication.whyThisSchool')}
          >
            <TextArea
              placeholder={t('studentHub.applications.newApplication.whyThisSchoolPlaceholder')}
              rows={3}
            />
          </Form.Item>

          <div style={{ marginTop: 24 }}>
            <Card size="small" title={t('studentHub.applications.newApplication.setUpRequirements')} style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {t('studentHub.applications.newApplication.setUpRequirementsHint')}
              </Text>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <Space wrap size="middle">
                  <span>
                    <Text type="secondary" style={{ marginRight: 6 }}>{t('studentHub.applications.newApplication.essays')}</Text>
                    <InputNumber
                      min={0}
                      max={20}
                      value={(localRequirements?.essays as any)?.required ?? 0}
                      onChange={(n) => {
                        const v = Math.max(0, Math.min(20, Number(n) || 0));
                        const prev = (localRequirements?.essays as any) || { required: 0, completed: 0, prompts: [] };
                        setLocalRequirements({
                          ...localRequirements,
                          essays: {
                            ...prev,
                            required: v,
                            prompts: Array(v).fill(null).map((_, i) => prev.prompts?.[i] || `Essay ${i + 1}`),
                          },
                        });
                      }}
                      style={{ width: 64 }}
                    />
                  </span>
                  <span>
                    <Text type="secondary" style={{ marginRight: 6 }}>{t('studentHub.applications.newApplication.recommendations')}</Text>
                    <InputNumber
                      min={0}
                      max={10}
                      value={(localRequirements?.recommendations as any)?.required ?? 0}
                      onChange={(n) => {
                        const v = Math.max(0, Math.min(10, Number(n) || 0));
                        const prev = (localRequirements?.recommendations as any) || { required: 0, submitted: 0, requested: 0 };
                        setLocalRequirements({
                          ...localRequirements,
                          recommendations: { ...prev, required: v },
                        });
                      }}
                      style={{ width: 64 }}
                    />
                  </span>
                  <Checkbox
                    checked={!!(localRequirements?.transcripts as any)?.status}
                    onChange={(e) => {
                      const next = { ...localRequirements };
                      if (e.target.checked) (next as any).transcripts = { status: 'pending', verified: false };
                      else delete (next as any).transcripts;
                      setLocalRequirements(next);
                    }}
                  >
                    {t('studentHub.applications.newApplication.transcript')}
                  </Checkbox>
                  <Checkbox
                    checked={!!(localRequirements?.testScores as any)?.status}
                    onChange={(e) => {
                      const next = { ...localRequirements };
                      if (e.target.checked) (next as any).testScores = { status: 'pending', required: ['SAT/ACT'], submitted: [] };
                      else delete (next as any).testScores;
                      setLocalRequirements(next);
                    }}
                  >
                    {t('studentHub.applications.newApplication.testScores')}
                  </Checkbox>
                </Space>
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{t('studentHub.applications.newApplication.custom')}</Text>
                  <div
                    className="custom-checklist-add-group"
                    style={{
                      display: 'flex',
                      width: '100%',
                      maxWidth: 360,
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: '#fff',
                    }}
                  >
                    <Input
                      placeholder={t('studentHub.applications.newApplication.customPlaceholder')}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onPressEnter={() => addCustomItem()}
                      bordered={false}
                      style={{ flex: 1, borderRadius: 0 }}
                    />
                    <Button type="primary" onClick={() => addCustomItem()} style={{ borderRadius: 0, flexShrink: 0 }}>
                      {t('studentHub.applications.newApplication.add')}
                    </Button>
                  </div>
                  {((localRequirements as any)?.custom?.items ?? []).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {((localRequirements as any).custom.items as Array<{ id: string; title: string; completed: boolean }>).map((c) => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text>{c.title}</Text>
                          <Button type="text" size="small" danger onClick={() => removeCustomItem(c.id)}>
                            {t('studentHub.applications.newApplication.remove')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="form-actions">
            <Space size="large">
              <Button
                type="default"
                icon={<FontAwesomeIcon icon="times" />}
                size="large"
                onClick={handleCancel}
              >
                {t('studentHub.applications.newApplication.cancel')}
              </Button>
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon="save" />}
                size="large"
                htmlType="submit"
                loading={isLoading}
              >
                {t('studentHub.applications.newApplication.createApplication')}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default NewApplicationPage;