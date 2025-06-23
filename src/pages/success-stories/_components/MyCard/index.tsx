import { CustomCard } from 'src/components/cards';
import styles from './MyCard.module.scss';
import { useState } from 'react';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';

interface Props {
  title?: string;
  description?: string[];
  hoverText?: string;
  image?: string;
  id?: string;
}

export default function MyCard({ title, image, id, hoverText }: Props) {
  const [hovered, setHovered] = useState<boolean>(false);
  const colors = useColors();
  const navigate = useNavigate();

  return (
    <CustomCard
      className={`${styles.cardContainer} ${hovered && styles.cardContainerHovered}`}
      shadowed={false}
      padding={0}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onClick={() => navigate(`${id}`)}
    >
      <div className={styles.imgContainer}>
        <img src={image} alt={title} />
      </div>
      <div className={styles.textContainer}>
        <CustomText
          className={styles.title}
          as="h3"
          color={colors.colorTextLight}
          centered
        >
          {title}
        </CustomText>
        <CustomText
          as="p"
          color={colors.colorTextLight}
          className={styles.description}
          centered
        >
          {hoverText}
        </CustomText>
      </div>
    </CustomCard>
  );
}
