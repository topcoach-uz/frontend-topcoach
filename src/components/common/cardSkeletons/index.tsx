import { Skeleton } from 'antd';
import { createArray } from 'src/utils';
import { CustomCard } from 'src/components/cards';
import styles from './cardSkeletons.module.scss';

export default function CardSkeletons() {
  return createArray(1, 12).map((el) => (
    <li key={el}>
      <CustomCard
        padding={0}
        shadowed={false}
        className={styles.card}
        bordered
      >
        <div className={styles.imgContainer}>
          <div className={styles.img}>
            <Skeleton.Image
              rootClassName={styles.skeleton}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div className={styles.textSection}>
          <div className={styles.universitySection}>
            <Skeleton.Input 
              active 
              size="small" 
              style={{ 
                width: '90%', 
                height: '16px', 
                border: 'none', 
                background: 'transparent',
                marginBottom: '8px'
              }} 
            />
            <Skeleton.Input 
              active 
              size="small" 
              style={{ 
                width: '80%', 
                height: '14px', 
                border: 'none', 
                background: 'transparent',
                marginBottom: '12px'
              }} 
            />
          </div>

          <div className={styles.sessionsSection}>
            <Skeleton.Input 
              active 
              size="small" 
              style={{ 
                width: '70%', 
                height: '15px', 
                border: 'none', 
                background: 'transparent'
              }} 
            />
          </div>
        </div>
      </CustomCard>
    </li>
  ));
}