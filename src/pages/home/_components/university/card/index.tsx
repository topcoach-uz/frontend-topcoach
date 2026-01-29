import { Modal, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import { LikeIcon } from 'src/components/icons';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { IUniversity } from '../useUniversity';
import styles from './university_card.module.scss';
import useUniversityCard from './useUniversityCard';

interface Props extends IUniversity {}

export default function UniversityCard({
  image,
  location,
  major,
  name,
  ranking,
  tuition,
  aiSummary,
  isLiked: isLikedInitial,
  id,
}: Props) {
  const { colors, isLiked, handleLike, modalOpen, setModalOpen } =
    useUniversityCard({
      isLikedInitial,
      universityId: id,
      universityName: name.toString(),
    });

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/universities/${id}`);
  };

  const first3majors = major?.slice(0, 2);
  const remainingMajors = major?.slice(2, major.length) || [];

  return (
    <li key={name.toString()}>
      <CustomCard
        padding={0}
        borderRadius={12}
        shadowed={true}
        className={styles.card}
        bgColor={colors.colorBgContainer}
        bordered
        onClick={handleCardClick}
      >
        {image ? (
          <img
            className={styles.university_image}
            src={image}
            alt={name.toString()}
          />
        ) : (
          <Skeleton.Image
            rootClassName={styles.skeleton}
            style={{ width: '100%', height: 180 }}
          />
        )}
        <div className={styles.description_wrapper}>
          <div className={styles.majors}>
            <div className={styles.majorFlex}>
              {first3majors?.map((item, i) => (
                <div key={i} className={styles.major}>
                  {item}
                </div>
              ))}
            </div>
            {remainingMajors?.length > 0 && (
              <div className={styles.major}>+{remainingMajors.length}</div>
            )}
          </div>
          <CustomText
            fontWeight={themeFontWeight.fontWeightSemibold}
            fontSize={themeFontSize.fontSizeTitle5}
            color={colors.colorText}
            mb={4}
          >
            {name.toString()}
          </CustomText>
          {aiSummary?.length && aiSummary.length > 0 ? (
            <CustomText fontSize={14} mt={12} lineHeight="18px">
              {aiSummary}
            </CustomText>
          ) : (
            <>
              <CustomText
                fontSize={themeFontSize.fontSizeTitle8}
                color={colors.colorTextTertiary}
                mb={8}
              >
                {location?.toString()}
              </CustomText>
              <CustomText color={colors.colorTextSecondary} mb={8}>
                #{ranking} in QS world ranking
              </CustomText>
              <CustomText color={colors.colorTextSecondary}>
                {tuition && tuition + '/year'}
              </CustomText>
            </>
          )}
        </div>
        <div
          className={styles.like_button}
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
        >
          <LikeIcon stroke={'#F5222D'} fill={isLiked ? '#F5222D' : ''} />
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCancel={() => setModalOpen(false)}
            onOk={() => navigate('/auth/signin')}
            okText="Sign in"
            centered
          >
            You need to sign in to be able to use this feature
          </Modal>
        </div>
      </CustomCard>
    </li>
  );
}
