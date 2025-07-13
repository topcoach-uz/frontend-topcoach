import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './programs.module.scss';

const images = [
  {
    src: '/img/azizbek_programss.png',
    alt: 'Zafar',
    name: 'Zafar',
    subtitle: `Incoming student at Babson College Class of '29`,
  },
  {
    src: '/img/viola_programs.jpg',
    alt: 'Viola Fur',
    name: 'Viola Fur',
    subtitle: `Graduate of Oxford and Yale\n8 years of experience in admissions`,
  },
  {
    src: '/img/azizbek_programs.png',
    alt: 'Azizbek',
    name: 'Azizbek',
    subtitle: `Incoming student at Harvard University Class of '29`,
  },
];

export default function ProgramsPage() {
  const colors = useColors();

  return (
    <main className={styles.programs}>
      <div className={styles.centerContent}>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle2}
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
          mb={32}
          centered
          className={styles.heading}
        >
          TopCoach Admission Programs
        </CustomText>
        <br />
        <br />
        <div className={styles.galleryWrapper}>
          {images.map((img) => (
            <div className={styles.profileCard} key={img.src}>
              <img
                src={img.src}
                alt={img.alt}
                className={styles.programImage}
              />
              <div className={styles.profileName}>{img.name}</div>
              <div className={styles.profileSubtitle}>{img.subtitle}</div>
            </div>
          ))}
        </div>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle3}
          fontWeight={themeFontWeight.fontWeightMedium}
          color={colors.colorTextBase}
          mt={40}
          centered
        >
          Coming soon...
        </CustomText>
      </div>
    </main>
  );
} 