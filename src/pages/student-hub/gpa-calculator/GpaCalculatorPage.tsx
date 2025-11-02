import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Select, Input, Button, Table, Tooltip, Alert, Divider, Space, Typography, Collapse } from 'antd';
import { InfoCircleOutlined, CalculatorOutlined, CheckCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import './GpaCalculatorPage.scss';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface GradeSystem {
  id: string;
  name: string;
  description: string;
  scale: number;
  gradeMap: { [key: string]: number };
  examples: string[];
}

interface GradeInput {
  subject: string;
  grade: string;
  credits?: number;
}

// Define grade systems
const gradeSystems: { [key: string]: GradeSystem } = {
  uzbekistan: {
    id: 'uzbekistan',
    name: 'Uzbekistan',
    description: '5-point scale used in Uzbekistan (2-5)',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Excellent)', '4 (Good)', '3 (Satisfactory)', '2 (Unsatisfactory)'],
  },
  kazakhstan: {
    id: 'kazakhstan',
    name: 'Kazakhstan',
    description: '5-point scale used in Kazakhstan',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Өте жақсы)', '4 (Жақсы)', '3 (Қанағаттанарлық)', '2 (Қанағаттандырмайды)'],
  },
  tajikistan: {
    id: 'tajikistan',
    name: 'Tajikistan',
    description: '5-point scale used in Tajikistan',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Аъло)', '4 (Хуб)', '3 (Қаноатбахш)', '2 (Номусоида)'],
  },
  kyrgyzstan: {
    id: 'kyrgyzstan',
    name: 'Kyrgyzstan',
    description: '5-point scale used in Kyrgyzstan',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Эң жакшы)', '4 (Жакшы)', '3 (Канааттанарлык)', '2 (Канааттандырбайт)'],
  },
  turkmenistan: {
    id: 'turkmenistan',
    name: 'Turkmenistan',
    description: '5-point scale used in Turkmenistan',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Örän gowy)', '4 (Gowy)', '3 (Kanagatlanarlyk)', '2 (Kanagatlanok)'],
  },
  russia: {
    id: 'russia',
    name: 'Russia',
    description: '5-point scale used in Russia',
    scale: 5,
    gradeMap: {
      '5': 4.0,
      '4': 3.0,
      '3': 2.0,
      '2': 1.0,
    },
    examples: ['5 (Отлично)', '4 (Хорошо)', '3 (Удовлетворительно)', '2 (Неудовлетворительно)'],
  },
  usa: {
    id: 'usa',
    name: 'USA',
    description: 'Standard US grading system (A, B, C, D, F)',
    scale: 4.0,
    gradeMap: {
      'A+': 4.0,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'D-': 0.7,
      'F': 0.0,
    },
    examples: ['A+ (97-100)', 'A (93-96)', 'A- (90-92)', 'B+ (87-89)', 'B (83-86)', 'B- (80-82)'],
  },
  uk: {
    id: 'uk',
    name: 'United Kingdom',
    description: 'UK grading system (First, Upper Second, Lower Second, Third)',
    scale: 100,
    gradeMap: {
      'First': 4.0,
      'Upper Second': 3.7,
      'Lower Second': 3.3,
      'Third': 3.0,
      'Pass': 2.0,
      'Fail': 0.0,
    },
    examples: ['First (70-100)', 'Upper Second (60-69)', 'Lower Second (50-59)', 'Third (40-49)'],
  },
  germany: {
    id: 'germany',
    name: 'Germany',
    description: 'German grading system (1.0-6.0, where 1.0 is best)',
    scale: 6.0,
    gradeMap: {
      '1.0': 4.0,
      '1.3': 3.7,
      '1.7': 3.3,
      '2.0': 3.0,
      '2.3': 2.7,
      '2.7': 2.3,
      '3.0': 2.0,
      '3.3': 1.7,
      '3.7': 1.3,
      '4.0': 1.0,
      '5.0': 0.0,
      '6.0': 0.0,
    },
    examples: ['1.0 (Sehr gut)', '2.0 (Gut)', '3.0 (Befriedigend)', '4.0 (Ausreichend)', '5.0/6.0 (Nicht ausreichend)'],
  },
  france: {
    id: 'france',
    name: 'France',
    description: 'French grading system (0-20, where 20 is best)',
    scale: 20,
    gradeMap: {},
    examples: ['16-20 (Très bien)', '14-15 (Bien)', '12-13 (Assez bien)', '10-11 (Passable)', '0-9 (Insuffisant)'],
  },
  india: {
    id: 'india',
    name: 'India',
    description: 'Indian percentage-based system',
    scale: 100,
    gradeMap: {},
    examples: ['90-100% (O)', '80-89% (A+)', '70-79% (A)', '60-69% (B+)', '50-59% (B)'],
  },
  china: {
    id: 'china',
    name: 'China',
    description: 'Chinese grading system (percentage-based)',
    scale: 100,
    gradeMap: {},
    examples: ['90-100 (优秀)', '80-89 (良好)', '70-79 (中等)', '60-69 (及格)', '0-59 (不及格)'],
  },
  percentage: {
    id: 'percentage',
    name: 'Percentage (0-100)',
    description: 'Percentage-based grading system',
    scale: 100,
    gradeMap: {},
    examples: ['90-100 (A)', '80-89 (B)', '70-79 (C)', '60-69 (D)', '0-59 (F)'],
  },
};

// Target GPA systems
const targetSystems: { [key: string]: { name: string; scale: number; description: string } } = {
  usa: {
    name: 'USA (4.0 Scale)',
    scale: 4.0,
    description: 'Standard US GPA scale where A=4.0, B=3.0, C=2.0, D=1.0, F=0.0',
  },
  uk: {
    name: 'United Kingdom',
    scale: 100,
    description: 'UK degree classification: First (70+), Upper Second (60-69), Lower Second (50-59), Third (40-49)',
  },
  europe: {
    name: 'Europe (ECTS)',
    scale: 5.0,
    description: 'European Credit Transfer System: A (Excellent), B (Very Good), C (Good), D (Satisfactory), E (Sufficient), F (Fail)',
  },
  germany: {
    name: 'Germany',
    scale: 6.0,
    description: 'German grading system (1.0-6.0, where 1.0 is best, 4.0 is passing)',
  },
  france: {
    name: 'France',
    scale: 20,
    description: 'French grading system (0-20 scale, where 20 is best, 10 is passing)',
  },
  canada: {
    name: 'Canada',
    scale: 4.0,
    description: 'Canadian GPA scale (similar to US, varies by province)',
  },
  australia: {
    name: 'Australia',
    scale: 7.0,
    description: 'Australian grading system (0-7 scale, where 7 is highest)',
  },
  india: {
    name: 'India',
    scale: 100,
    description: 'Indian percentage-based system with letter grades',
  },
  china: {
    name: 'China',
    scale: 100,
    description: 'Chinese percentage-based grading system',
  },
  japan: {
    name: 'Japan',
    scale: 100,
    description: 'Japanese grading system (S, A, B, C, F scale)',
  },
  southKorea: {
    name: 'South Korea',
    scale: 4.5,
    description: 'Korean GPA scale (0-4.5, where 4.5 is highest)',
  },
  singapore: {
    name: 'Singapore',
    scale: 5.0,
    description: 'Singapore grading system (A+, A, B+, B, C+, C, D+, D, F)',
  },
};

const GpaCalculatorPage: React.FC = () => {
  const { t } = useTranslation();
  const [sourceSystem, setSourceSystem] = useState<string>('uzbekistan');
  const [targetSystem, setTargetSystem] = useState<string>('usa');
  const [grades, setGrades] = useState<GradeInput[]>([
    { subject: '', grade: '', credits: 1 },
  ]);
  const [calculatedGpa, setCalculatedGpa] = useState<number | null>(null);
  const [sourceGpa, setSourceGpa] = useState<number | null>(null);
  const [convertedGrade, setConvertedGrade] = useState<string>('');

  // Clear calculations and grades when source or target system changes
  useEffect(() => {
    setCalculatedGpa(null);
    setSourceGpa(null);
    setConvertedGrade('');
    // Reset to single empty grade row
    setGrades([{ subject: '', grade: '', credits: 1 }]);
  }, [sourceSystem, targetSystem]);

  // Convert percentage to GPA (USA scale)
  const percentageToGpa = (percentage: number): number => {
    if (percentage >= 97) return 4.0;
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 65) return 1.0;
    return 0.0;
  };

  // Convert GPA to UK classification
  const gpaToUK = (gpa: number): string => {
    const percentage = (gpa / 4.0) * 100;
    if (percentage >= 70) return 'First Class (1st)';
    if (percentage >= 60) return 'Upper Second Class (2:1)';
    if (percentage >= 50) return 'Lower Second Class (2:2)';
    if (percentage >= 40) return 'Third Class (3rd)';
    return 'Fail';
  };

  // Convert GPA to European ECTS
  const gpaToECTS = (gpa: number): string => {
    if (gpa >= 4.5) return 'A (Excellent)';
    if (gpa >= 4.0) return 'B (Very Good)';
    if (gpa >= 3.5) return 'C (Good)';
    if (gpa >= 3.0) return 'D (Satisfactory)';
    if (gpa >= 2.5) return 'E (Sufficient)';
    return 'F (Fail)';
  };

  // Calculate weighted GPA
  const calculateGPA = () => {
    const sourceSys = gradeSystems[sourceSystem];
    if (!sourceSys) return;

    let totalPoints = 0; // For 4.0 scale (converted)
    let totalCredits = 0;
    let totalSourcePoints = 0; // For source system scale
    const validGrades: GradeInput[] = [];

    grades.forEach((gradeInput) => {
      if (gradeInput.subject && gradeInput.grade) {
        let gradeValue: number | null = null; // For 4.0 scale (converted)
        let sourceGradeValue: number | null = null; // For source system scale

        // Handle percentage-based systems
        if (['percentage', 'india', 'china'].includes(sourceSystem)) {
          const percentage = parseFloat(gradeInput.grade);
          if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
            gradeValue = percentageToGpa(percentage);
            sourceGradeValue = percentage; // Source value is the percentage itself
          }
        } else if (sourceSystem === 'france') {
          // French system: 0-20 scale
          const frenchGrade = parseFloat(gradeInput.grade);
          if (!isNaN(frenchGrade) && frenchGrade >= 0 && frenchGrade <= 20) {
            // Convert French 0-20 to 4.0 scale: 20 = 4.0, 10 = 2.0 (passing), 0 = 0.0
            gradeValue = (frenchGrade / 20) * 4.0;
            sourceGradeValue = frenchGrade; // Source value is the French grade (0-20)
          }
        } else if (sourceSys?.gradeMap && Object.keys(sourceSys.gradeMap).length > 0) {
          // Systems with gradeMap (letter grades or numeric mapped grades)
          gradeValue = sourceSys.gradeMap[gradeInput.grade] ?? null;
          // For source GPA, use the actual grade value in source system scale
          // For numeric grades like "5", "4", "3", "2" in 5-point systems
          if (['uzbekistan', 'kazakhstan', 'tajikistan', 'kyrgyzstan', 'turkmenistan', 'russia'].includes(sourceSystem)) {
            const numericGrade = parseFloat(gradeInput.grade);
            if (!isNaN(numericGrade) && numericGrade >= 2 && numericGrade <= 5) {
              sourceGradeValue = numericGrade;
            }
          } else if (sourceSystem === 'germany') {
            // German system: grades are already in 1.0-6.0 format
            const germanGrade = parseFloat(gradeInput.grade);
            if (!isNaN(germanGrade) && germanGrade >= 1.0 && germanGrade <= 6.0) {
              sourceGradeValue = germanGrade;
            }
          } else if (sourceSystem === 'usa') {
            // USA system: map letter grades back to 4.0 scale
            sourceGradeValue = gradeValue; // USA grades are already on 4.0 scale
          } else {
            // For other systems, try to parse the grade or use converted value
            const parsed = parseFloat(gradeInput.grade);
            sourceGradeValue = !isNaN(parsed) ? parsed : (gradeValue !== null ? (gradeValue / 4.0) * sourceSys.scale : null);
          }
        }

        if (gradeValue !== null && sourceGradeValue !== null) {
          const credits = gradeInput.credits || 1;
          totalPoints += gradeValue * credits;
          totalSourcePoints += sourceGradeValue * credits;
          totalCredits += credits;
          validGrades.push({ ...gradeInput, grade: gradeInput.grade });
        }
      }
    });

    if (totalCredits > 0) {
      const gpa = totalPoints / totalCredits; // 4.0 scale for conversion
      const sourceGpaValue = totalSourcePoints / totalCredits; // Source system scale
      setCalculatedGpa(gpa);
      setSourceGpa(sourceGpaValue);

      // Convert to target system
      let converted = '';
      switch (targetSystem) {
        case 'usa':
        case 'canada':
          converted = `${gpa.toFixed(2)} / 4.0`;
          break;
        case 'uk':
          converted = gpaToUK(gpa);
          break;
        case 'europe':
          converted = gpaToECTS(gpa);
          break;
        case 'germany': {
          // Convert 4.0 GPA to German 1.0-6.0 scale (inverse: 4.0 = 1.0, 0.0 = 6.0)
          const germanGrade = 6.0 - (gpa / 4.0) * 5.0;
          converted = `${germanGrade.toFixed(1)} / 6.0`;
          break;
        }
        case 'france': {
          // Convert 4.0 GPA to French 0-20 scale
          const frenchGrade = (gpa / 4.0) * 20.0;
          converted = `${frenchGrade.toFixed(1)} / 20.0`;
          break;
        }
        case 'australia': {
          // Convert 4.0 GPA to Australian 0-7 scale
          const ausGrade = (gpa / 4.0) * 7.0;
          converted = `${ausGrade.toFixed(2)} / 7.0`;
          break;
        }
        case 'southKorea': {
          // Convert 4.0 GPA to Korean 0-4.5 scale
          const koreanGrade = (gpa / 4.0) * 4.5;
          converted = `${koreanGrade.toFixed(2)} / 4.5`;
          break;
        }
        case 'singapore': {
          // Convert to Singapore letter grades
          if (gpa >= 4.0) converted = 'A+';
          else if (gpa >= 3.5) converted = 'A';
          else if (gpa >= 3.0) converted = 'B+';
          else if (gpa >= 2.5) converted = 'B';
          else if (gpa >= 2.0) converted = 'C+';
          else if (gpa >= 1.5) converted = 'C';
          else if (gpa >= 1.0) converted = 'D+';
          else if (gpa >= 0.5) converted = 'D';
          else converted = 'F';
          break;
        }
        case 'india':
        case 'china':
        case 'japan': {
          // Convert to percentage
          const percentage = (gpa / 4.0) * 100;
          converted = `${percentage.toFixed(1)}%`;
          break;
        }
        default:
          converted = `${gpa.toFixed(2)} / 4.0`;
      }
      setConvertedGrade(converted);
    } else {
      setCalculatedGpa(null);
      setSourceGpa(null);
      setConvertedGrade('');
    }
  };

  const handleAddGrade = () => {
    setGrades([...grades, { subject: '', grade: '', credits: 1 }]);
  };

  const handleRemoveGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleGradeChange = (index: number, field: keyof GradeInput, value: any) => {
    const updatedGrades = [...grades];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    setGrades(updatedGrades);
  };

  const handleClear = () => {
    setGrades([{ subject: '', grade: '', credits: 1 }]);
    setCalculatedGpa(null);
    setSourceGpa(null);
    setConvertedGrade('');
  };

  const gradeColumns = [
    {
      title: t('studentHub.gpaCalculator.subjectCourse'),
      dataIndex: 'subject',
      key: 'subject',
      render: (_: any, record: GradeInput, index: number) => (
        <Input
          placeholder={t('studentHub.gpaCalculator.subjectPlaceholder')}
          value={record.subject}
          onChange={(e) => handleGradeChange(index, 'subject', e.target.value)}
          style={{ width: '100%', maxWidth: 200 }}
        />
      ),
    },
    {
      title: t('studentHub.gpaCalculator.grade'),
      dataIndex: 'grade',
      key: 'grade',
      render: (_: any, record: GradeInput, index: number) => {
        const sourceSys = gradeSystems[sourceSystem];
        const systemsWithoutGradeMap = ['percentage', 'france', 'india', 'china'];
        
        if (systemsWithoutGradeMap.includes(sourceSystem)) {
          return (
            <Input
              type="number"
              placeholder={sourceSystem === 'france' ? "0-20" : "0-100"}
              min={0}
              max={sourceSystem === 'france' ? 20 : 100}
              value={record.grade}
              onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
              style={{ width: 120 }}
            />
          );
        } else if (sourceSys?.gradeMap && Object.keys(sourceSys.gradeMap).length > 0) {
          // Sort grades in descending order (highest first)
          const sortedGrades = Object.keys(sourceSys.gradeMap).sort((a, b) => {
            // For numeric grades (like '5', '4', '3'), sort descending
            const aNum = parseFloat(a);
            const bNum = parseFloat(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return bNum - aNum;
            }
            // For letter grades (like 'A+', 'A', 'B+'), sort by GPA value descending
            const aValue = sourceSys.gradeMap[a];
            const bValue = sourceSys.gradeMap[b];
            return bValue - aValue;
          });

          const selectWidth = sourceSystem === 'uk' || sourceSystem === 'germany' ? 150 : 120;
          
          return (
            <Select
              placeholder={t('studentHub.gpaCalculator.selectGrade')}
              value={record.grade || undefined}
              onChange={(value) => handleGradeChange(index, 'grade', value)}
              style={{ width: selectWidth, verticalAlign: 'middle' }}
              className="grade-select"
            >
              {sortedGrades.map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}
                </Option>
              ))}
            </Select>
          );
        } else {
          return (
            <Input
              type="number"
              placeholder={t('studentHub.gpaCalculator.enterGrade')}
              value={record.grade}
              onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
              style={{ width: 120 }}
            />
          );
        }
      },
    },
    {
      title: (
        <span>
          {t('studentHub.gpaCalculator.credits')}
          <Tooltip title={t('studentHub.gpaCalculator.creditsTooltip')}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#8b0000' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'credits',
      key: 'credits',
      render: (_: any, record: GradeInput, index: number) => (
        <Input
          type="number"
          min={0.5}
          step={0.5}
          value={record.credits}
          onChange={(e) => handleGradeChange(index, 'credits', parseFloat(e.target.value) || 1)}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: t('studentHub.gpaCalculator.action'),
      key: 'action',
      render: (_: any, record: GradeInput, index: number) => (
        <Button
          type="link"
          danger
          icon={<FontAwesomeIcon icon="trash" />}
          onClick={() => handleRemoveGrade(index)}
          disabled={grades.length === 1}
        >
          {t('studentHub.gpaCalculator.remove')}
        </Button>
      ),
    },
  ];

  return (
    <div className="gpa-calculator-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('studentHub.gpaCalculator.title')}</h1>
        <p className="page-subtitle">{t('studentHub.gpaCalculator.subtitle')}</p>
      </div>

      {/* Educational Info Section */}
      <Collapse ghost className="info-collapse">
        <Panel header={t('studentHub.gpaCalculator.whatIsGPA')} key="1">
          <div className="educational-content">
            <Title level={4}>{t('studentHub.gpaCalculator.understandingGPA')}</Title>
            <Paragraph>
              <strong>{t('studentHub.gpaCalculator.gpaDescription')}</strong>
            </Paragraph>
            
            <Title level={4}>{t('studentHub.gpaCalculator.keyTerms')}</Title>
            <ul>
              <li>
                <strong>{t('studentHub.gpaCalculator.weightedGPA')}</strong>
              </li>
              <li>
                <strong>{t('studentHub.gpaCalculator.cumulativeGPA')}</strong>
              </li>
              <li>
                <strong>{t('studentHub.gpaCalculator.credits')}</strong>
              </li>
              <li>
                <strong>{t('studentHub.gpaCalculator.unweightedGPA')}</strong>
              </li>
            </ul>

            <Title level={4}>{t('studentHub.gpaCalculator.whyConversionMatters')}</Title>
            <Paragraph>
              {t('studentHub.gpaCalculator.conversionMattersDescription')}
            </Paragraph>
          </div>
        </Panel>
      </Collapse>

      {/* System Selection */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title={t('studentHub.gpaCalculator.yourCurrentSystem')} className="system-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>{t('studentHub.gpaCalculator.selectSystem')}</Text>
                <Select
                  value={sourceSystem}
                  onChange={setSourceSystem}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                >
                  {Object.entries(gradeSystems).map(([key, system]) => (
                    <Option key={key} value={key}>
                      {system.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <Alert
                message={gradeSystems[sourceSystem].description}
                description={
                  <div>
                    <Text>{t('studentHub.gpaCalculator.gradeExamples')}</Text>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                      {gradeSystems[sourceSystem].examples.map((ex, idx) => (
                        <li key={idx}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('studentHub.gpaCalculator.targetSystem')} className="system-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>{t('studentHub.gpaCalculator.convertTo')}</Text>
                <Select
                  value={targetSystem}
                  onChange={setTargetSystem}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                >
                  {Object.entries(targetSystems).map(([key, system]) => (
                    <Option key={key} value={key}>
                      {system.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <Alert
                message={targetSystems[targetSystem].description}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Grade Input Table */}
      <Card
        title={
          <Space>
            <FontAwesomeIcon icon="edit" />
            <span>{t('studentHub.gpaCalculator.enterGrades')}</span>
          </Space>
        }
        className="grades-card"
        style={{ marginTop: 24 }}
        extra={
          <Space>
            <Button icon={<FontAwesomeIcon icon="plus" />} onClick={handleAddGrade}>
              {t('studentHub.gpaCalculator.addCourse')}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t('studentHub.gpaCalculator.clearAll')}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={grades.map((g, i) => ({ ...g, key: i }))}
          columns={gradeColumns}
          pagination={false}
          locale={{ emptyText: t('studentHub.gpaCalculator.addCoursesToCalculate') }}
        />
      </Card>

      {/* Calculate Button */}
      <div className="calculate-section">
        <Button
          type="primary"
          size="large"
          icon={<CalculatorOutlined />}
          onClick={calculateGPA}
          block
          style={{
            backgroundColor: '#8b0000',
            borderColor: '#8b0000',
            height: 50,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {t('studentHub.gpaCalculator.calculateGPA')}
        </Button>
      </div>

      {/* Results */}
      {calculatedGpa !== null && (
        <Card className="results-card" style={{ marginTop: 24 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <div className="result-display">
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {t('studentHub.gpaCalculator.yourCalculatedGPA')}
                </Text>
                <Title level={2} style={{ color: '#8b0000', margin: '8px 0' }}>
                  {sourceGpa !== null 
                    ? `${sourceGpa.toFixed(2)} / ${gradeSystems[sourceSystem]?.scale || 4.0}`
                    : calculatedGpa !== null
                    ? `${calculatedGpa.toFixed(2)} / ${gradeSystems[sourceSystem]?.scale || 4.0}`
                    : '0.00 / 4.0'}
                </Title>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="result-display">
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {t('studentHub.gpaCalculator.convertedTo', { system: targetSystems[targetSystem].name })}
                </Text>
                <Title level={2} style={{ color: '#8b0000', margin: '8px 0' }}>
                  {convertedGrade}
                </Title>
              </div>
            </Col>
          </Row>

          <Divider />

          <Alert
            message={t('studentHub.gpaCalculator.importantNotes')}
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>
                  {t('studentHub.gpaCalculator.note1')}
                </li>
                <li>
                  {t('studentHub.gpaCalculator.note2')}
                </li>
                <li>
                  {t('studentHub.gpaCalculator.note3')}
                </li>
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      )}

      {/* Additional Help Section */}
      <Card title={`💡 ${t('studentHub.gpaCalculator.tips')}`} className="tips-card" style={{ marginTop: 24 }}>
        <ul style={{ fontSize: 15, lineHeight: 2 }}>
          <li>{t('studentHub.gpaCalculator.tip1')}</li>
          <li>{t('studentHub.gpaCalculator.tip2')}</li>
          <li>
            {t('studentHub.gpaCalculator.tip3')}
          </li>
          <li>
            {t('studentHub.gpaCalculator.tip4')}
          </li>
          <li>
            {t('studentHub.gpaCalculator.tip5')}
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default GpaCalculatorPage;

