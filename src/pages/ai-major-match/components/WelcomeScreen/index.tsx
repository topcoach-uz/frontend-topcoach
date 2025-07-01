import styles from './welcomeScreen.module.scss';
import { CustomButton, CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';

interface WelcomeScreenProps {
  onStart: () => void;
  canUseAiMajorMatch: boolean;
  aiMajorMatchUsage?: { used: number; limit: number };
}

export const WelcomeScreen = ({ onStart, canUseAiMajorMatch, aiMajorMatchUsage }: WelcomeScreenProps) => {
  const colors = useColors();
  
  const getUsageText = () => {
    if (!aiMajorMatchUsage) return '';
    return `${aiMajorMatchUsage.used}/${aiMajorMatchUsage.limit} assessments used`;
  };
  
  const getButtonText = () => {
    if (!canUseAiMajorMatch) {
      return 'Upgrade Plan to Continue';
    }
    return 'Start Assessment';
  };
  
  const handleButtonClick = () => {
    if (!canUseAiMajorMatch) {
      // Navigate to subscription page or show upgrade modal
      window.location.href = '/subscriptions';
      return;
    }
    onStart();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎓</span>
            <CustomText
              fontSize={48}
              fontWeight={700}
              color={colors.colorTextLight}
            >
              AI Major Match
            </CustomText>
          </div>
          <CustomText
            fontSize={18}
            color={colors.colorTextLight}
            className={styles.description}
            centered
          >
            Discover your perfect university major in minutes! Our AI analyzes
            your unique personality traits and preferences to match you with ideal
            programs from top universities worldwide.
          </CustomText>
        </div>

        <div className={styles.body}>
          <CustomText
            fontSize={20}
            fontWeight={600}
            color={colors.colorText}
            className={styles.subtitle}
          >
            Find your perfect university major with our AI-powered matching system.
          </CustomText>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <CustomText color={colors.colorTextSecondary} centered>
                Answer quick questions about yourself
              </CustomText>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <CustomText color={colors.colorTextSecondary} centered>
                Get personalized major matches
              </CustomText>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <CustomText color={colors.colorTextSecondary} centered>
                Explore top universities and career paths
              </CustomText>
            </div>
          </div>

          {aiMajorMatchUsage && (
            <div className={styles.usageInfo}>
              <CustomText
                fontSize={14}
                color={canUseAiMajorMatch ? colors.colorTextSecondary : colors.colorError}
                centered
              >
                {getUsageText()}
              </CustomText>
            </div>
          )}

          {!canUseAiMajorMatch && (
            <div className={styles.upgradeMessage}>
              <CustomText
                fontSize={16}
                color={colors.colorError}
                centered
                className={styles.upgradeText}
              >
                You've used all your AI Major Match assessments. Upgrade your plan to continue!
              </CustomText>
            </div>
          )}

          <CustomButton
            type="primary"
            size="large"
            className={styles.startButton}
            onClick={handleButtonClick}
            disabled={!canUseAiMajorMatch}
          >
            {getButtonText()}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}; 