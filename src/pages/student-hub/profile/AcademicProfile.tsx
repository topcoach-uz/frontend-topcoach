import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, Row, Col, Divider, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ACADEMIC_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { AcademicProfile as AcademicProfileType } from '../../../app/services/student-hub/types';
import './AcademicProfile.scss';

const { Option } = Select;

interface AcademicProfileProps {
  data: {
    completed: boolean;
    percentage: number;
    lastUpdated: string;
  };
}

const AcademicProfile: React.FC<AcademicProfileProps> = ({ data }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState(false);
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile();

  // Initialize form with data from API
  useEffect(() => {
    if (profile?.academicProfile) {
      const academicData = profile.academicProfile;
      form.setFieldsValue({
        // Test Scores
        satMath: academicData.testScores?.sat?.math,
        satReading: academicData.testScores?.sat?.readingWriting,
        satTotal: academicData.testScores?.sat?.total,
        actComposite: academicData.testScores?.act?.composite,
        actMath: academicData.testScores?.act?.math,
        actReading: academicData.testScores?.act?.reading,
        actScience: academicData.testScores?.act?.science,
        actWriting: academicData.testScores?.act?.writing,
        
        // English Proficiency
        ieltsOverall: academicData.testScores?.ielts?.overall,
        ieltsListening: academicData.testScores?.ielts?.listening,
        ieltsReading: academicData.testScores?.ielts?.reading,
        ieltsWriting: academicData.testScores?.ielts?.writing,
        ieltsSpeaking: academicData.testScores?.ielts?.speaking,
        toeflTotal: academicData.testScores?.toefl?.total,
        toeflReading: academicData.testScores?.toefl?.reading,
        toeflListening: academicData.testScores?.toefl?.listening,
        toeflSpeaking: academicData.testScores?.toefl?.speaking,
        toeflWriting: academicData.testScores?.toefl?.writing,
        duolingoScore: academicData.testScores?.duolingo,
        
        // GPA Information
        gpaUnweighted: academicData.gpa?.unweighted,
        gpaWeighted: academicData.gpa?.weighted,
        gpaScale: academicData.gpa?.scale,
        gpaCumulative: academicData.gpa?.cumulative,
        
        // Academic Details
        curriculum: academicData.curriculum,
        graduationYear: academicData.graduationYear,
        gapYear: academicData.gapYear,
        firstGeneration: academicData.firstGeneration,
        financialAid: academicData.financialAid,
      });
    }
  }, [profile?.academicProfile, form]);

  const handleSave = async (values: any) => {
    setUpdateLoading(true);
    try {
      console.log('=== ACADEMIC PROFILE SAVE DEBUG ===');
      console.log('Form values:', values);
      console.log('Current profile ID:', profile?.id);
      
      // Transform form values to API format
      const academicProfileData = {
        testScores: {
          sat: {
            math: values.satMath,
            readingWriting: values.satReading,
            total: values.satTotal,
          },
          act: {
            composite: values.actComposite,
            math: values.actMath,
            reading: values.actReading,
            science: values.actScience,
            writing: values.actWriting,
          },
          ielts: {
            overall: values.ieltsOverall,
            listening: values.ieltsListening,
            reading: values.ieltsReading,
            writing: values.ieltsWriting,
            speaking: values.ieltsSpeaking,
          },
          toefl: {
            total: values.toeflTotal,
            reading: values.toeflReading,
            listening: values.toeflListening,
            speaking: values.toeflSpeaking,
            writing: values.toeflWriting,
          },
          duolingo: values.duolingoScore,
        },
        gpa: {
          unweighted: values.gpaUnweighted,
          weighted: values.gpaWeighted,
          scale: values.gpaScale,
          cumulative: values.gpaCumulative,
        },
        englishProficiency: {
          ielts: values.ieltsOverall,
          toefl: values.toeflTotal,
          duolingo: values.duolingoScore,
        },
        curriculum: values.curriculum,
        graduationYear: values.graduationYear,
        gapYear: values.gapYear,
        firstGeneration: values.firstGeneration,
        financialAid: values.financialAid,
      };

      console.log('Academic profile data to save:', academicProfileData);
      console.log('API call payload:', { academicProfile: academicProfileData });

      const result = await updateStudentProfile({
        academicProfile: academicProfileData as any,
      });

      console.log('Academic profile save result:', result);
      message.success('Academic profile saved successfully!');
      
      // Refetch the profile data to update the UI
      await refetchProfile();
      console.log('Academic profile refetched after save');
      console.log('=== ACADEMIC PROFILE SAVE COMPLETED ===');
    } catch (error: any) {
      console.error('=== ACADEMIC PROFILE SAVE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.data);
      message.error(`Failed to save academic profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const curriculumOptions = [
    { value: 'IB', label: 'International Baccalaureate (IB)' },
    { value: 'A-Levels', label: 'A-Levels' },
    { value: 'AP', label: 'Advanced Placement (AP)' },
    { value: 'National', label: 'National Curriculum' },
    { value: 'Other', label: 'Other' },
  ];

  const graduationYearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year, label: year.toString() };
  });

  return (
    <div className="academic-profile">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="academic-form"
      >
        {/* Test Scores Section */}
        <Card title="Standardized Test Scores" className="section-card">
          <Row gutter={[24, 24]}>
            {/* SAT Scores */}
            <Col xs={24} lg={12}>
              <div className="test-section">
                <h4 className="test-title">
                  <FontAwesomeIcon icon={ACADEMIC_ICONS.SAT} />
                  SAT Scores
                </h4>
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Form.Item
                      name="satMath"
                      label="Math Section"
                    >
                      <InputNumber
                        min={200}
                        max={800}
                        placeholder="Math Score"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      name="satReading"
                      label="Reading & Writing"
                    >
                      <InputNumber
                        min={200}
                        max={800}
                        placeholder="Reading Score"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="satTotal"
                      label="Total Score"
                    >
                      <InputNumber
                        min={400}
                        max={1600}
                        placeholder="Total Score"
                        className="score-input"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* ACT Scores */}
            <Col xs={24} lg={12}>
              <div className="test-section">
                <h4 className="test-title">
                  <FontAwesomeIcon icon={ACADEMIC_ICONS.ACT} />
                  ACT Scores
                </h4>
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Form.Item
                      name="actComposite"
                      label="Composite Score"
                    >
                      <InputNumber
                        min={1}
                        max={36}
                        placeholder="Composite"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      name="actMath"
                      label="Math"
                    >
                      <InputNumber
                        min={1}
                        max={36}
                        placeholder="Math"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      name="actReading"
                      label="Reading"
                    >
                      <InputNumber
                        min={1}
                        max={36}
                        placeholder="Reading"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      name="actScience"
                      label="Science"
                    >
                      <InputNumber
                        min={1}
                        max={36}
                        placeholder="Science"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card>

        {/* English Proficiency Section */}
        <Card title="English Proficiency Tests" className="section-card">
          <Row gutter={[24, 24]}>
            {/* IELTS */}
            <Col xs={24} lg={8}>
              <div className="test-section">
                <h4 className="test-title">
                  <FontAwesomeIcon icon={ACADEMIC_ICONS.IELTS} />
                  IELTS
                </h4>
                <Form.Item
                  name="ieltsOverall"
                  label="Overall Band Score"
                >
                  <InputNumber
                    min={0}
                    max={9}
                    step={0.5}
                    placeholder="Overall"
                    className="score-input"
                  />
                </Form.Item>
                <Row gutter={[8, 8]}>
                  <Col xs={12}>
                    <Form.Item name="ieltsListening" label="Listening">
                      <InputNumber
                        min={0}
                        max={9}
                        step={0.5}
                        placeholder="L"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="ieltsReading" label="Reading">
                      <InputNumber
                        min={0}
                        max={9}
                        step={0.5}
                        placeholder="R"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="ieltsWriting" label="Writing">
                      <InputNumber
                        min={0}
                        max={9}
                        step={0.5}
                        placeholder="W"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="ieltsSpeaking" label="Speaking">
                      <InputNumber
                        min={0}
                        max={9}
                        step={0.5}
                        placeholder="S"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* TOEFL */}
            <Col xs={24} lg={8}>
              <div className="test-section">
                <h4 className="test-title">
                  <FontAwesomeIcon icon={ACADEMIC_ICONS.TOEFL} />
                  TOEFL
                </h4>
                <Form.Item
                  name="toeflTotal"
                  label="Total Score"
                >
                  <InputNumber
                    min={0}
                    max={120}
                    placeholder="Total"
                    className="score-input"
                  />
                </Form.Item>
                <Row gutter={[8, 8]}>
                  <Col xs={12}>
                    <Form.Item name="toeflReading" label="Reading">
                      <InputNumber
                        min={0}
                        max={30}
                        placeholder="R"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="toeflListening" label="Listening">
                      <InputNumber
                        min={0}
                        max={30}
                        placeholder="L"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="toeflSpeaking" label="Speaking">
                      <InputNumber
                        min={0}
                        max={30}
                        placeholder="S"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="toeflWriting" label="Writing">
                      <InputNumber
                        min={0}
                        max={30}
                        placeholder="W"
                        className="score-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Duolingo */}
            <Col xs={24} lg={8}>
              <div className="test-section">
                <h4 className="test-title">
                  <FontAwesomeIcon icon="language" />
                  Duolingo
                </h4>
                <Form.Item
                  name="duolingoScore"
                  label="Overall Score"
                >
                  <InputNumber
                    min={10}
                    max={160}
                    placeholder="Score"
                    className="score-input"
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Card>

        {/* GPA Information Section */}
        <Card title="GPA Information" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaUnweighted"
                label="Unweighted GPA"
              >
                <InputNumber
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder="Unweighted GPA"
                  className="gpa-input"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaWeighted"
                label="Weighted GPA"
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.01}
                  placeholder="Weighted GPA"
                  className="gpa-input"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaScale"
                label="GPA Scale"
              >
                <Select placeholder="Select GPA scale" className="gpa-select">
                  <Option value={4.0}>4.0 Scale</Option>
                  <Option value={5.0}>5.0 Scale</Option>
                  <Option value={100}>100 Point Scale</Option>
                  <Option value={20}>20 Point Scale</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaCumulative"
                label="Cumulative GPA"
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.01}
                  placeholder="Cumulative GPA"
                  className="gpa-input"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Academic Details Section */}
        <Card title="Academic Details" className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="curriculum"
                label="School Curriculum"
              >
                <Select placeholder="Select curriculum" className="curriculum-select">
                  {curriculumOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="graduationYear"
                label="Graduation Year"
              >
                <Select placeholder="Select graduation year" className="graduation-select">
                  {graduationYearOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="gapYear"
                label="Gap Year"
                valuePropName="checked"
              >
                <Select placeholder="Planning a gap year?" className="gap-year-select">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="firstGeneration"
                label="First-Generation Student"
                valuePropName="checked"
              >
                <Select placeholder="First-generation student?" className="first-gen-select">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="financialAid"
                label="Financial Aid Needed"
                valuePropName="checked"
              >
                <Select placeholder="Need financial aid?" className="financial-aid-select">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes</Option>
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
                loading={updateLoading}
                icon={<FontAwesomeIcon icon={ACTION_ICONS.SAVE} />}
                size="large"
              >
                Save Academic Profile
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

export default AcademicProfile;
