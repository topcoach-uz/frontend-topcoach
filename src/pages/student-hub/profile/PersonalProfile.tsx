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
}

const PersonalProfile: React.FC<PersonalProfileProps> = ({ data }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile();

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
      <Alert
        message="Complete Your Profile for AI Recommendations"
        description="To get the best AI-powered essay assistance and major matching, please complete all required fields marked with *"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="personal-form"
      >
        {/* Location Information Section */}
        <Card title="Location Information" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please select your country' }]}
              >
                <Select placeholder="Select country" className="form-select">
                  {countryOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="state" label="State/Province">
                <Input placeholder="Enter your state or province" className="form-input" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter your city' }]}
              >
                <Input placeholder="Enter your city" className="form-input" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Required Fields for AI Recommendations */}
        <Card title="Required for AI Recommendations *" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="intendedMajor"
                label="Intended Major *"
                rules={[{ required: true, message: 'Please select your intended major' }]}
              >
                <Select placeholder="Select your intended major" className="form-select">
                  {majorOptions.map(major => (
                    <Option key={major} value={major}>{major}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="intendedMajorConfidence"
                label="Confidence Level (1-5)"
                tooltip="How confident are you about this major choice?"
                rules={[{ type: 'number', min: 1, max: 5, message: 'Please select a confidence level between 1 and 5' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="intendedMajorWhy"
                label="Why are you interested in this major?"
                tooltip="This helps AI provide better essay and major recommendations"
              >
                <TextArea
                  placeholder="Describe what draws you to this field..."
                  rows={3}
                  className="form-textarea"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="interests"
                label="Personal Interests *"
                rules={[{ required: true, message: 'Please select at least one interest' }]}
                tooltip="Your interests help AI understand your passions for essay personalization"
              >
                <Select
                  mode="multiple"
                  placeholder="Select your interests"
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
                label="Career Goals *"
                rules={[{ required: true, message: 'Please describe your career goals' }]}
                tooltip="Describe your short-term and long-term career aspirations (one per line)"
              >
                <TextArea
                  placeholder="Enter your career goals, one per line..."
                  rows={4}
                  className="form-textarea"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="languages"
                label="Languages Spoken *"
                rules={[{ required: true, message: 'Please add at least one language' }]}
                tooltip="Required for AI essay assistance and mentorship matching"
              >
                <Form.List name="languages">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'language']}
                            rules={[{ required: true, message: 'Select language' }]}
                          >
                            <Select placeholder="Language" style={{ width: 150 }}>
                              {languageOptions.map(lang => (
                                <Option key={lang} value={lang}>{lang}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'proficiency']}
                            rules={[{ required: true, message: 'Select proficiency' }]}
                          >
                            <Select placeholder="Proficiency" style={{ width: 150 }}>
                              {proficiencyOptions.map(opt => (
                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Button type="link" onClick={() => remove(name)}>Remove</Button>
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block>
                        + Add Language
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="backupMajors"
                label="Backup Majors"
              >
                <Select
                  mode="multiple"
                  placeholder="Select backup majors"
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
        <Card title="Study Abroad Goals" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item name="studyAbroadInterest" valuePropName="checked">
                <Checkbox>I am interested in studying abroad</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="targetCountries"
                label="Target Countries"
                tooltip="Countries you're most interested in"
              >
                <Select mode="multiple" placeholder="Select countries" className="form-select">
                  {countryOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="durationPreference" label="Duration Preference">
                <Select className="form-select">
                  <Option value="semester">Semester</Option>
                  <Option value="year">One Year</Option>
                  <Option value="full-degree">Full Degree</Option>
                  <Option value="summer">Summer</Option>
                  <Option value="flexible">Flexible</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Values & Goals Section */}
        <Card title="Values & Motivations" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="valuesAndMotivations"
                label="What motivates you?"
                tooltip="Select values and motivations that drive you"
              >
                <Select mode="multiple" placeholder="Select values" className="form-select">
                  {valuesOptions.map(value => (
                    <Option key={value} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* University Preferences Section */}
        <Card title="University Preferences" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="universityPreferences"
                label="Preferred University Characteristics"
                tooltip="What type of university environment appeals to you?"
              >
                <Select mode="multiple" placeholder="Select preferences" className="form-select">
                  {universityPrefOptions.map(pref => (
                    <Option key={pref} value={pref}>{pref}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Work Style Section */}
        <Card title="Work Style & Career Preferences" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                name="workStylePreferences"
                label="Preferred Work Environment"
                tooltip="What type of work environment do you thrive in?"
              >
                <Select mode="multiple" placeholder="Select preferences" className="form-select">
                  {workStyleOptions.map(style => (
                    <Option key={style} value={style}>{style}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="problemSolvingApproach"
                label="Problem-Solving Approach"
                tooltip="How do you typically approach problems?"
              >
                <Select mode="multiple" placeholder="Select approaches" className="form-select">
                  {problemSolvingOptions.map(approach => (
                    <Option key={approach} value={approach}>{approach}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Form Actions */}
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
                Save Personal Profile
              </Button>
              <Button
                type="default"
                onClick={() => form.resetFields()}
                icon={<FontAwesomeIcon icon={ACTION_ICONS.CANCEL} />}
                size="large"
              >
                Reset
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default PersonalProfile;
