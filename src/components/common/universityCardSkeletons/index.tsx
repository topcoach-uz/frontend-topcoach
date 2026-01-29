import { Skeleton } from 'antd';
import { createArray } from 'src/utils';
import { CustomCard } from 'src/components/cards';
import styles from './universityCardSkeletons.module.scss';

export default function UniversityCardSkeletons() {
  return createArray(1, 12).map((el) => (
    <li key={el}>
      <CustomCard
        padding={0}
        borderRadius={12}
        shadowed={true}
        className={styles.card}
        bordered
      >
        {/* Image placeholder - exactly like real card */}
        <Skeleton.Image
          rootClassName={styles.skeleton}
          style={{ width: '100%', height: 180 }}
        />
        
        {/* Content wrapper - exactly like real card */}
        <div className={styles.description_wrapper}>
          {/* Majors section - exactly like real card */}
          <div className={styles.majors}>
            <div className={styles.majorFlex}>
              <div className={styles.major}>
                <Skeleton.Input active size="small" style={{ width: '80px', height: '12px', border: 'none', background: 'transparent' }} />
              </div>
              <div className={styles.major}>
                <Skeleton.Input active size="small" style={{ width: '100px', height: '12px', border: 'none', background: 'transparent' }} />
              </div>
            </div>
            <div className={styles.major}>
              <Skeleton.Input active size="small" style={{ width: '40px', height: '12px', border: 'none', background: 'transparent' }} />
            </div>
          </div>
          
          {/* University name - using Skeleton for text */}
          <div style={{ marginBottom: '4px' }}>
            <Skeleton.Input 
              active 
              style={{ 
                width: '85%', 
                height: '20px',
                border: 'none',
                background: 'transparent'
              }} 
            />
          </div>
          
          {/* Location */}
          <div style={{ marginBottom: '8px' }}>
            <Skeleton.Input 
              active 
              style={{ 
                width: '70%', 
                height: '14px',
                border: 'none',
                background: 'transparent'
              }} 
            />
          </div>
          
          {/* Ranking */}
          <div style={{ marginBottom: '8px' }}>
            <Skeleton.Input 
              active 
              style={{ 
                width: '60%', 
                height: '14px',
                border: 'none',
                background: 'transparent'
              }} 
            />
          </div>
          
          {/* Tuition */}
          <div>
            <Skeleton.Input 
              active 
              style={{ 
                width: '50%', 
                height: '14px',
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