import { useScreenSize } from 'src/hooks/useScreenSize';
import styles from './mentors.module.scss';
import { Flex } from 'antd';

interface Props {
  mentorImages: string[];
}

export default function MentorList({ mentorImages }: Props) {
  const { screenSize } = useScreenSize();

  return (
    <div className={styles.mentor_list_wrapper}>
      <div className={styles.mentor_pictures_left}>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[0]} />}
          <Picture img={mentorImages[1]} />
        </Flex>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[2]} />}
          <Picture img={mentorImages[3]} />
        </Flex>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[4]} />}
          <Picture img={mentorImages[5]} />
        </Flex>
      </div>
      <div className={styles.mentor_pictures_right}>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[6]} />}
          <Picture img={mentorImages[7]} />
        </Flex>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[8]} />}
          <Picture img={mentorImages[9]} />
        </Flex>
        <Flex gap={16}>
          {screenSize > 1024 && <Picture img={mentorImages[10]} />}
          <Picture img={mentorImages[11]} />
        </Flex>
      </div>
    </div>
  );
}

const Picture = ({ img }: { img: string }) => {
  return (
    <div className={styles.mentor_picture_wrapper}>
      <img className={styles.mentor_picture} src={img} alt="mentor" />
    </div>
  );
};
