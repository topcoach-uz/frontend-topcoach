import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, DatePicker, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ACTIVITY_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import './ActivitiesProfile.scss';

const { Option } = Select;
const { TextArea } = Input;

interface ActivitiesProfileProps {
  data: {
    completed: boolean;
    percentage: number;
    lastUpdated: string;
  };
  readOnly?: boolean;
  studentId?: string;
}

const ActivitiesProfile: React.FC<ActivitiesProfileProps> = ({ data, readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isReadOnly = readOnly === true;
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile(hookOptions);

  // Initialize form with data from API
  useEffect(() => {
    if (profile?.activitiesProfile) {
      const activitiesData = profile.activitiesProfile;
      form.setFieldsValue({
        extracurricularActivities: activitiesData.extracurricularActivities || [],
        leadershipRoles: activitiesData.leadershipRoles || [],
        volunteerWork: activitiesData.volunteerWork || [],
        workExperience: activitiesData.workExperience || [],
        awards: activitiesData.awards || [],
        certifications: activitiesData.certifications || [],
        hobbies: activitiesData.hobbies || [],
      });
    }
  }, [profile?.activitiesProfile, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      console.log('=== ACTIVITIES PROFILE SAVE DEBUG ===');
      console.log('Form values:', values);
      console.log('Current profile ID:', profile?.id);
      console.log('Activities profile data to save:', values);
      console.log('API call payload:', { activitiesProfile: values });

      const result = await updateStudentProfile({
        activitiesProfile: values
      });
      
      console.log('Activities profile save result:', result);
      message.success('Activities profile saved successfully!');
      
      // Refetch the profile data to update the UI
      await refetchProfile();
      console.log('Activities profile refetched after save');
      console.log('=== ACTIVITIES PROFILE SAVE COMPLETED ===');
    } catch (error: any) {
      console.error('=== ACTIVITIES PROFILE SAVE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.data);
      message.error(`Failed to save activities profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activities-profile">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="activities-form"
      >
        {/* Extracurricular Activities */}
        <Card title={t('studentHub.profile.extracurricularActivities', 'Extracurricular Activities')} className="section-card">
          <Form.List name="extracurricularActivities">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="Activity Name"
                        rules={[{ required: true, message: 'Please enter activity name' }]}
                      >
                        <Input placeholder="e.g., Debate Team" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'position']}
                        label={t('studentHub.profile.positionRole', 'Position/Role')}
                      >
                        <Input placeholder="e.g., Captain" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'duration']}
                        label={t('studentHub.profile.duration', 'Duration')}
                      >
                        <Input placeholder="e.g., 2 years" />
                      </Form.Item>
                    </Col>
                    {!isReadOnly && (
                      <Col span={4}>
                        <Form.Item label=" ">
                          <Button type="link" danger onClick={() => remove(name)}>
                            {t('common.remove', 'Remove')}
                          </Button>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                ))}
                {!isReadOnly && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}>
                      {t('studentHub.profile.addActivity', 'Add Activity')}
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </Card>

        {/* Leadership Roles */}
        <Card title={t('studentHub.profile.leadershipRoles', 'Leadership Roles')} className="section-card">
          <Form.List name="leadershipRoles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'role']}
                        label={t('studentHub.profile.leadershipRole', 'Leadership Role')}
                        rules={[{ required: true, message: t('studentHub.profile.pleaseEnterLeadershipRole', 'Please enter leadership role') }]}
                      >
                        <Input placeholder="e.g., Student Council President" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'organization']}
                        label={t('studentHub.profile.organization', 'Organization')}
                      >
                        <Input placeholder="e.g., High School Student Council" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'duration']}
                        label={t('studentHub.profile.duration', 'Duration')}
                      >
                        <Input placeholder="e.g., 1 year" />
                      </Form.Item>
                    </Col>
                    {!isReadOnly && (
                      <Col span={2}>
                        <Form.Item label=" ">
                          <Button type="link" danger onClick={() => remove(name)}>
                            {t('common.remove', 'Remove')}
                          </Button>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                ))}
                {!isReadOnly && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}>
                      {t('studentHub.profile.addLeadershipRole', 'Add Leadership Role')}
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </Card>

        {/* Awards & Achievements */}
        <Card title={t('studentHub.profile.awardsAchievements', 'Awards & Achievements')} className="section-card">
          <Form.List name="awards">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label={t('studentHub.profile.awardName', 'Award Name')}
                        rules={[{ required: true, message: t('studentHub.profile.pleaseEnterAwardName', 'Please enter award name') }]}
                      >
                        <Input placeholder="e.g., National Merit Scholar" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'year']}
                        label={t('studentHub.profile.year', 'Year')}
                      >
                        <Input placeholder="e.g., 2024" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'organization']}
                        label={t('studentHub.profile.awardingOrganization', 'Awarding Organization')}
                      >
                        <Input placeholder="e.g., National Merit Corporation" />
                      </Form.Item>
                    </Col>
                    {!isReadOnly && (
                      <Col span={2}>
                        <Form.Item label=" ">
                          <Button type="link" danger onClick={() => remove(name)}>
                            {t('common.remove', 'Remove')}
                          </Button>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                ))}
                {!isReadOnly && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}>
                      {t('studentHub.profile.addAward', 'Add Award')}
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </Card>

        {/* Save/Reset – hidden in read-only (counselor) view */}
        {!isReadOnly && (
          <Card className="save-section">
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                {t('studentHub.profile.saveActivitiesProfile', 'Save Activities Profile')}
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                {t('common.reset', 'Reset')}
              </Button>
            </Space>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default ActivitiesProfile;