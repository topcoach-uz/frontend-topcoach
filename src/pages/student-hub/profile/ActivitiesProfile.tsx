import React, { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Col, Form, Input, Row, Select, Space, message } from 'antd';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import './ActivitiesProfile.scss';

interface ActivitiesProfileProps {
  data: { completed: boolean; percentage: number; lastUpdated: string };
  readOnly?: boolean;
  studentId?: string;
}

const experienceTypes = [
  { value: 'project', label: 'Project' },
  { value: 'research', label: 'Research' },
  { value: 'work', label: 'Work or internship' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'activity', label: 'Other activity' },
];

const ActivitiesProfile: React.FC<ActivitiesProfileProps> = ({ readOnly = false, studentId }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile(
    readOnly && studentId ? { studentId } : undefined,
  );
  const isMasters = profile?.academicProfile?.targetDegree === 'master';

  useEffect(() => {
    const saved = profile?.activitiesProfile;
    if (!saved) return;
    form.setFieldsValue({
      experiences: [
        ...(saved.extracurricularActivities || []).map((item: any) => ({
          ...item,
          type: item.type || 'activity',
          name: item.name,
          role: item.position || item.role,
        })),
        ...(saved.leadershipRoles || []).map((item: any) => ({
          ...item,
          type: 'leadership',
          name: item.role,
          role: item.position,
        })),
      ],
      awards: saved.awards || [],
    });
  }, [form, profile?.activitiesProfile]);

  const save = async (values: any) => {
    setSaving(true);
    try {
      const experiences = values.experiences || [];
      await updateStudentProfile({
        activitiesProfile: {
          extracurricularActivities: experiences
            .filter((item: any) => item.type !== 'leadership')
            .map((item: any) => ({
              name: item.name,
              position: item.role,
              duration: item.startDate
                ? `${item.startDate}–${item.ongoing ? 'present' : item.endDate || ''}`
                : item.duration,
              startDate: item.startDate,
              endDate: item.ongoing ? undefined : item.endDate,
              ongoing: !!item.ongoing,
              type: item.type,
              organization: item.organization,
              description: item.description,
            })),
          leadershipRoles: experiences
            .filter((item: any) => item.type === 'leadership')
            .map((item: any) => ({
              role: item.name,
              position: item.role,
              organization: item.organization || '',
              duration: item.startDate
                ? `${item.startDate}–${item.ongoing ? 'present' : item.endDate || ''}`
                : item.duration,
              startDate: item.startDate,
              endDate: item.ongoing ? undefined : item.endDate,
              ongoing: !!item.ongoing,
              description: item.description,
            })),
          awards: values.awards || [],
        } as any,
      });
      await refetchProfile();
      message.success('Activities and achievements saved');
    } catch {
      message.error('Could not save activities and achievements');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="activities-profile">
      <Form form={form} layout="vertical" onFinish={save} disabled={readOnly} className="activities-form">
        <Card title="Experience" className="section-card">
          <Form.List name="experiences">
            {(fields, { add, remove }) => (
              <>
                <div className="profile-list-intro">
                  <p>{isMasters
                    ? 'Add research, projects, jobs, internships, leadership and volunteering in one place.'
                    : 'Add projects, activities, jobs, leadership and volunteering in one place.'}</p>
                  {!readOnly && <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />} onClick={() => add()}>Add experience</Button>}
                </div>
                {fields.map(({ key, name }) => (
                  <div key={key} className="profile-experience-entry">
                    <div className="profile-entry-heading">
                      <strong>Experience {name + 1}</strong>
                      {!readOnly && <Button type="text" danger icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />} aria-label={`Remove experience ${name + 1}`} onClick={() => remove(name)} />}
                    </div>
                    <Row gutter={[16, 4]}>
                      <Col xs={24} md={8}>
                        <Form.Item name={[name, 'type']} label="Type" rules={[{ required: true }]}>
                          <Select placeholder="Choose the kind of experience" options={experienceTypes} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item name={[name, 'name']} label="Activity or project" rules={[{ required: true, message: 'Enter a name' }]}>
                          <Input placeholder={isMasters ? 'e.g. Undergraduate research project' : 'e.g. Debate team'} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'organization']} label="Organization">
                          <Input placeholder="School, university, employer or group" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'role']} label="Your role">
                          <Input placeholder="e.g. Research assistant" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={[name, 'startDate']} label="Start month">
                          <Input type="month" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={[name, 'ongoing']} label=" " valuePropName="checked">
                          <Checkbox>Ongoing</Checkbox>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item noStyle shouldUpdate={(previous, current) =>
                          previous.experiences?.[name]?.ongoing !== current.experiences?.[name]?.ongoing
                        }>
                          {({ getFieldValue }) => !getFieldValue(['experiences', name, 'ongoing']) && (
                            <Form.Item name={[name, 'endDate']} label="End month" rules={[({ getFieldValue: getValue }) => ({
                              validator(_, endDate) {
                                const startDate = getValue(['experiences', name, 'startDate']);
                                return !endDate || !startDate || endDate >= startDate
                                  ? Promise.resolve()
                                  : Promise.reject(new Error('End month must follow start month'));
                              },
                            })]}>
                              <Input type="month" />
                            </Form.Item>
                          )}
                        </Form.Item>
                      </Col>
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                          const oldDuration = getFieldValue(['experiences', name, 'duration']);
                          return oldDuration && !getFieldValue(['experiences', name, 'startDate'])
                            ? <Col xs={24}><p>Previously saved duration: {oldDuration}</p></Col>
                            : null;
                        }}
                      </Form.Item>
                      <Col xs={24}>
                        <Form.Item name={[name, 'description']} label="What you did or achieved">
                          <Input.TextArea rows={2} placeholder="Describe your contribution and outcome" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Card>

        <Card title="Awards & achievements" className="section-card">
          <Form.List name="awards">
            {(fields, { add, remove }) => (
              <>
                <div className="profile-list-intro">
                  <p>Keep each award as a dated record. You can reuse it across applications.</p>
                  {!readOnly && <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />} onClick={() => add()}>Add award</Button>}
                </div>
                {fields.map(({ key, name }) => (
                  <div key={key} className="profile-experience-entry">
                    <div className="profile-entry-heading">
                      <strong>Award {name + 1}</strong>
                      {!readOnly && <Button type="text" danger icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />} aria-label={`Remove award ${name + 1}`} onClick={() => remove(name)} />}
                    </div>
                    <Row gutter={[16, 4]}>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'name']} label="Award" rules={[{ required: true, message: 'Enter an award name' }]}>
                          <Input placeholder="Award or achievement" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item name={[name, 'year']} label="Year"><Input type="number" min={1900} max={new Date().getFullYear() + 5} placeholder="2026" /></Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={[name, 'organization']} label="Awarding organization"><Input /></Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Card>

        {!readOnly && (
          <Card className="save-section">
            <Space>
              <Button type="primary" htmlType="submit" loading={saving} size="large">Save activities & achievements</Button>
              <Button onClick={() => form.resetFields()} size="large">Reset</Button>
            </Space>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default ActivitiesProfile;
