import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, Row, Col, Divider, Space, message, Modal, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ACADEMIC_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { AcademicProfile as AcademicProfileType } from '../../../app/services/student-hub/types';
import './AcademicProfile.scss';
import DegreeChoice from './DegreeChoice';

const { Option } = Select;

interface AcademicProfileProps {
  data: {
    completed: boolean;
    percentage: number;
    lastUpdated: string;
  };
  readOnly?: boolean;
  studentId?: string;
}

// Which test-score card a given field belongs to, and which fields make up
// each card — used both to render the card and to know what to clear when
// a card is removed.
type TestKey = 'sat' | 'act' | 'gre' | 'gmat' | 'ielts' | 'toefl' | 'duolingo';

const TEST_FIELD_NAMES: Record<TestKey, string[]> = {
  sat: ['satMath', 'satReading', 'satTotal'],
  act: ['actComposite', 'actMath', 'actReading', 'actScience', 'actWriting'],
  gre: ['greScore'],
  gmat: ['gmatScore'],
  ielts: ['ieltsOverall', 'ieltsListening', 'ieltsReading', 'ieltsWriting', 'ieltsSpeaking'],
  toefl: ['toeflTotal', 'toeflReading', 'toeflListening', 'toeflSpeaking', 'toeflWriting'],
  duolingo: ['duolingoScore'],
};

const TEST_ORDER: TestKey[] = ['sat', 'act', 'gre', 'gmat', 'ielts', 'toefl', 'duolingo'];

// True if any field in the given testScores subtree is a non-empty value.
// Used to derive which cards should be visible on load from saved data.
// Accepts both shapes found in `testScores`: a per-section object (sat, act,
// ielts, toefl) and a bare scalar (duolingo is just a number).
const hasAnyValue = (subtree: unknown): boolean => {
  if (subtree === undefined || subtree === null) return false;
  if (typeof subtree !== 'object') {
    return subtree !== '' && subtree !== undefined && subtree !== null;
  }
  return Object.values(subtree).some((v) => v !== undefined && v !== null && v !== '');
};

const AcademicProfile: React.FC<AcademicProfileProps> = ({ data, readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState(false);
  const isReadOnly = readOnly === true;
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, updateStudentProfile, refetchProfile } = useStudentProfile(hookOptions);
  // Layout follows the *saved* degree. Picking a degree only selects the
  // button; the page doesn't re-shape until the choice is saved.
  const targetDegree = profile?.academicProfile?.targetDegree ?? 'bachelor';
  const educationStatus = Form.useWatch('educationStatus', form);
  const previousInstitution = Form.useWatch('previousInstitution', form);
  const previousDegree = Form.useWatch('previousDegree', form);
  const previousField = Form.useWatch('previousField', form);
  const bachelorGraduationYear = Form.useWatch('bachelorGraduationYear', form);
  const universityGpa = Form.useWatch('universityGpa', form);
  const universityGpaScale = Form.useWatch('universityGpaScale', form);
  const greScore = Form.useWatch('greScore', form);
  const gmatScore = Form.useWatch('gmatScore', form);

  // Which test-score cards are currently rendered. Bootstrapped from saved
  // data on load (see effect below), then grown/shrunk by the "+ Add test
  // score" control and each card's Remove control. Once a card has been
  // shown it stays shown across refetches (e.g. after Save) — only an
  // explicit Remove takes it away — so a card the student is mid-filling-in
  // doesn't vanish out from under them.
  const [visibleTests, setVisibleTests] = useState<TestKey[]>([]);
  const [editingMasterTests, setEditingMasterTests] = useState<TestKey[]>([]);
  const [editingEducation, setEditingEducation] = useState(false);

  const educationFieldNames = ['educationStatus', 'previousInstitution', 'previousDegree', 'previousField', 'bachelorGraduationYear'];
  const educationComplete = [educationStatus, previousInstitution, previousDegree, previousField, bachelorGraduationYear].every(hasAnyValue);
  const qualification = [previousDegree, previousField]
    .filter(hasAnyValue)
    .filter((value, index, values) => index === 0 || !String(values[0]).toLowerCase().includes(String(value).toLowerCase()))
    .join(' · ');

  const finishEducationEdit = async () => {
    try {
      await form.validateFields(educationFieldNames);
      setEditingEducation(false);
    } catch {
      // Keep the editor open so its field-level validation messages stay visible.
    }
  };

  const handleFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    if (targetDegree === 'master' && errorFields.some(({ name }) => educationFieldNames.includes(String(name[0])))) {
      setEditingEducation(true);
    }
  };

  const testMeta: Record<TestKey, { icon: string; label: string }> = {
    sat: { icon: ACADEMIC_ICONS.SAT, label: t('studentHub.profile.satScores', 'SAT Scores') },
    act: { icon: ACADEMIC_ICONS.ACT, label: t('studentHub.profile.actScores', 'ACT Scores') },
    gre: { icon: ACADEMIC_ICONS.DEGREE, label: t('studentHub.profile.gre', 'GRE') },
    gmat: { icon: ACADEMIC_ICONS.DEGREE, label: t('studentHub.profile.gmat', 'GMAT') },
    ielts: { icon: ACADEMIC_ICONS.IELTS, label: t('studentHub.profile.ielts', 'IELTS') },
    toefl: { icon: ACADEMIC_ICONS.TOEFL, label: t('studentHub.profile.toefl', 'TOEFL') },
    duolingo: { icon: 'language', label: t('studentHub.profile.duolingo', 'Duolingo') },
  };

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
        targetDegree: academicData.targetDegree || 'bachelor',
        educationStatus: academicData.educationStatus,
        previousInstitution: academicData.previousInstitution,
        previousDegree: academicData.previousDegree,
        previousField: academicData.previousField,
        bachelorGraduationYear: academicData.bachelorGraduationYear,
        universityGpa: academicData.universityGpa,
        universityGpaScale: academicData.universityGpaScale,
        relevantExperience: academicData.relevantExperience,
        greScore: academicData.greScore,
        gmatScore: academicData.gmatScore,


      });

      // SAT total is derived (math + reading & writing), never trusted from
      // storage — recompute it right after hydrating the other two fields.
      const satMath = academicData.testScores?.sat?.math;
      const satReading = academicData.testScores?.sat?.readingWriting;
      form.setFieldValue(
        'satTotal',
        typeof satMath === 'number' && typeof satReading === 'number' ? satMath + satReading : undefined,
      );

      // Bootstrap which cards are visible from whatever has saved data.
      // Merge with (never replace) whatever's already showing so a
      // just-added-but-still-empty card doesn't get hidden by a refetch.
      const testScores = academicData.testScores || {};
      const hydrated: TestKey[] = TEST_ORDER.filter((key) => {
        if (key === 'gre') return hasAnyValue(academicData.greScore);
        if (key === 'gmat') return hasAnyValue(academicData.gmatScore);
        return key === 'duolingo' ? hasAnyValue(testScores.duolingo) : hasAnyValue((testScores as any)[key]);
      });
      if (hydrated.length > 0) {
        setVisibleTests((prev) => TEST_ORDER.filter((key) => prev.includes(key) || hydrated.includes(key)));
      }
    }
  }, [profile?.academicProfile, form]);

  // Keep the SAT total field derived from math + reading&writing at all
  // times — it's disabled/read-only for the student, so this is the only
  // way it ever gets a value.
  const handleValuesChange = (changedValues: Record<string, any>) => {
    if ('satMath' in changedValues || 'satReading' in changedValues) {
      const satMath = form.getFieldValue('satMath');
      const satReading = form.getFieldValue('satReading');
      form.setFieldValue(
        'satTotal',
        typeof satMath === 'number' && typeof satReading === 'number' ? satMath + satReading : undefined,
      );
    }
  };

  const handleAddTest = (key: TestKey) => {
    setVisibleTests((prev) => (prev.includes(key) ? prev : TEST_ORDER.filter((k) => prev.includes(k) || k === key)));
    if (key === 'gre' || key === 'gmat') {
      setEditingMasterTests((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  const handleRemoveTest = (key: TestKey) => {
    const fieldNames = TEST_FIELD_NAMES[key];
    const currentValues = form.getFieldsValue(fieldNames);
    const hasValues = Object.values(currentValues).some((v) => v !== undefined && v !== null && v !== '');

    const clearAndRemove = () => {
      const cleared: Record<string, null | undefined> = {};
      fieldNames.forEach((name) => {
        cleared[name] = key === 'gre' || key === 'gmat' ? null : undefined;
      });
      form.setFieldsValue(cleared);
      setVisibleTests((prev) => prev.filter((k) => k !== key));
      setEditingMasterTests((prev) => prev.filter((k) => k !== key));
    };

    if (!hasValues) {
      clearAndRemove();
      return;
    }

    Modal.confirm({
      title: t('studentHub.profile.removeTestScoreTitle', {
        test: testMeta[key].label,
        defaultValue: `Remove your ${testMeta[key].label} scores?`,
      }),
      content: t(
        'studentHub.profile.removeTestScoreContent',
        "This will delete the scores you've saved.",
      ),
      okText: t('common.remove', 'Remove'),
      okType: 'danger',
      cancelText: t('common.cancel', 'Cancel'),
      onOk: clearAndRemove,
    });
  };

  const availableTests = TEST_ORDER.filter((key) =>
    // SAT / ACT are always offered; GRE / GMAT are added for master's applicants.
    targetDegree === 'master' || (key !== 'gre' && key !== 'gmat'),
  );
  const addTestMenuItems: MenuProps['items'] = availableTests.filter(
    (key) => !visibleTests.includes(key),
  ).map(
    (key) => ({
      key,
      label: testMeta[key].label,
      onClick: () => handleAddTest(key),
    }),
  );

  const handleSave = async (values: any) => {
    setUpdateLoading(true);
    try {
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
        financialAid: targetDegree === 'master' ? profile?.academicProfile?.financialAid : values.financialAid,
        targetDegree: values.targetDegree,
        educationStatus: values.educationStatus,
        previousInstitution: values.previousInstitution,
        previousDegree: values.previousDegree,
        previousField: values.previousField,
        bachelorGraduationYear: values.bachelorGraduationYear,
        universityGpa: values.universityGpa,
        universityGpaScale: values.universityGpaScale,
        greScore: targetDegree === 'master' ? (visibleTests.includes('gre') ? values.greScore ?? null : null) : profile?.academicProfile?.greScore,
        gmatScore: targetDegree === 'master' ? (visibleTests.includes('gmat') ? values.gmatScore ?? null : null) : profile?.academicProfile?.gmatScore,
      };

      await updateStudentProfile({
        academicProfile: academicProfileData as any,
      });

      message.success('Academic profile saved successfully!');

      // Refetch the profile data to update the UI
      await refetchProfile();
      setEditingMasterTests((prev) => prev.filter((key) => !hasAnyValue(form.getFieldValue(`${key}Score`))));
    } catch (error: any) {
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

  const currentYear = new Date().getFullYear();
  const startYear = 2018;
  const endYear = currentYear + 5; // Allow up to 10 years in the future
  const graduationYearOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    return { value: year, label: year.toString() };
  });

  return (
    <div className="academic-profile">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onFinishFailed={handleFinishFailed}
        onValuesChange={handleValuesChange}
        disabled={isReadOnly}
        className="academic-form"
      >
        <Card title={t('studentHub.profile.applicationGoal', 'Application goal')} className="section-card">
          <Form.Item name="targetDegree" label={t('studentHub.profile.targetDegree', 'Degree you plan to pursue')} rules={[{ required: true }]}>
            <DegreeChoice disabled={isReadOnly} />
          </Form.Item>
        </Card>

        {targetDegree === 'master' && <Card title={t('studentHub.profile.previousEducation', 'Previous education')} className="section-card">
          {!editingEducation && (
            <div className="master-education-summary">
              <div className="master-education-summary-head">
                <div>
                  <h3>{previousInstitution || t('studentHub.profile.addPreviousEducation', 'Add previous education')}</h3>
                  {qualification && <p>{qualification}</p>}
                </div>
                {!isReadOnly && <Button type="default" icon={<FontAwesomeIcon icon={ACTION_ICONS.EDIT} />} onClick={() => setEditingEducation(true)}>{educationComplete ? t('common.edit', 'Edit') : t('common.addDetails', 'Add details')}</Button>}
              </div>
              {educationComplete && (
                <div className="master-education-facts">
                  <div><span>{t('studentHub.profile.educationStatus', 'Bachelor’s status')}</span><strong>{educationStatus === 'studying' ? t('studentHub.profile.educationStatusStudying', 'Currently studying') : t('studentHub.profile.educationStatusGraduated', 'Graduated')}</strong></div>
                  <div><span>{educationStatus === 'studying' ? t('studentHub.profile.expectedGraduationYear', 'Expected graduation year') : t('studentHub.profile.bachelorGraduationYear', 'Graduation year')}</span><strong>{bachelorGraduationYear}</strong></div>
                  <div><span>{t('studentHub.profile.universityGpa', 'University GPA')}</span><strong>{universityGpa ? `${universityGpa}${universityGpaScale ? ` / ${universityGpaScale}` : ''}` : t('studentHub.profile.notAdded', 'Not added')}</strong></div>
                </div>
              )}
            </div>
          )}
          <div className="master-education-editor" hidden={!editingEducation}>
            <Row gutter={[24, 8]}>
              <Col xs={24} md={12}><Form.Item name="educationStatus" label={t('studentHub.profile.educationStatus','Bachelor’s status')} rules={[{required:true}]}><Select disabled={isReadOnly}><Option value="studying">{t('studentHub.profile.educationStatusStudying','Currently studying')}</Option><Option value="graduated">{t('studentHub.profile.educationStatusGraduated','Graduated')}</Option></Select></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="bachelorGraduationYear" label={educationStatus === 'studying' ? t('studentHub.profile.expectedGraduationYear','Expected graduation year') : t('studentHub.profile.bachelorGraduationYear','Graduation year')} rules={[{required:true}]}><InputNumber disabled={isReadOnly} min={1900} max={2100} style={{width:'100%'}} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="previousInstitution" label={t('studentHub.profile.previousInstitution','University')} rules={[{required:true}]}><Input disabled={isReadOnly}/></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="previousDegree" label={t('studentHub.profile.previousDegree','Bachelor’s degree')} rules={[{required:true}]}><Input disabled={isReadOnly} placeholder="e.g. BSc" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="previousField" label={t('studentHub.profile.previousField','Field of study')} rules={[{required:true}]}><Input disabled={isReadOnly}/></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="universityGpa" label={t('studentHub.profile.universityGpa','University GPA (optional)')}><Input disabled={isReadOnly}/></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="universityGpaScale" label={t('studentHub.profile.universityGpaScale','GPA scale (optional)')}><Input disabled={isReadOnly} placeholder="e.g. 4.0 or 100" /></Form.Item></Col>
            </Row>
            {!isReadOnly && <div className="master-education-editor-actions"><Button type="default" icon={<FontAwesomeIcon icon={ACTION_ICONS.CHECK} />} onClick={finishEducationEdit}>{t('common.done', 'Done')}</Button></div>}
          </div>
        </Card>}
        {/* Test Scores Section — cards are added on demand; only tests the
            student has data for (or has explicitly added) render below. */}
        <Card title={t('studentHub.profile.testScores', 'Test Scores')} className="section-card">
          {!availableTests.some((key) => visibleTests.includes(key)) ? (
            <p className="no-test-scores">
              {t('studentHub.profile.noTestScoresYet', "You haven't added any test scores yet.")}
            </p>
          ) : (
            <Row gutter={[24, 24]}>
              {targetDegree === 'master' && (['gre', 'gmat'] as const).filter((key) => visibleTests.includes(key)).map((key) => {
                const score = key === 'gre' ? greScore : gmatScore;
                const editing = editingMasterTests.includes(key) || !hasAnyValue(score);
                return (
                  <Col xs={24} md={12} key={key}>
                    <div className="master-test-item">
                      {editing ? (
                        <div className="master-test-editing">
                          <div className="master-test-heading">
                            <strong className="master-test-name"><FontAwesomeIcon icon={testMeta[key].icon} />{testMeta[key].label}</strong>
                            {!isReadOnly && <Button type="text" size="small" icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />} onClick={() => handleRemoveTest(key)}>{t('common.remove', 'Remove')}</Button>}
                          </div>
                          <div className="master-test-editor">
                            <Form.Item name={`${key}Score`}>
                              <Input
                                disabled={isReadOnly}
                                inputMode="numeric"
                                aria-label={`${testMeta[key].label} ${t('studentHub.profile.score', 'Score')}`}
                                placeholder={t('studentHub.profile.enterScore', 'Enter score')}
                              />
                            </Form.Item>
                            {!isReadOnly && <Button icon={<FontAwesomeIcon icon={ACTION_ICONS.CHECK} />} disabled={!hasAnyValue(score)} onClick={() => setEditingMasterTests((prev) => prev.filter((item) => item !== key))}>{t('common.done', 'Done')}</Button>}
                          </div>
                        </div>
                      ) : (
                        <div className="master-test-summary">
                          <strong className="master-test-name"><FontAwesomeIcon icon={testMeta[key].icon} />{testMeta[key].label}</strong>
                          <span className="master-test-value">{score}</span>
                          {!isReadOnly && (
                            <div className="master-test-actions">
                              <Button type="text" size="small" icon={<FontAwesomeIcon icon={ACTION_ICONS.EDIT} />} onClick={() => setEditingMasterTests((prev) => [...prev, key])}>{t('common.edit', 'Edit')}</Button>
                              <Button type="text" size="small" icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />} onClick={() => handleRemoveTest(key)}>{t('common.remove', 'Remove')}</Button>
                            </div>
                          )}
                          <Form.Item name={`${key}Score`} hidden><Input type="hidden" /></Form.Item>
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
              {visibleTests.includes('sat') && (
                <Col xs={24} lg={12}>
                  <div className="test-section">
                    <div className="test-title-row">
                      <h4 className="test-title">
                        <FontAwesomeIcon icon={testMeta.sat.icon} />
                        {testMeta.sat.label}
                      </h4>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          className="remove-test-btn"
                          aria-label={`${t('common.remove', 'Remove')} ${testMeta.sat.label}`}
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />}
                          onClick={() => handleRemoveTest('sat')}
                        />
                      )}
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col xs={12}>
                        <Form.Item
                          name="satMath"
                          label={t('studentHub.profile.mathSection', 'Math Section')}
                        >
                          <InputNumber
                            min={200}
                            max={800}
                            placeholder="200–800"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="satReading"
                          label={t('studentHub.profile.readingWriting', 'Reading & Writing')}
                        >
                          <InputNumber
                            min={200}
                            max={800}
                            placeholder="200–800"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          name="satTotal"
                          label={t('studentHub.profile.totalScore', 'Total Score')}
                        >
                          <InputNumber
                            min={400}
                            max={1600}
                            placeholder="Calculated automatically"
                            className="score-input"
                            controls={false}
                            disabled
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              )}

              {visibleTests.includes('act') && (
                <Col xs={24} lg={12}>
                  <div className="test-section">
                    <div className="test-title-row">
                      <h4 className="test-title">
                        <FontAwesomeIcon icon={testMeta.act.icon} />
                        {testMeta.act.label}
                      </h4>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          className="remove-test-btn"
                          aria-label={`${t('common.remove', 'Remove')} ${testMeta.act.label}`}
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />}
                          onClick={() => handleRemoveTest('act')}
                        />
                      )}
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col xs={12}>
                        <Form.Item
                          name="actComposite"
                          label={t('studentHub.profile.compositeScore', 'Composite Score')}
                        >
                          <InputNumber
                            min={1}
                            max={36}
                            placeholder="1–36"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="actMath"
                          label={t('studentHub.profile.math', 'Math')}
                        >
                          <InputNumber
                            min={1}
                            max={36}
                            placeholder="1–36"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="actReading"
                          label={t('studentHub.profile.reading', 'Reading')}
                        >
                          <InputNumber
                            min={1}
                            max={36}
                            placeholder="1–36"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="actScience"
                          label={t('studentHub.profile.science', 'Science')}
                        >
                          <InputNumber
                            min={1}
                            max={36}
                            placeholder="1–36"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item
                          name="actWriting"
                          label={t('studentHub.profile.writing', 'Writing')}
                        >
                          <InputNumber
                            min={1}
                            max={36}
                            placeholder="1–36"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              )}

              {visibleTests.includes('ielts') && (
                <Col xs={24} lg={12}>
                  <div className="test-section">
                    <div className="test-title-row">
                      <h4 className="test-title">
                        <FontAwesomeIcon icon={testMeta.ielts.icon} />
                        {testMeta.ielts.label}
                      </h4>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          className="remove-test-btn"
                          aria-label={`${t('common.remove', 'Remove')} ${testMeta.ielts.label}`}
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />}
                          onClick={() => handleRemoveTest('ielts')}
                        />
                      )}
                    </div>
                    <Form.Item
                      name="ieltsOverall"
                      label={t('studentHub.profile.overallBandScore', 'Overall Band Score')}
                    >
                      <InputNumber
                        min={0}
                        max={9}
                        step={0.5}
                        placeholder="0–9"
                        className="score-input"
                            controls={false}
                      />
                    </Form.Item>
                    <Row gutter={[8, 8]}>
                      <Col xs={12}>
                        <Form.Item name="ieltsListening" label={t('studentHub.profile.listening', 'Listening')}>
                          <InputNumber
                            min={0}
                            max={9}
                            step={0.5}
                            placeholder="0–9"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="ieltsReading" label={t('studentHub.profile.reading', 'Reading')}>
                          <InputNumber
                            min={0}
                            max={9}
                            step={0.5}
                            placeholder="0–9"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="ieltsWriting" label={t('studentHub.profile.writing', 'Writing')}>
                          <InputNumber
                            min={0}
                            max={9}
                            step={0.5}
                            placeholder="0–9"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="ieltsSpeaking" label={t('studentHub.profile.speaking', 'Speaking')}>
                          <InputNumber
                            min={0}
                            max={9}
                            step={0.5}
                            placeholder="0–9"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              )}

              {visibleTests.includes('toefl') && (
                <Col xs={24} lg={12}>
                  <div className="test-section">
                    <div className="test-title-row">
                      <h4 className="test-title">
                        <FontAwesomeIcon icon={testMeta.toefl.icon} />
                        {testMeta.toefl.label}
                      </h4>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          className="remove-test-btn"
                          aria-label={`${t('common.remove', 'Remove')} ${testMeta.toefl.label}`}
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />}
                          onClick={() => handleRemoveTest('toefl')}
                        />
                      )}
                    </div>
                    <Form.Item
                      name="toeflTotal"
                      label={t('studentHub.profile.totalScore', 'Total Score')}
                    >
                      <InputNumber
                        min={0}
                        max={120}
                        placeholder="0–120"
                        className="score-input"
                            controls={false}
                      />
                    </Form.Item>
                    <Row gutter={[8, 8]}>
                      <Col xs={12}>
                        <Form.Item name="toeflReading" label={t('studentHub.profile.reading', 'Reading')}>
                          <InputNumber
                            min={0}
                            max={30}
                            placeholder="0–30"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="toeflListening" label={t('studentHub.profile.listening', 'Listening')}>
                          <InputNumber
                            min={0}
                            max={30}
                            placeholder="0–30"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="toeflSpeaking" label={t('studentHub.profile.speaking', 'Speaking')}>
                          <InputNumber
                            min={0}
                            max={30}
                            placeholder="0–30"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="toeflWriting" label={t('studentHub.profile.writing', 'Writing')}>
                          <InputNumber
                            min={0}
                            max={30}
                            placeholder="0–30"
                            className="score-input"
                            controls={false}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              )}

              {visibleTests.includes('duolingo') && (
                <Col xs={24} lg={12}>
                  <div className="test-section">
                    <div className="test-title-row">
                      <h4 className="test-title">
                        <FontAwesomeIcon icon={testMeta.duolingo.icon} />
                        {testMeta.duolingo.label}
                      </h4>
                      {!isReadOnly && (
                        <Button
                          type="text"
                          size="small"
                          className="remove-test-btn"
                          aria-label={`${t('common.remove', 'Remove')} ${testMeta.duolingo.label}`}
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DELETE} />}
                          onClick={() => handleRemoveTest('duolingo')}
                        />
                      )}
                    </div>
                    <Form.Item
                      name="duolingoScore"
                      label={t('studentHub.profile.overallScore', 'Overall Score')}
                    >
                      <InputNumber
                        min={10}
                        max={160}
                        placeholder="10–160"
                        className="score-input"
                            controls={false}
                      />
                    </Form.Item>
                  </div>
                </Col>
              )}
            </Row>
          )}

          {!isReadOnly && (
            <div className="add-test-score-row">
              {addTestMenuItems.length > 0 ? (
                <Dropdown menu={{ items: addTestMenuItems }} trigger={['click']}>
                  <Button
                    type="dashed"
                    className="add-test-score-btn"
                    icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}
                  >
                    {t('studentHub.profile.addTestScore', 'Add test score')}
                  </Button>
                </Dropdown>
              ) : (
                <span className="add-test-score-hint">
                  {t('studentHub.profile.allTestScoresAdded', "You've added every test score.")}
                </span>
              )}
            </div>
          )}
        </Card>

        {targetDegree !== 'master' && <>
        {/* GPA Information Section */}
        <Card title={t('studentHub.profile.gpaInformation', 'GPA Information')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaUnweighted"
                label={t('studentHub.profile.unweightedGpaOptional', 'Unweighted GPA (optional)')}
              >
                <InputNumber
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder={t('studentHub.profile.unweightedGpa', 'Unweighted GPA')}
                  className="gpa-input"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaWeighted"
                label={t('studentHub.profile.weightedGpa', 'Weighted GPA')}
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.01}
                  placeholder={t('studentHub.profile.weightedGpa', 'Weighted GPA')}
                  className="gpa-input"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="gpaScale"
                label={t('studentHub.profile.gpaScale', 'GPA Scale')}
              >
                <Select placeholder={t('studentHub.profile.selectGpaScale', 'Select GPA scale')} className="gpa-select">
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
                label={t('studentHub.profile.cumulativeGpa', 'Cumulative GPA')}
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.01}
                  placeholder={t('studentHub.profile.cumulativeGpa', 'Cumulative GPA')}
                  className="gpa-input"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Academic Details Section */}
        <Card title={t('studentHub.profile.academicDetails', 'Academic Details')} className="section-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="curriculum"
                label={t('studentHub.profile.schoolCurriculum', 'School Curriculum *')}
                rules={[{ required: true, message: t('studentHub.profile.pleaseSelectCurriculum', 'Please select your school curriculum') }]}
              >
                <Select placeholder={t('studentHub.profile.selectCurriculum', 'Select curriculum')} className="curriculum-select">
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
                label={t('studentHub.profile.graduationYear', 'Graduation Year *')}
                rules={[{ required: true, message: t('studentHub.profile.pleaseSelectGraduationYear', 'Please select your graduation year') }]}
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
                label={t('studentHub.profile.gapYear', 'Gap Year')}
              >
                <Select placeholder={t('studentHub.profile.planningGapYear', 'Planning a gap year?')} className="gap-year-select">
                  <Option value={false}>{t('common.no', 'No')}</Option>
                  <Option value={true}>{t('common.yes', 'Yes')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="firstGeneration"
                label={t('studentHub.profile.firstGenerationStudent', 'First-Generation Student')}
              >
                <Select placeholder={t('studentHub.profile.firstGenerationStudentQuestion', 'First-generation student?')} className="first-gen-select">
                  <Option value={false}>{t('common.no', 'No')}</Option>
                  <Option value={true}>{t('common.yes', 'Yes')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item
                name="financialAid"
                label={t('studentHub.profile.financialAidNeeded', 'Financial Aid Needed')}
              >
                <Select placeholder={t('studentHub.profile.needFinancialAid', 'Need financial aid?')} className="financial-aid-select">
                  <Option value={false}>{t('common.no', 'No')}</Option>
                  <Option value={true}>{t('common.yes', 'Yes')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>
        </>}


        {/* Form Actions – hidden in read-only (counselor) view */}
        {!isReadOnly && (
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
                  {t('studentHub.profile.saveAcademicProfile', 'Save Academic Profile')}
                </Button>
                <Button
                  type="default"
                  icon={<FontAwesomeIcon icon={ACTION_ICONS.CANCEL} />}
                  size="large"
                  onClick={() => form.resetFields()}
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

export default AcademicProfile;
