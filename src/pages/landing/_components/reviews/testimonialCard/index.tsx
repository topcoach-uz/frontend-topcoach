import React from 'react';
import { CustomText } from 'src/components/common';
import { useTypedSelector } from 'src/app/store';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from './testimonialCard.module.scss';

interface Props {
  mainQuote: string;
  authorName: string;
  authorRole?: string;
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

const initialsFrom = (name: string) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function TestimonialCard({ mainQuote, authorName, authorRole, imageSrc, onClick }: Props) {
  const colors = useTypedSelector((state) => state.layout.colors);

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
        {imageSrc ? (
          <img src={imageSrc} alt={authorName} className={styles.avatar} />
        ) : (
          <span className={styles.avatarInitials} aria-hidden="true">
            {initialsFrom(authorName)}
          </span>
        )}
        <div className={styles.authorMeta}>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle8}
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorTextBase}
          >
            {authorName || 'Student'}
          </CustomText>
          {authorRole ? (
            <CustomText
              fontSize={themeFontSize.fontSizeTitle9}
              fontWeight={themeFontWeight.fontWeightRegular}
              color={colors.colorTextSecondary}
              className={styles.authorRole}
            >
              {authorRole}
            </CustomText>
          ) : null}
        </div>
      </div>
    </button>
  );
}
