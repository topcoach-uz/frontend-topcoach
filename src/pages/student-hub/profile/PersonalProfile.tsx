import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space, message, InputNumber } from 'antd';
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
    console.log('=== FORM LOADING DEBUG ===');
    console.log('Profile data:', profile);
    console.log('Personal profile data:', profile?.personalProfile);
    
    if (profile?.personalProfile) {
      const personalData = profile.personalProfile;
      console.log('Loading personal profile data:', personalData);
      
      const formData = {
        // Location Information
        country: personalData.country || '',
        state: personalData.state || '',
        city: personalData.city || '',
        
        // Personal Details
        interests: personalData.personalInterests?.join(', ') || '',
        careerGoals: personalData.careerGoals?.join(', ') || '',
        intendedMajor: personalData.intendedMajors?.[0]?.major || '',
        backupMajors: personalData.backupMajors?.map((m: any) => m.major) || [],
        
        // Additional Information
        ethnicity: personalData.demographics?.ethnicity?.[0] || '',
        citizenship: personalData.demographics?.citizenship || '',
        visaStatus: personalData.demographics?.visaStatus || '',
        languages: [], // Languages not available in demographics
      };
      
      console.log('Setting form values:', formData);
      form.setFieldsValue(formData);
      console.log('Form values set successfully');
    } else {
      console.log('No personal profile data found');
    }
    console.log('=== FORM LOADING COMPLETED ===');
  }, [profile?.personalProfile, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      console.log('=== PERSONAL PROFILE SAVE DEBUG ===');
      console.log('Form values:', values);
      console.log('Current profile ID:', profile?.id);
      
      if (!profile?.id) {
        throw new Error('No profile ID found');
      }
      
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
          languages: Array.isArray(values.languages) ? values.languages : [],
        },
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
        personalInterests: values.interests && typeof values.interests === 'string' ? values.interests.split(',').map((s: string) => s.trim()) : [],
        careerGoals: values.careerGoals && typeof values.careerGoals === 'string' ? values.careerGoals.split(',').map((s: string) => s.trim()) : [],
        studyAbroadInterest: true, // All students on our platform have study abroad interest
        intendedMajors: values.intendedMajor ? (Array.isArray(values.intendedMajor) ? values.intendedMajor.map((major: string, index: number) => ({
          major: major,
          rank: index + 1,
          confidence: 80,
        })) : [{
          major: values.intendedMajor,
          rank: 1,
          confidence: 80,
        }]) : [],
        backupMajors: Array.isArray(values.backupMajors) ? values.backupMajors.map((major: string, index: number) => ({
          major: major,
          rank: index + 1,
          confidence: 60,
        })) : [],
      };

      console.log('Personal profile data to save:', personalProfileData);
      console.log('API call payload:', { personalProfile: personalProfileData });

      const result = await updateStudentProfile({
        personalProfile: personalProfileData as any
      });
      
      console.log('Save result:', result);
      console.log('=== SAVE COMPLETED ===');
      
      message.success('Personal profile saved successfully!');
      
      // Refetch the profile data to update the UI
      await refetchProfile();
      console.log('Profile refetched after save');
    } catch (error) {
      console.error('=== SAVE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error data:', (error as any)?.data);
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
    'Computer Science',
    'Software Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Cybersecurity',
    'Information Technology',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biomedical Engineering',
    'Aerospace Engineering',
    'Business Administration',
    'Finance',
    'Marketing',
    'Accounting',
    'International Business',
    'Entrepreneurship',
    'Medicine',
    'Nursing',
    'Pharmacy',
    'Dentistry',
    'Veterinary Medicine',
    'Public Health',
    'Law',
    'Criminal Justice',
    'Political Science',
    'International Relations',
    'Psychology',
    'Sociology',
    'Anthropology',
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics',
    'Statistics',
    'Environmental Science',
    'Geology',
    'Astronomy',
    'Economics',
    'Finance',
    'Banking',
    'Architecture',
    'Urban Planning',
    'Graphic Design',
    'Fine Arts',
    'Music',
    'Theater',
    'Film Studies',
    'Journalism',
    'Communications',
    'Education',
    'Social Work',
    'Agriculture',
    'Food Science',
    'Nutrition',
    'Sports Science',
    'Tourism',
    'Hospitality',
    'Other',
  ];

  const interestOptions = [
    'Technology',
    'Science',
    'Mathematics',
    'Art',
    'Music',
    'Sports',
    'Literature',
    'History',
    'Politics',
    'Environment',
    'Social Work',
    'Medicine',
    'Business',
    'Engineering',
    'Other',
  ];

  const languageOptions = [
    'English',
    'Uzbek',
    'Kazakh',
    'Kyrgyz',
    'Tajik',
    'Turkmen',
    'Russian',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Turkish',
    'Persian',
    'Other',
  ];

  return (
    <div className="personal-profile">
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
              <Form.Item
                name="state"
                label="State/Province"
              >
                <Input
                  placeholder="Enter your state or province"
                  className="form-input"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter your city' }]}
              >
                <Input
                  placeholder="Enter your city"
                  className="form-input"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Academic Interests Section */}
        <Card title="Academic Interests & Goals" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="intendedMajor"
                label="Intended Major"
                rules={[{ required: true, message: 'Please select your intended major' }]}
              >
                <Select placeholder="Select your intended major" className="form-select">
                  {majorOptions.map(major => (
                    <Option key={major} value={major}>
                      {major}
                    </Option>
                  ))}
                </Select>
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
                    <Option key={major} value={major}>
                      {major}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="careerGoals"
                label="Career Goals"
              >
                <TextArea
                  placeholder="Describe your career goals and aspirations"
                  rows={4}
                  className="form-textarea"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="languages"
                label="Languages Spoken"
              >
                <Select
                  mode="multiple"
                  placeholder="Select languages you speak"
                  className="form-select"
                >
                  {languageOptions.map(language => (
                    <Option key={language} value={language}>
                      {language}
                    </Option>
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
                icon={<FontAwesomeIcon icon={ACTION_ICONS.CANCEL} />}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default PersonalProfile;