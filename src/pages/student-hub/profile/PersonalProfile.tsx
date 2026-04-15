import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space, message, Rate, Alert, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { PROFILE_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import './PersonalProfile.scss';

const { Option } = Select;
const { TextArea } = Input;

interface PersonalProfileProps {
  data: {
    completed: boolean;
    percentage: number;
    lastUpdated: string;
  };
  readOnly?: boolean;
  studentId?: string;
}

const PersonalProfile: React.FC<PersonalProfileProps> = ({ data, readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isReadOnly = readOnly === true;
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, updateStudentProfile, refetchProfile, isProfileComplete } = useStudentProfile(hookOptions);

  // Initialize form with data from API
  useEffect(() => {
    if (profile?.personalProfile) {
      const personalData = profile.personalProfile;
      
      // Transform languages from new format (with proficiency) or old format (string array)
      const languagesFormatted = personalData.demographics?.languages?.map((lang: any) => {
        if (typeof lang === 'string') {
          return { language: lang, proficiency: 'fluent' as const };
        }
        return lang;
      }) || [];
      
      const formData = {
        // Location Information
        country: personalData.country || '',
        state: personalData.state || '',
        city: personalData.city || '',
        
        // Required Fields for AI Recommendations
        interests: personalData.personalInterests || [],
        careerGoals: personalData.careerGoals?.join('\n') || '',
        languages: languagesFormatted,
        
        // Intended Majors with enhancements
        intendedMajor: personalData.intendedMajors?.[0]?.major || '',
        intendedMajorWhy: personalData.intendedMajors?.[0]?.whyInterested || '',
        intendedMajorConfidence: personalData.intendedMajors?.[0]?.confidence || 3,
        
        backupMajors: personalData.backupMajors?.map((m: any) => m.major) || [],
        
        // Study Abroad Goals
        studyAbroadInterest: personalData.studyAbroadInterest || personalData.studyAbroadGoals?.interest || false,
        targetCountries: personalData.studyAbroadGoals?.targetCountries || [],
        durationPreference: personalData.studyAbroadGoals?.durationPreference || 'flexible',
        
        // Values & Goals
        valuesAndMotivations: personalData.valuesAndMotivations || [],
        
        // University Preferences
        universityPreferences: personalData.universityPreferences || [],
        
        // Work Style
        workStylePreferences: personalData.workStylePreferences || [],
        
        // Problem Solving
        problemSolvingApproach: personalData.problemSolvingApproach || [],
        
        // Additional Information
        ethnicity: personalData.demographics?.ethnicity?.[0] || '',
        citizenship: personalData.demographics?.citizenship || '',
        visaStatus: personalData.demographics?.visaStatus || '',
      };
      
      form.setFieldsValue(formData);
    }
  }, [profile?.personalProfile, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      if (!profile?.id) {
        throw new Error('No profile ID found');
      }
      
      // Transform languages to new format with proficiency
      const languagesFormatted = values.languages?.map((lang: any) => {
        if (typeof lang === 'string') {
          return { language: lang, proficiency: 'fluent' as const };
        }
        return lang;
      }) || [];
      
      // Transform form data to match backend DTO structure
      const personalProfileData = {
        country: values.country || null,
        state: values.state,
        city: values.city,
        demographics: {
          ethnicity: values.ethnicity ? [values.ethnicity] : [],
          gender: 'prefer-not-to-say',
          disability: false,
          militaryService: false,
          citizenship: values.citizenship,
          visaStatus: values.visaStatus,
        },
        languages: languagesFormatted,
        familyBackground: {
          parentEducation: {
            mother: 'unknown',
            father: 'unknown',
          },
          familyIncome: 'prefer-not-to-say',
          siblings: 0,
          firstGeneration: false,
          singleParent: false,
        },
        personalInterests: Array.isArray(values.interests) 
          ? values.interests 
          : (values.interests && typeof values.interests === 'string' 
              ? values.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
              : []),
        careerGoals: values.careerGoals 
          ? values.careerGoals.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : [],
        studyAbroadInterest: values.studyAbroadInterest || false,
        studyAbroadGoals: {
          interest: values.studyAbroadInterest || false,
          targetCountries: values.targetCountries || [],
          durationPreference: values.durationPreference || 'flexible',
        },
        intendedMajors: values.intendedMajor ? [{
          major: values.intendedMajor,
          rank: 1,
          confidence: values.intendedMajorConfidence || 3,
          whyInterested: values.intendedMajorWhy || '',
          alternativePaths: [],
        }] : [],
        backupMajors: Array.isArray(values.backupMajors) ? values.backupMajors.map((major: string, index: number) => ({
          major: major,
          rank: index + 1,
          confidence: 60,
        })) : [],
        valuesAndMotivations: Array.isArray(values.valuesAndMotivations) ? values.valuesAndMotivations : [],
        universityPreferences: Array.isArray(values.universityPreferences) ? values.universityPreferences : [],
        workStylePreferences: Array.isArray(values.workStylePreferences) ? values.workStylePreferences : [],
        problemSolvingApproach: Array.isArray(values.problemSolvingApproach) ? values.problemSolvingApproach : [],
      };

      await updateStudentProfile({
        personalProfile: personalProfileData as any
      });
      
      message.success('Personal profile saved successfully!');
      await refetchProfile();
    } catch (error) {
      console.error('Save error:', error);
      message.error(`Failed to save personal profile: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const countryOptions = [
    { value: 'Uzbekistan', label: 'Uzbekistan' },
    { value: 'Kazakhstan', label: 'Kazakhstan' },
    { value: 'Kyrgyzstan', label: 'Kyrgyzstan' },
    { value: 'Tajikistan', label: 'Tajikistan' },
    { value: 'Turkmenistan', label: 'Turkmenistan' },
    { value: 'Afghanistan', label: 'Afghanistan' },
    { value: 'United States', label: 'United States' },
    { value: 'Canada', label: 'Canada' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Russia', label: 'Russia' },
    { value: 'China', label: 'China' },
    { value: 'India', label: 'India' },
    { value: 'Turkey', label: 'Turkey' },
    { value: 'Other', label: 'Other' },
  ];

  const majorOptions = [
    'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
    'Cybersecurity', 'Information Technology', 'Mechanical Engineering', 'Electrical Engineering',
    'Civil Engineering', 'Chemical Engineering', 'Biomedical Engineering', 'Aerospace Engineering',
    'Business Administration', 'Finance', 'Marketing', 'Accounting', 'International Business',
    'Entrepreneurship', 'Medicine', 'Nursing', 'Pharmacy', 'Dentistry', 'Veterinary Medicine',
    'Public Health', 'Law', 'Criminal Justice', 'Political Science', 'International Relations',
    'Psychology', 'Sociology', 'Anthropology', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
    'Statistics', 'Environmental Science', 'Geology', 'Astronomy', 'Economics', 'Finance',
    'Banking', 'Architecture', 'Urban Planning', 'Graphic Design', 'Fine Arts', 'Music',
    'Theater', 'Film Studies', 'Journalism', 'Communications', 'Education', 'Social Work',
    'Agriculture', 'Food Science', 'Nutrition', 'Sports Science', 'Tourism', 'Hospitality', 'Other',
  ];

  const interestOptions = [
    'Technology', 'Science', 'Mathematics', 'Art', 'Music', 'Sports', 'Literature', 'History',
    'Politics', 'Environment', 'Social Work', 'Medicine', 'Business', 'Engineering', 'Other',
  ];

  const languageOptions = [
    'English', 'Uzbek', 'Kazakh', 'Kyrgyz', 'Tajik', 'Turkmen', 'Russian', 'Spanish',
    'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean',
    'Arabic', 'Turkish', 'Persian', 'Other',
  ];

  const proficiencyOptions = [
    { value: 'native', label: 'Native' },
    { value: 'fluent', label: 'Fluent' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'basic', label: 'Basic' },
  ];

  const learningStyleOptions = [
    { value: 'visual', label: 'Visual' },
    { value: 'auditory', label: 'Auditory' },
    { value: 'reading-writing', label: 'Reading/Writing' },
    { value: 'kinesthetic', label: 'Kinesthetic' },
    { value: 'mixed', label: 'Mixed' },
  ];

  const valuesOptions = [
    'Achievement', 'Helping Others', 'Creativity', 'Stability', 'Independence',
    'Teamwork', 'Leadership', 'Innovation', 'Service', 'Excellence', 'Growth',
    'Balance', 'Adventure', 'Security', 'Impact',
  ];

  const universityPrefOptions = [
    'Large Campus', 'Small Campus', 'Urban Location', 'Rural Location',
    'Research-Focused', 'Liberal Arts', 'Public University', 'Private University',
    'Diverse Student Body', 'Strong Alumni Network', 'Internship Opportunities',
    'Study Abroad Programs', 'Athletic Programs', 'Arts Programs',
  ];

  const workStyleOptions = [
    'Collaborative', 'Independent', 'Fast-Paced', 'Structured', 'Creative',
    'Analytical', 'Flexible', 'Goal-Oriented', 'Detail-Oriented', 'Innovative',
  ];

  const problemSolvingOptions = [
    'Analytical Approach', 'Creative Solutions', 'Systematic Method',
    'Trial and Error', 'Collaborative Problem-Solving', 'Research-Based',
  ];

  const subjectOptions = [
    'Mathematics', 'Science', 'English', 'History', 'Art', 'Music', 'Physical Education',
    'Computer Science', 'Foreign Languages', 'Social Studies', 'Economics', 'Philosophy',
  ];

  return (
    <div className="personal-profile">
      {/* Only show alert if overall profile is not complete (100% completion) */}
      {!isProfileComplete && (
        <Alert
          message={t('studentHub.profile.completeForAI')}
          description={t('studentHub.profile.completeForAIDesc')}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="personal-form"
      >
        {/* Location Information Section */}
        <Card title={t('studentHub.profile.locationInformation')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="country"
                label={t('studentHub.profile.country')}
                rules={[{ required: true, message: t('studentHub.profile.selectCountryMessage') }]}
              >
                <Select placeholder={t('studentHub.profile.selectCountry')} className="form-select">
                  {countryOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="state" label={t('studentHub.profile.stateProvince')}>
                <Input placeholder={t('studentHub.profile.enterStateProvince')} className="form-input" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label={t('studentHub.profile.city')}
                rules={[{ required: true, message: t('studentHub.profile.enterCityMessage') }]}
              >
                <Input placeholder={t('studentHub.profile.enterCity')} className="form-input" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Required Fields for AI Recommendations */}
        <Card title={t('studentHub.profile.requiredForAI')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="intendedMajor"
                label={t('studentHub.profile.intendedMajor')}
                rules={[{ required: true, message: t('studentHub.profile.selectIntendedMajorMessage') }]}
              >
                <Select placeholder={t('studentHub.profile.selectIntendedMajor')} className="form-select">
                  {majorOptions.map(major => (
                    <Option key={major} value={major}>{major}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="intendedMajorConfidence"
                label={t('studentHub.profile.confidenceLevel')}
                tooltip={t('studentHub.profile.confidenceLevelTooltip')}
                rules={[{ type: 'number', min: 1, max: 5, message: t('studentHub.profile.confidenceLevelMessage') }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="intendedMajorWhy"
                label={t('studentHub.profile.whyInterestedMajor')}
                tooltip={t('studentHub.profile.whyInterestedMajorTooltip')}
              >
                <TextArea
                  placeholder={t('studentHub.profile.describeMajorInterest')}
                  rows={3}
                  className="form-textarea"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="interests"
                label={t('studentHub.profile.personalInterests')}
                rules={[{ required: true, message: t('studentHub.profile.selectInterestsMessage') }]}
                tooltip={t('studentHub.profile.interestsTooltip')}
              >
                <Select
                  mode="multiple"
                  placeholder={t('studentHub.profile.selectInterests')}
                  className="form-select"
                >
                  {interestOptions.map(interest => (
                    <Option key={interest} value={interest}>{interest}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="careerGoals"
                label={t('studentHub.profile.careerGoals')}
                rules={[{ required: true, message: t('studentHub.profile.describeCareerGoals') }]}
                tooltip={t('studentHub.profile.careerGoalsTooltip')}
              >
                <TextArea
                  placeholder={t('studentHub.profile.enterCareerGoals')}
                  rows={4}
                  className="form-textarea"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="languages"
                label={t('studentHub.profile.languagesSpoken')}
                rules={[{ required: true, message: t('studentHub.profile.addLanguageMessage') }]}
                tooltip={t('studentHub.profile.languagesTooltip')}
              >
                <Form.List name="languages">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row
                          key={key}
                          gutter={[8, 12]}
                          align="bottom"
                          className="language-spoken-row"
                          wrap
                        >
                          <Col xs={24} sm={8} md={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'language']}
                              rules={[{ required: true, message: t('studentHub.profile.selectLanguage') }]}
                            >
                              <Select placeholder={t('studentHub.profile.language')} className="form-select" style={{ width: '100%' }}>
                                {languageOptions.map(lang => (
                                  <Option key={lang} value={lang}>{lang}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8} md={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'proficiency']}
                              rules={[{ required: true, message: t('studentHub.profile.selectProficiency') }]}
                            >
                              <Select placeholder={t('studentHub.profile.proficiency')} className="form-select" style={{ width: '100%' }}>
                                {proficiencyOptions.map(opt => (
                                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8} md={8} className="language-spoken-row__remove">
                            <Button type="link" onClick={() => remove(name)}>{t('studentHub.profile.remove')}</Button>
                          </Col>
                        </Row>
                      ))}
                      <Button type="dashed" onClick={() => add()} block>
                        {t('studentHub.profile.addLanguage')}
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="backupMajors"
                label={t('studentHub.profile.backupMajors')}
              >
                <Select
                  mode="multiple"
                  placeholder={t('studentHub.profile.selectBackupMajors')}
                  className="form-select"
                >
                  {majorOptions.map(major => (
                    <Option key={major} value={major}>{major}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Study Abroad Goals Section */}
        <Card title={t('studentHub.profile.studyAbroadGoals', 'Study Abroad Goals')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item name="studyAbroadInterest" valuePropName="checked">
                <Checkbox>{t('studentHub.profile.interestedInStudyingAbroad', 'I am interested in studying abroad')}</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="targetCountries"
                label={t('studentHub.profile.targetCountries', 'Target Countries')}
                tooltip={t('studentHub.profile.targetCountriesTooltip', "Countries you're most interested in")}
              >
                <Select mode="multiple" placeholder={t('studentHub.profile.selectCountries', 'Select countries')} className="form-select">
                  {countryOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="durationPreference" label={t('studentHub.profile.durationPreference', 'Duration Preference')}>
                <Select className="form-select">
                  <Option value="semester">{t('studentHub.profile.semester', 'Semester')}</Option>
                  <Option value="year">{t('studentHub.profile.oneYear', 'One Year')}</Option>
                  <Option value="full-degree">{t('studentHub.profile.fullDegree', 'Full Degree')}</Option>
                  <Option value="summer">{t('studentHub.profile.summer', 'Summer')}</Option>
                  <Option value="flexible">{t('studentHub.profile.flexible', 'Flexible')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Values & Goals Section */}
        <Card title={t('studentHub.profile.valuesMotivations', 'Values & Motivations')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="valuesAndMotivations"
                label={t('studentHub.profile.whatMotivatesYou', 'What motivates you?')}
                tooltip={t('studentHub.profile.valuesMotivationsTooltip', 'Select values and motivations that drive you')}
              >
                <Select mode="multiple" placeholder={t('studentHub.profile.selectValues', 'Select values')} className="form-select">
                  {valuesOptions.map(value => (
                    <Option key={value} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* University Preferences Section */}
        <Card title={t('studentHub.profile.universityPreferences', 'University Preferences')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="universityPreferences"
                label={t('studentHub.profile.preferredUniversityCharacteristics', 'Preferred University Characteristics')}
                tooltip={t('studentHub.profile.universityPreferencesTooltip', 'What type of university environment appeals to you?')}
              >
                <Select mode="multiple" placeholder={t('studentHub.profile.selectPreferences', 'Select preferences')} className="form-select">
                  {universityPrefOptions.map(pref => (
                    <Option key={pref} value={pref}>{pref}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Work Style Section */}
        <Card title={t('studentHub.profile.workStyleCareerPreferences', 'Work Style & Career Preferences')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="workStylePreferences"
                label={t('studentHub.profile.preferredWorkEnvironment', 'Preferred Work Environment')}
                tooltip={t('studentHub.profile.workEnvironmentTooltip', 'What type of work environment do you thrive in?')}
              >
                <Select mode="multiple" placeholder={t('studentHub.profile.selectPreferences', 'Select preferences')} className="form-select">
                  {workStyleOptions.map(style => (
                    <Option key={style} value={style}>{style}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="problemSolvingApproach"
                label={t('studentHub.profile.problemSolvingApproach', 'Problem-Solving Approach')}
                tooltip={t('studentHub.profile.problemSolvingTooltip', 'How do you typically approach problems?')}
              >
                <Select mode="multiple" placeholder={t('studentHub.profile.selectApproaches', 'Select approaches')} className="form-select">
                  {problemSolvingOptions.map(approach => (
                    <Option key={approach} value={approach}>{approach}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Form Actions – hidden in read-only (counselor) view */}
        {!isReadOnly && (
          <Card className="form-actions-card">
            <div className="form-actions">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<FontAwesomeIcon icon={ACTION_ICONS.SAVE} />}
                  size="large"
                >
                  {t('studentHub.profile.savePersonalProfile', 'Save Personal Profile')}
                </Button>
                <Button
                  type="default"
                  onClick={() => form.resetFields()}
                  icon={<FontAwesomeIcon icon={ACTION_ICONS.CANCEL} />}
                  size="large"
                >
                  {t('common.reset', 'Reset')}
                </Button>
              </Space>
            </div>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default PersonalProfile;
