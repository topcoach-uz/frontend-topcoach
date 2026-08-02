import { useTranslation } from 'react-i18next';
import { Users, MessageCircle, Gift } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

/**
 * Wizard Step 5 — motivational interstitial about the TopCoach community.
 * Purely persuasive, single Continue button; NOT a navigation handoff (the
 * real community handoff happens later, at the academic step per
 * ONBOARDING_DESIGN.md §5 — a future PR).
 */
export default function StepCommunity({ onNext }: Props) {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <MessageCircle size={20} />,
      text: t(
        'onboarding.community.benefit1',
        "Ask questions and get answers from mentors and students who've been where you are.",
      ),
    },
    {
      icon: <Users size={20} />,
      text: t(
        'onboarding.community.benefit2',
        'Share wins, get feedback on essays and applications, and stay motivated together.',
      ),
    },
    {
      icon: <Gift size={20} />,
      text: t(
        'onboarding.community.benefit3',
        'Earn coins and unlock rewards just for being an active member.',
      ),
    },
  ];

  return (
    <div className={styles.body}>
      <ul className={styles.benefitList}>
        {benefits.map((b, i) => (
          <li key={i} className={styles.benefitItem}>
            <span className={styles.benefitIcon}>{b.icon}</span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
      <CustomButton type="primary" width="100%" onClick={onNext}>
        {t('btn.continue')}
      </CustomButton>
    </div>
  );
}
