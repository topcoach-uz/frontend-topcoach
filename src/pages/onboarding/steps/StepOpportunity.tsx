import { useTranslation } from 'react-i18next';
import { MessageCircle, Users, Sparkles, ClipboardList } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

// Same intro video used on the landing hero
// (src/pages/landing/_components/hero/index.tsx) and the old StepVideo.
const INTRO_VIDEO_SRC =
  'https://www.youtube.com/embed/wtIMtMxMGXA?si=HIEIXdBYzbHd0Ap1&rel=0&modestbranding=1&showinfo=0';

/**
 * Wizard step — "What you get with TopCoach". Merges the old StepCommunity
 * (motivational benefit bullets) and StepVideo (intro video) interstitials
 * into a single screen. Purely persuasive, single Continue button — no
 * skip link, since this is a short informational step rather than a
 * decision point (nothing here is required or persisted).
 */
export default function StepOpportunity({ onNext }: Props) {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <MessageCircle size={20} />,
      text: t(
        'onboarding.opportunity.benefit1',
        'Work 1:1 with real mentors who have been through the process.',
      ),
    },
    {
      icon: <Users size={20} />,
      text: t(
        'onboarding.opportunity.benefit2',
        'Join a community of ambitious applicants just like you.',
      ),
    },
    {
      icon: <Sparkles size={20} />,
      text: t(
        'onboarding.opportunity.benefit3',
        'Discover your best-fit major with our AI-powered Major Match.',
      ),
    },
    {
      icon: <ClipboardList size={20} />,
      text: t(
        'onboarding.opportunity.benefit4',
        'Prepare for the SAT with guided practice and mentor support.',
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

      <div className={styles.videoWrapper}>
        <iframe
          width="560"
          height="315"
          src={INTRO_VIDEO_SRC}
          title="TopCoach intro video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <CustomButton type="primary" width="100%" onClick={onNext}>
        {t('btn.continue')}
      </CustomButton>
    </div>
  );
}
