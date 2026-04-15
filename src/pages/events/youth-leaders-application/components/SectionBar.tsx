import React from 'react';
import styles from '../YouthLeadersApplication.module.scss';

type Props = { children: React.ReactNode };

export default function SectionBar({ children }: Props) {
  return <div className={styles.sectionBar}>{children}</div>;
}
