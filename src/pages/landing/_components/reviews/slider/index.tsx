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

const QuoteIcon = () => (
  <svg
    className={styles.quoteIcon}
    viewBox="0 0 64 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 24C0 10.745 10.745 0 24 0h8v16h-8c-4.418 0-8 3.582-8 8v8H0V24zm40 0c0-13.255 10.745-24 24-24h8v16h-8c-4.418 0-8 3.582-8 8v8H40V24z"
      fill="currentColor"
      opacity="0.15"
    />
  </svg>
);

const CarouselSlide: React.FC<CarouselSlideProps> = ({
  mainQuote,
  authorName,
  imageSrc,
  id,
}) => {
  const colors = useTypedSelector((state) => state.layout.colors);
  const { screenSize } = useScreenSize();
  const navigate = useNavigate();

  const defaultImage = '/img/success-stories/success-story-1.jpg';

  return (
    <div className={styles.card}>
      <div className={styles.contentSide}>
        <QuoteIcon />
        <CustomText
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle3
              : themeFontSize.fontSizeTitle5
          }
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
          className={styles.quote}
        >
          &ldquo;{mainQuote || 'Success story'}&rdquo;
        </CustomText>
        <CustomText
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle7
              : themeFontSize.fontSizeTitle8
          }
          fontWeight={themeFontWeight.fontWeightMedium}
          color={colors.colorTextSecondary}
          className={styles.author}
        >
          — {authorName || 'Student'}
        </CustomText>
        <CustomRightArrow onClick={() => navigate(`/success-stories/${id}`)} />
      </div>
      <div className={styles.imageSide}>
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
