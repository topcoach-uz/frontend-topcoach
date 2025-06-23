import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HeroBackground from './_components/background';
import MentorList from './_components/mentors';
import SearchUniversityInput from './_components/SearchUniversityInput';
import UniversityLogos from './_components/universities';
import styles from './hero.module.scss';

export default function HeroSection() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  return (
    <section className={styles.hero_section}>
      <HeroBackground />
      <div className={'container ' + styles.container}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <CustomText
            as="h1"
            fontSize={
              screenSize > 1024
                ? themeFontSize.fontSizeTitle1
                : screenSize > 768
                  ? themeFontSize.fontSizeTitle2
                  : themeFontSize.fontSizeTitle3
            }
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorText}
            mr={'auto'}
            ml={'auto'}
            className={styles.heroTitle}
            centered
          >
            {t('landing.mainTitle')}
          </CustomText>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle5}
            color={colors.colorTextSecondary}
            className={styles.heroSubtitle}
            ml={'auto'}
            mr={'auto'}
            mt={24}
            mb={24}
            centered
            lineHeight={1.5}
          >
            {t('landing.mainDescription')}
          </CustomText>
          <SearchUniversityInput />
          <div
            className={styles.videoWrapper}
            style={{ marginTop: '24px', textAlign: 'center' }}
          >
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/wtIMtMxMGXA?si=HIEIXdBYzbHd0Ap1&rel=0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle6}
            fontWeight={themeFontWeight.fontWeightMedium}
            centered
            color={colors.colorText}
            style={{ display: 'block' }}
            mt={150}
            mb={32}
          >
            {t('landing.topUniversities')}
          </CustomText>
        </div>
        <div className={styles.whiteGradient}></div>
        <MentorList mentorImages={mentorImages} />
      </div>

      <UniversityLogos />
    </section>
  );
}

const mentorImages = [
  '/landing/Jakhongir Sadiev.webp',
  '/landing/Dostonbek Nuraliev.webp',
  '/landing/IMG_9601.webp',
  '/landing/Kuvonchbek Otabekov.webp',
  '/landing/Javahir Saidov.webp',
  '/landing/Dono Abdurahmanova.webp',
  '/landing/Seva Amar.webp',
  '/landing/photo_2025-03-18_21-16-56.jpg',
  '/landing/Diyora Shodmonova.jpeg',
  '/landing/photo_2025-03-19_03-03-05.jpg',
  '/landing/Ismailov Hayotullo.jpg',
  '/landing/Shakhrizoda Alimbabaeva.jpg',
];
