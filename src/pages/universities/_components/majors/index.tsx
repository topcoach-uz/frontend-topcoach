import { MajorsSchema } from 'src/app/api/Api';
import styles from './majors.module.scss';
import { CustomText } from 'src/components/common';

interface Props {
  majors: MajorsSchema[] | undefined;
}

export default function UniversityMajorSection({ majors }: Props) {
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
