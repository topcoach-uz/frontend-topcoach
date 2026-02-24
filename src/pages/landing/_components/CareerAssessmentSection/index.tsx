import { useTranslation } from 'react-i18next';
import { CheckOutlined } from '@ant-design/icons';
import { CustomButton, CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import styles from './careerAssessment.module.scss';

const SAMPLE_RESULTS = [
  { label: 'Computer Science', match: 95 },
  { label: 'Data Science', match: 87 },
  { label: 'Business Analytics', match: 76 },
];

export default function CareerAssessmentSection() {
  const colors = useColors();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const primary = colors?.colorPrimary ?? '#8b0000';

  const handleTakeFreeAssessment = () => {
    if (isAuthenticated) {
      navigate('/student-hub/psychometric-assessment');
    } else {
      localStorage.setItem('redirectAfterLogin', '/student-hub/psychometric-assessment');
      navigate('/auth/signin');
    }
  };

  return (
    <section className={styles.section} data-section="career-assessment">
      <div className={'container ' + styles.container}>
        <CustomText
          fontSize={screenSize > 768 ? 36 : themeFontSize.fontSizeTitle4}
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase ?? '#1a1a1a'}
          mt={0}
          mb={8}
        >
          {t('landing.careerAssessment.title', 'Free Career & University Assessment')}
        </CustomText>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle5}
          color={colors.colorTextDescription}
          mb={32}
          lineHeight={1.5}
        >
          {t('landing.careerAssessment.intro', 'Not sure which major or universities are right for you? Take our comprehensive assessment to discover:')}
        </CustomText>

        <div className={styles.twoCol}>
          <div className={styles.leftCol}>
            <ul className={styles.benefitsList}>
              <li>
                <span className={styles.benefitIcon}>
                  <CheckOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                </span>
                <div>
                  <strong>{t('landing.careerAssessment.benefit1Title', 'Your Best-Fit Majors')}</strong>
                  <span>{t('landing.careerAssessment.benefit1Desc', 'Based on your interests, strengths, and career goals')}</span>
                </div>
              </li>
              <li>
                <span className={styles.benefitIcon}>
                  <CheckOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                </span>
                <div>
                  <strong>{t('landing.careerAssessment.benefit2Title', 'Personalized University List')}</strong>
                  <span>{t('landing.careerAssessment.benefit2Desc', 'Schools that match your profile and aspirations')}</span>
                </div>
              </li>
              <li>
                <span className={styles.benefitIcon}>
                  <CheckOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                </span>
                <div>
                  <strong>{t('landing.careerAssessment.benefit3Title', 'Career Path Insights')}</strong>
                  <span>{t('landing.careerAssessment.benefit3Desc', 'Understand job prospects and earning potential')}</span>
                </div>
              </li>
              <li>
                <span className={styles.benefitIcon}>
                  <CheckOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                </span>
                <div>
                  <strong>{t('landing.careerAssessment.benefit4Title', 'Scholarship Opportunities')}</strong>
                  <span>{t('landing.careerAssessment.benefit4Desc', 'Find funding options aligned with your profile')}</span>
                </div>
              </li>
            </ul>
            <CustomButton
              type="primary"
              size="large"
              onClick={handleTakeFreeAssessment}
              className={styles.ctaButton}
              style={{ backgroundColor: primary, borderColor: primary }}
            >
              {t('landing.careerAssessment.cta', 'Take Free Assessment')}
            </CustomButton>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.sampleCard}>
              <CustomText fontSize={themeFontSize.fontSizeTitle7} fontWeight={600} color={colors.colorTextBase} mb={16}>
                {t('landing.careerAssessment.sampleTitle', 'Sample Assessment Results')}
              </CustomText>
              {SAMPLE_RESULTS.map((item) => (
                <div key={item.label} className={styles.sampleRow}>
                  <span className={styles.sampleLabel}>{item.label}</span>
                  <div className={styles.sampleBarWrap}>
                    <div className={styles.sampleBarTrack}>
                      <div className={styles.sampleBarFill} style={{ width: `${item.match}%`, backgroundColor: primary }} />
                    </div>
                    <span className={styles.samplePct}>{item.match}% Match</span>
                  </div>
                </div>
              ))}
              <CustomText fontSize={themeFontSize.fontSizeTitle9} color={colors.colorTextDescription} mt={16}>
                {t('landing.careerAssessment.sampleNote', 'Takes only 10 minutes')}
              </CustomText>
              <CustomText fontSize={themeFontSize.fontSizeTitle9} color={colors.colorTextDescription}>
                {t('landing.careerAssessment.sampleNote2', 'Get instant results + detailed report')}
              </CustomText>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
