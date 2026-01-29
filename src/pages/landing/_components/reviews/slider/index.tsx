import React from 'react';
import { CustomText } from 'src/components/common';
import { useTypedSelector } from 'src/app/store';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from './slider.module.scss';
import CustomRightArrow from '../_components/right_arrow';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useNavigate } from 'react-router-dom';

interface CarouselSlideProps {
  mainQuote: string;
  authorName: string;
  imageSrc: string;
  id: string;
}

const CarouselSlide: React.FC<CarouselSlideProps> = ({
  mainQuote,
  authorName,
  imageSrc,
  id,
}) => {
  const colors = useTypedSelector((state) => state.layout.colors);
  const { screenSize } = useScreenSize();
  const navigate = useNavigate();

  // Default image if none is provided
  const defaultImage = '/img/success-stories/success-story-1.jpg';

  return (
    <div className={styles.elementWrapper}>
      <div className={styles.commentSide}>
        <CustomText
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle3
              : themeFontSize.fontSizeTitle5
          }
          fontWeight={themeFontWeight.fontWeightMedium}
          color={colors.colorTextBase}
          mb={24}
        >
          {mainQuote || 'Success story'}
        </CustomText>
        <CustomText
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle6
              : themeFontSize.fontSizeTitle7
          }
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
          lineHeight={'28px'}
          mb={4}
        >
          — {authorName || 'Student'}
        </CustomText>
        <CustomRightArrow onClick={() => navigate(`/success-stories/${id}`)} />
      </div>
      <div className={styles.imageWrapper}>
        <img
          draggable={false}
          src={imageSrc || defaultImage}
          alt={authorName}
        />
      </div>
    </div>
  );
};

export default CarouselSlide;
