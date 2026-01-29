import { createArray } from 'src/utils';
import styles from './heroBackground.module.scss';
import { useEffect } from 'react';

export default function HeroBackground() {
  useEffect(() => {
    const blocks = document.querySelectorAll(`.${styles.hero_background} div`);
    blocks.forEach((block) => {
      const delay = Math.random() * 2; // Random delay between 0 and 2 seconds
      (block as HTMLElement).style.animationDelay = `${delay}s`;
      block.classList.add(styles.flicker);
    });
  }, []);

  return (
    <div className={`${styles.hero_background}`}>
      {createArray(1, 400).map((_, i) => (
        <div key={i}></div>
      ))}
    </div>
  );
}
