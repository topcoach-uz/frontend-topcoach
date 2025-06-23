import { CustomText } from 'src/components/common';
import styles from './illustration_panel.module.scss';
import { useTypedSelector } from 'src/app/store';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';

interface Props {
  title: string;
}

export default function IllustrationPanel({ title = '' }: Props) {
  const colors = useTypedSelector((state) => state.layout.colors);

  return (
    <div className={styles.page_wrapper}>
      <div className={styles.circle_blur}></div>
      <div className={styles.top}>
        <img className={styles.firstImg} src={images[0]} alt="Img error" />
        <img className={styles.secondImg} src={images[1]} alt="Img error" />
      </div>
      <div className={styles.bottom}>
        <img className={styles.thirdImg} src={images[2]} alt="Img error" />
        <img className={styles.fourthImg} src={images[3]} alt="Img error" />
        <img className={styles.fivethImg} src={images[4]} alt="Img error" />
      </div>
      <CustomText
        fontSize={32}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextLight}
        mt={74}
      >
        {title}
      </CustomText>
    </div>
  );
}

const images = [
  '/landing/Dostonbek Nuraliev.webp',
  '/landing/Diyora Shodmonova.jpeg',
  '/landing/Dono Abdurahmanova.webp',
  '/landing/Jakhongir Sadiev.webp',
  '/landing/Kuvonchbek Otabekov.webp',
];
