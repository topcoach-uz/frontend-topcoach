import { Breadcrumb, Flex, Modal, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  MentorsResponseDto,
  UniversitiesSchema,
  UserDetailsResponseDto,
} from 'src/app/api/Api';
import { LikeIcon } from 'src/components/icons';
import { useScreenSize } from 'src/hooks/useScreenSize';
import styles from './detail.module.scss';
import RichTextRenderer from './richText';
import { CustomText } from 'src/components/common';
import MentorCard from 'src/pages/mentors/_components/mentorCard';
import CardSkeletons from 'src/components/common/cardSkeletons';
import useColors from 'src/hooks/useColors';
import { getLatestCreatedImg } from 'src/utils';
import UniversityMajorSection from '../majors';

interface IUniversityDetail extends Partial<UniversitiesSchema> {
  isLoading: boolean;
  handleLike: () => void;
  handleClose: () => void;
  open: boolean;
  isLiked: boolean;
}

export default function UniversityDetailSection({
  id,
  name,
  majors,
  isLoading,
  media,
  content,
  selectedBy,
  rankings,
  isLiked,
  open,
  handleLike,
  handleClose,
}: IUniversityDetail) {
  const { screenSize } = useScreenSize();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const blockData = (content as any)?.blocks;
  const colors = useColors();

  const breadcrumbItems = [
    {
      title: <Link to="/">{t('breadCrumb.home')}</Link>,
    },
    {
      title: <Link to="/universities">{t('breadCrumb.universities')}</Link>,
    },
    {
      title: t('breadCrumb.universitiesInfo'),
    },
  ];

  const img = media && media?.[0]?.url;

  // Editor.js content
  const firstTwoBlocks = Array.isArray(blockData) ? blockData.slice(0, 3) : [];

  const remainingBlocks = Array.isArray(blockData) ? blockData.slice(3) : [];

  const ranking = rankings && rankings[0]?.rank;

  if (isLoading) {
    return (
      <div className={styles.detail}>
        <Flex vertical gap={10}>
          <Skeleton active />
          <Skeleton active />
          <Skeleton.Image
            rootClassName={styles.imageSkeleton}
            active
            style={{ width: '100%', height: 538 }}
          />
        </Flex>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      <Modal
        open={open}
        onClose={handleClose}
        onCancel={handleClose}
        onOk={() => navigate('/auth/signin')}
        okText="Sign in"
        centered
      >
        You need to sign in to be able to use this feature
      </Modal>
      {screenSize > 768 && (
        <>
          <Flex justify="space-between">
            <Breadcrumb items={breadcrumbItems} />
            <div className={styles.like} onClick={handleLike}>
              <LikeIcon stroke={'#F5222D'} fill={isLiked ? '#F5222D' : ''} />
            </div>
          </Flex>
          <RichTextRenderer
            id={id || ''}
            blocks={Array.isArray(firstTwoBlocks) ? firstTwoBlocks : []}
            ranking={rankings && rankings[0]?.rank}
            isUniversityDetail={true}
          />
        </>
      )}

      <div className={styles.img}>
        {img ? (
          <img src={img} alt="img error" />
        ) : (
          <Skeleton.Image></Skeleton.Image>
        )}
      </div>
      {selectedBy?.length ? (
        <>
          <CustomText
            fontSize={20}
            fontWeight={600}
            color={colors.colorText}
            mt={24}
          >
            Mentors who study here
          </CustomText>
          <div className={styles.mentor}>
            {!isLoading ? (
              selectedBy?.map((mentor: any, index) => {
                const profileImage = getLatestCreatedImg(mentor?.profile.media);
                return (
                  <MentorCard
                    key={index + mentor?.id}
                    id={mentor.id ?? ''}
                    name={mentor?.profile.name}
                    imgSrc={profileImage}
                    rating={mentor.profile.overallRating}
                    sessionNumber={mentor?.sessionCount}
                    major={mentor.mentorProfile.major}
                    university={
                      mentor.mentorProfile.university ??
                      mentor?.selectedUniversities?.[0]?.name
                    }
                    classname="uniDetail"
                  />
                );
              })
            ) : (
              <CardSkeletons />
            )}
          </div>
        </>
      ) : (
        ''
      )}

      <RichTextRenderer
        ranking={rankings && rankings[0]?.rank}
        id={id || ''}
        blocks={Array.isArray(remainingBlocks) ? remainingBlocks : []}
        isUniversityDetail={true}
      />

      <div className={styles.majorTab}>
        <div className={styles.majorTitle}>
          <h2>Majors</h2>
        </div>
        <UniversityMajorSection majors={majors} />
        {/* <div className={styles.allMajors}>
          {majors?.map((major, index) => (
            <div key={index} className={styles.major}>
              {major?.name?.toString() || null}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}
