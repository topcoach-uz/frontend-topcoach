import React from 'react';
import { CustomText } from 'src/components/common';
import { useTypedSelector } from 'src/app/store';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from './testimonialCard.module.scss';

interface Props {
  mainQuote: string;
  authorName: string;
  imageSrc: string;
  id: string;
  onClick: () => void;
}

const QuoteIcon = () => (
  <svg
    className={styles.quoteIcon}
    viewBox="0 0 48 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 18C0 8.059 8.059 0 18 0h6v12h-6c-3.314 0-6 2.686-6 6v6H0V18zm30 0c0-9.941 8.059-18 18-18h6v12h-6c-3.314 0-6 2.686-6 6v6H30V18z"
      fill="currentColor"
    />
  </svg>
);

export default function TestimonialCard({ mainQuote, authorName, imageSrc, onClick }: Props) {
  const colors = useTypedSelector((state) => state.layout.colors);
  const defaultImage = '/img/success-stories/success-story-1.jpg';

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <QuoteIcon />
      <CustomText
        fontSize={themeFontSize.fontSizeTitle7}
        fontWeight={themeFontWeight.fontWeightMedium}
        color={colors.colorText}
        className={styles.quote}
      >
        &ldquo;{mainQuote || 'Success story'}&rdquo;
      </CustomText>
      <div className={styles.authorRow}>
        <img
          src={imageSrc || defaultImage}
          alt={authorName}
          className={styles.avatar}
        />
        <CustomText
          fontSize={themeFontSize.fontSizeTitle8}
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
        >
          {authorName || 'Student'}
        </CustomText>
      </div>
    </button>
  );
}
