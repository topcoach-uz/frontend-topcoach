import { useTranslation } from 'react-i18next';
import { CustomButton } from 'src/components/common';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

// Same intro video used on the landing hero
// (src/pages/landing/_components/hero/index.tsx).
const INTRO_VIDEO_SRC =
  'https://www.youtube.com/embed/wtIMtMxMGXA?si=HIEIXdBYzbHd0Ap1&rel=0&modestbranding=1&showinfo=0';

export default function StepVideo({ onNext }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.body}>
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
      <button type="button" className={styles.skipLink} onClick={onNext}>
        {t('onboarding.video.skip', 'Skip for now')}
      </button>
    </div>
  );
}
