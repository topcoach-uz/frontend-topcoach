import { MajorsSchema } from 'src/app/api/Api';
import styles from './majors.module.scss';
import { CustomText } from 'src/components/common';
import { Skeleton } from 'antd';

interface Props {
  majors: MajorsSchema[] | undefined;
  isLoading?: boolean;
}

export default function UniversityMajorSection({ majors, isLoading = false }: Props) {
  // Show skeleton loading state when data is loading
  if (isLoading) {
    return (
      <div className={styles.majors}>
        <div className={`${styles.under} ${styles.skeletonMode}`}>
          <div className={styles.title}>
            <Skeleton.Input 
              active 
              size="small" 
              style={{ 
                width: 120, 
                height: 24,
                border: 'none',
                borderRadius: '4px'
              }} 
            />
          </div>
          <div className={styles.scrool}>
            <div style={{ padding: '16px', paddingBottom: 0 }}>
              <Skeleton 
                active 
                paragraph={{ rows: 1 }} 
                title={false}
                className={styles.skeletonNoBorder}
              />
            </div>
            <div className={styles.content}>
              {Array.from(Array(5)).map((_, index) => (
                <div key={index} className={styles.major}>
                  <Skeleton.Input 
                    active 
                    size="small" 
                    style={{ 
                      width: '80%', 
                      height: 16,
                      border: 'none',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`${styles.under} ${styles.skeletonMode}`}>
          <div className={styles.title}>
            <Skeleton.Input 
              active 
              size="small" 
              style={{ 
                width: 100, 
                height: 24,
                border: 'none',
                borderRadius: '4px'
              }} 
            />
          </div>
          <div className={styles.scrool}>
            <div style={{ padding: '16px', paddingBottom: 0 }}>
              <Skeleton 
                active 
                paragraph={{ rows: 1 }} 
                title={false}
                className={styles.skeletonNoBorder}
              />
            </div>
            <div className={styles.content}>
              {Array.from(Array(3)).map((_, index) => (
                <div key={index} className={styles.major}>
                  <Skeleton.Input 
                    active 
                    size="small" 
                    style={{ 
                      width: '70%', 
                      height: 16,
                      border: 'none',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  const underGraduateMajors = majors?.filter(
    (major) => major.type === 'undergraduate'
  );

  const graduateMajors = majors?.filter((major) => major.type === 'graduate');
  return (
    <div className={styles.majors}>
      <div className={styles.under}>
        <div className={styles.title}>
          <CustomText fontSize={20} fontWeight={500}>
            Undergraduate
          </CustomText>
        </div>
        <div className={styles.scrool}>
          <CustomText p={16} pb={0}>
            Here you can find the best Undergraduate majors for your specialty
          </CustomText>
          <div className={styles.content}>
            {underGraduateMajors?.map((major, index) => (
              <div key={major.id + index} className={styles.major}>
                {major.name?.toString()}
              </div>
            ))}
          </div>
        </div>
      </div>
      {graduateMajors && graduateMajors.length > 0 && (
        <div className={styles.under}>
          <div className={styles.title}>
            <CustomText fontSize={20} fontWeight={500}>
              Graduate
            </CustomText>
          </div>
          <div className={styles.scrool}>
            <CustomText p={16} pb={0}>
              Here you can find the best Graduate majors for your specialty
            </CustomText>
            <div className={styles.content}>
              {graduateMajors?.map((major, index) => (
                <div key={major.id + index} className={styles.major}>
                  {major.name?.toString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
