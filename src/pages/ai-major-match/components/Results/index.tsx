import { CustomButton, CustomText } from 'src/components/common';
import { AiAssessmentResult } from 'src/app/api/types';
import styles from './results.module.scss';
import useColors from 'src/hooks/useColors';

interface ResultsProps {
  results: AiAssessmentResult | null;
  onRetake: () => void;
}

export const Results = ({ results, onRetake }: ResultsProps) => {
  const colors = useColors();
  if (!results) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.status}>AI Analysis Complete</div>
            <CustomText fontSize={36} fontWeight={700} color={colors.colorText}>
              Your Perfect Major Matches
            </CustomText>
          </div>
          <CustomButton
            size="large"
            className={styles.retakeButton}
            onClick={onRetake}
          >
            Retake Assessment
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBanner}>
        <CustomText fontSize={18} fontWeight="bold" color="#fff">
          Discover your perfect university major in minutes! Our AI analyzes your unique
          personality traits and preferences to match you with ideal programs from top
          universities worldwide.
        </CustomText>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.status}>
            AI Analysis Complete
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 700, textAlign: 'center' }}>
            Your Perfect Major Matches
          </h1>
          <CustomText as="p" fontSize={18} color={colors.colorTextSecondary} style={{marginTop: '16px'}} centered>
            Our AI has analyzed your unique personality traits and preferences to match you with ideal programs from top universities worldwide.
          </CustomText>
        </div>
        <div className={styles.resultsList}>
          {results?.matches?.map((major, index) => (
            <div key={index} className={styles.majorCard}>
              <div className={styles.majorHeader}>
                <div>
                  <CustomText as="h2" fontSize={28} fontWeight={700}>
                    #{index + 1} {major.major}
                  </CustomText>
                  <CustomText as="h3" fontSize={16} fontWeight={600} color={colors.colorTextSecondary}>
                    {major.category}
                  </CustomText>
                </div>
                <div className={styles.matchPercentage}>
                  {major.matchPercentage}% Match
                </div>
              </div>
              <div className={styles.section}>
                <CustomText>
                  {major.summary}
                </CustomText>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 12C16 12 22 14 22 18V20H2V18C2 14 8 12 12 12Z" stroke="#C42843" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Perfect for your personality:
                </div>
                <div className={styles.tags}>
                  {major.personalityFit.map((trait) => (
                    <div key={trait} className={styles.tag}>
                      {trait}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#C42843" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Career Pathways:
                </div>
                <div className={styles.tags}>
                  {major.careerPathways.map((path) => (
                    <div key={path} className={`${styles.tag} ${styles.careerTag}`}>
                      {path}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <CustomText
                  as="h4"
                  fontSize={16}
                  fontWeight={600}
                  className={styles.rightForYou}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16H11V12H13M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#C42843" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Why this might be right for you:
                </CustomText>
                <ul className={styles.reasoningList}>
                  {major.reasoning.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="#C42843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="#C42843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Top Universities for this Major:
                </div>
                <div className={styles.universityList}>
                  {major.topUniversities.map((uni) => (
                    <div key={uni.name} className={styles.university}>
                      <div>
                        <CustomText fontWeight={600} fontSize={15} style={{ marginBottom: '4px' }}>{uni.name}, {uni.country}</CustomText>
                        <CustomText fontSize={13} color={colors.colorTextSecondary}>
                          QS Rank: #{uni.qsRank}
                        </CustomText>
                      </div>
                      <CustomButton
                        type="primary"
                        size="small"
                        onClick={() => window.open(uni.website, '_blank')}
                      >
                        Visit Website →
                      </CustomButton>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <CustomButton
          size="large"
          className={styles.retakeButton}
          onClick={onRetake}
          type="primary"
          ghost
        >
          Retake Assessment
        </CustomButton>
      </div>
    </div>
  );
};
