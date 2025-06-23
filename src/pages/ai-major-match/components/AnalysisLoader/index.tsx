import React from 'react';
import styles from './loader.module.scss';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';

export const AnalysisLoader = () => {
  const colors = useColors();
  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <CustomText as="h2" fontSize={28} fontWeight={700}>
        Crafting your future...
      </CustomText>
      <CustomText color={colors.colorTextSecondary} fontSize={18}>
        Our AI is analyzing your answers to find the perfect major matches for
        you.
      </CustomText>
    </div>
  );
}; 