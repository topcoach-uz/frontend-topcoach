import React, { useEffect, useState } from 'react';
import { AutoComplete, Button, Card, Col, Form, Input, Row, Select, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { COUNTRY_NATIONALITY_OPTIONS } from '../../events/youth-leaders-application/countryNationalityOptions';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ACTION_ICONS } from '../../../constants/icons';
import './PersonalProfile.scss';

interface PersonalProfileProps {
  data: { completed: boolean; percentage: number; lastUpdated: string };
  readOnly?: boolean;
  studentId?: string;
}

const languageOptions = [
  'English', 'Uzbek', 'Kazakh', 'Kyrgyz', 'Tajik', 'Turkmen', 'Russian',
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese',
  'Japanese', 'Korean', 'Arabic', 'Turkish', 'Persian',
];

const interestOptions = [
  'Technology', 'Science', 'Mathematics', 'Art', 'Music', 'Sports',
  'Literature', 'History', 'Politics', 'Environment', 'Social Work',
  'Medicine', 'Business', 'Engineering',
];

const proficiencyOptions = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'basic', label: 'Basic' },
];

const personalToFormValues = (personal: any) => ({
  country: personal.country === 'Unknown' ? undefined : personal.country,
  state: personal.state,
  city: personal.city,
  interests: personal.personalInterests || [],
  languages: personal.demographics?.languages?.map((language: any) =>
    typeof language === 'string'
      ? { language, proficiency: 'fluent' }
      : language,
  ) || [],
});

const PersonalProfile: React.FC<PersonalProfileProps> = ({ readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile(
    readOnly && studentId ? { studentId } : undefined,
  );
  const isMasters = profile?.academicProfile?.targetDegree === 'master';
  const country = Form.useWatch('country', form);
  const state = Form.useWatch('state', form);
  const city = Form.useWatch('city', form);
  const languages = Form.useWatch('languages', form) || [];
  const interests = Form.useWatch('interests', form) || [];
  const countryLabel = COUNTRY_NATIONALITY_OPTIONS.find((option) => option.value === country)?.label || country;
  const locationSummary = [city, state, countryLabel].filter(Boolean).join(', ');

  const finishLocationEdit = async () => {
    try {
      await form.validateFields(['country']);
      setEditingLocation(false);
    } catch {
      // Keep the location editor open for its field-level error.
    }
  };

  const finishLanguagesEdit = async () => {
    const names = (form.getFieldValue('languages') || []).flatMap((_: unknown, index: number) => [
      ['languages', index, 'language'], ['languages', index, 'proficiency'],
    ]);
    try {
      await form.validateFields(names);
      setEditingLanguages(false);
    } catch {
      // Keep incomplete language entries visible.
    }
  };

  const startLanguagesEdit = () => {
    if (languages.length === 0) {
      form.setFieldValue('languages', [{ language: undefined, proficiency: undefined }]);
    }
    setEditingLanguages(true);
  };

  const handleFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    if (errorFields.some(({ name }) => name[0] === 'country')) setEditingLocation(true);
    if (errorFields.some(({ name }) => name[0] === 'languages')) setEditingLanguages(true);
  };

  useEffect(() => {
    const personal = profile?.personalProfile;
    if (!personal) return;
    form.setFieldsValue(personalToFormValues(personal));
  }, [form, profile?.personalProfile]);

  const reset = () => {
    if (profile?.personalProfile) form.setFieldsValue(personalToFormValues(profile.personalProfile));
    setEditingLocation(false);
    setEditingLanguages(false);
    setEditingInterests(false);
  };

  const save = async (values: any) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      // Only update fields shown here. Study choices and other historical
      // personal fields remain untouched in the database.
      await updateStudentProfile({
        personalProfile: {
          country: values.country,
          state: values.state || null,
          city: values.city || null,
          languages: values.languages || [],
          personalInterests: values.interests || [],
        } as any,
      });
      await refetchProfile();
      setEditingLocation(false);
      setEditingLanguages(false);
      setEditingInterests(false);
      message.success(t('studentHub.profile.personalSaved', 'Personal profile saved'));
    } catch {
      message.error(t('studentHub.profile.personalSaveFailed', 'Could not save your personal profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="personal-profile">
      <Form form={form} layout="vertical" onFinish={save} onFinishFailed={handleFinishFailed} disabled={readOnly} className="personal-form">
        <Card title={t('studentHub.profile.locationInformation', 'Where you live')} className="section-card">
          {!editingLocation && <div className="personal-summary-row">
            <div><h3>{locationSummary || t('studentHub.profile.locationNotAdded', 'Location not added')}</h3><p>{t('studentHub.profile.locationHint', 'Current location')}</p></div>
            {!readOnly && <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.EDIT} />} onClick={() => setEditingLocation(true)}>{country ? t('common.edit', 'Edit') : t('common.addDetails', 'Add details')}</Button>}
          </div>}
          <div className="personal-summary-editor" hidden={!editingLocation}>
            <p>Keep your current location here. You can update it if you move.</p>
            <Row gutter={[24, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="country" label={t('studentHub.profile.country', 'Country')} rules={[{ required: true, message: 'Select your country' }]}>
                  <Select showSearch placeholder="Select country" options={COUNTRY_NATIONALITY_OPTIONS}
                    filterOption={(input, option) => String(option?.label || '').toLowerCase().includes(input.toLowerCase())} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="state" label={t('studentHub.profile.stateProvince', 'State or province')}>
                  <Input placeholder="State or province" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="city" label={t('studentHub.profile.city', 'City')}>
                  <Input placeholder="City" />
                </Form.Item>
              </Col>
            </Row>
            {!readOnly && <div className="personal-summary-editor-actions"><Button icon={<FontAwesomeIcon icon={ACTION_ICONS.CHECK} />} onClick={finishLocationEdit}>{t('common.done', 'Done')}</Button></div>}
          </div>
        </Card>

        <Card title="Languages" className="section-card">
          {!editingLanguages && <div className="personal-summary-row">
            <div>{languages.length > 0 ? <div className="personal-summary-pills">{languages.map((item: any, index: number) => <span key={`${item?.language}-${index}`}>{item?.language || t('studentHub.profile.unnamedLanguage', 'Language')} · {proficiencyOptions.find((option) => option.value === item?.proficiency)?.label || item?.proficiency}</span>)}</div> : <h3>{t('studentHub.profile.languagesNotAdded', 'No languages added')}</h3>}</div>
            {!readOnly && <Button icon={<FontAwesomeIcon icon={languages.length ? ACTION_ICONS.EDIT : ACTION_ICONS.ADD} />} onClick={startLanguagesEdit}>{languages.length ? t('common.edit', 'Edit') : t('common.add', 'Add')}</Button>}
          </div>}
          <div className="personal-summary-editor" hidden={!editingLanguages}>
            <p>Add languages you speak and choose your proficiency.</p>
            <Form.List name="languages">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row key={key} gutter={[12, 8]} align="middle">
                      <Col xs={24} md={10}>
                        <Form.Item name={[name, 'language']} rules={[{ required: true, message: 'Choose a language' }]}>
                          <AutoComplete placeholder="Type a language" options={languageOptions.map((value) => ({ value }))}
                            filterOption={(input, option) => String(option?.value || '').toLowerCase().includes(input.toLowerCase())} />
                        </Form.Item>
                      </Col>
                      <Col xs={20} md={12}>
                        <Form.Item name={[name, 'proficiency']} rules={[{ required: true, message: 'Choose proficiency' }]}>
                          <Select placeholder="Proficiency" options={proficiencyOptions} />
                        </Form.Item>
                      </Col>
                      {!readOnly && <Col xs={4} md={2} className="language-remove-cell"><Button type="text" danger icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />} aria-label={`Remove language ${name + 1}`} onClick={() => remove(name)} /></Col>}
                    </Row>
                  ))}
                  {!readOnly && <div className="personal-summary-editor-actions personal-summary-editor-actions--grouped">
                    <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />} onClick={() => add()}>Add language</Button>
                    <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.CHECK} />} onClick={finishLanguagesEdit}>{t('common.done', 'Done')}</Button>
                  </div>}
                </>
              )}
            </Form.List>
          </div>
        </Card>

        <Card title="Interests" className="section-card">
          {!editingInterests && <div className="personal-summary-row">
            <div>{interests.length > 0 ? <div className="personal-summary-pills">{interests.map((interest: string) => <span key={interest}>{interest}</span>)}</div> : <h3>{t('studentHub.profile.interestsNotAdded', 'No interests added')}</h3>}</div>
            {!readOnly && <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.EDIT} />} onClick={() => setEditingInterests(true)}>{interests.length ? t('common.edit', 'Edit') : t('common.add', 'Add')}</Button>}
          </div>}
          <div className="personal-summary-editor" hidden={!editingInterests}>
            <p>Pick a suggestion or type your own interest and press Enter. Choose study subjects in Explore your direction.</p>
            <Form.Item name="interests" label="Your interests">
              <Select mode="tags" tokenSeparators={[',']} placeholder="Choose or type an interest"
                options={interestOptions.map((value) => ({ value, label: value }))} />
            </Form.Item>
            {!readOnly && <div className="personal-summary-editor-actions"><Button icon={<FontAwesomeIcon icon={ACTION_ICONS.CHECK} />} onClick={() => setEditingInterests(false)}>{t('common.done', 'Done')}</Button></div>}
          </div>
        </Card>

        {isMasters && !readOnly && (
          <Card className="section-card">
            <strong>Choosing a field or destination?</strong>
            <p>Study subjects, goals, countries, timing and funding are together in Explore your direction.</p>
            <Link to="/student-hub/study-direction">Edit your study choices →</Link>
          </Card>
        )}

        {!readOnly && (
          <Card className="form-actions-card">
            <Space>
              <Button type="primary" htmlType="submit" loading={saving} size="large">Save personal profile</Button>
              <Button onClick={reset} size="large">Reset</Button>
            </Space>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default PersonalProfile;
