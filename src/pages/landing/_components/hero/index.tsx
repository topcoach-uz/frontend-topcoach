import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HeroBackground from './_components/background';
import MentorImagesCarousel from './_components/mentorImagesCarousel';
import styles from './hero.module.scss';

const mentorImages = [
  '/landing/Jakhongir Sadiev.webp',
  '/landing/matt1.jpeg',
  '/landing/IMG_9601.webp',
  '/landing/Kuvonchbek Otabekov.webp',
  '/landing/Javahir Saidov.webp',
  '/landing/Dono Abdurahmanova.webp',
  '/landing/dilbarumarova.jpeg',
  '/landing/photo_2025-03-18_21-16-56.jpg',
  '/landing/dinara1.jpeg',
  '/landing/photo_2025-03-19_03-03-05.jpg',
  '/landing/Ismailov Hayotullo.jpg',
  '/landing/cristina.jpeg',
];

export default function HeroSection() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  const scrollToHowItWorks = () => {
    const section = document.querySelector('[data-section="ai-search"]');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.hero_section}>
      <HeroBackground />
      <div className={'container ' + styles.container}>
        <div className={styles.hero_grid}>
          {/* Left: Text, CTA, buttons */}
          <div className={styles.hero_left}>
            <div className={styles.hero_badge}>
              <span className={styles.badge_dot} />
              {t('landing.heroBadge')}
            </div>
            <h1 className={styles.heroTitle}>
              {t('landing.mainTitle')}
            </h1>
            <p className={styles.heroSubtitle}>
              {t('landing.mainDescription')}
            </p>
            <div className={styles.hero_buttons}>
              <button
                type="button"
                className={styles.btn_primary}
                onClick={() => navigate(isAuthenticated ? '/' : '/auth/signup')}
              >
                {isAuthenticated ? t('landing.goToDashboard') : t('landing.startNow')}
              </button>
              <button
                type="button"
                className={styles.btn_secondary}
                onClick={scrollToHowItWorks}
              >
                {t('landing.seeHowItWorks')}
              </button>
            </div>
          </div>
          {/* Right: Video */}
          <div className={styles.hero_right}>
            <div className={styles.videoCard}>
              <div className={styles.videoWrapper}>
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/wtIMtMxMGXA?si=HIEIXdBYzbHd0Ap1&rel=0&modestbranding=1&showinfo=0"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mentor images section - full width */}
      <div className={styles.mentors_section}>
        <div className={'container ' + styles.mentors_container}>
          <div className={styles.mentors_heading_row}>
            <CustomText
              fontSize={themeFontSize.fontSizeTitle6}
              fontWeight={themeFontWeight.fontWeightMedium}
              color={colors.colorText}
              mb={24}
            >
              {t('landing.ourMentors')}
            </CustomText>
          </div>
        </div>
        <div className={styles.mentors_carousel_wrapper}>
          <MentorImagesCarousel images={mentorImages} />
        </div>
      </div>
    </section>
  );
}
