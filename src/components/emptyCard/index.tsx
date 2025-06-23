import { EmptyCardSvg } from 'src/assets/svg';
import { CustomCard } from '../cards';
import styles from './empty.module.scss';
import { CustomText } from '../common';
import { useTypedSelector } from 'src/app/store';
import { useScreenSize } from 'src/hooks/useScreenSize';

interface EmptyCardProps {
  title: string;
  description: string;
}
export default function EmptyCardComp({ title, description }: EmptyCardProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();

  return (
    <CustomCard
      padding={screenSize > 768 ? 60 : 16}
      className={styles.empty}
      shadowed={false}
    >
      <div className={styles.round}>
        <EmptyCardSvg />
      </div>
      <CustomText
        mt={16}
        fontSize={20}
        fontWeight={600}
        color={colors.colorText}
        style={{ textAlign: 'center' }}
      >
        {title}
      </CustomText>
      <CustomText
        mt={8}
        fontSize={16}
        fontWeight={400}
        color={colors.colorTextSecondary}
        style={{ textAlign: 'center' }}
        className={styles.description}
      >
        {description}
      </CustomText>
    </CustomCard>
  );
}
