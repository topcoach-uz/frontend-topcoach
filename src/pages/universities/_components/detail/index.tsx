import { Breadcrumb, Flex, Modal, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import React, { useMemo } from 'react';
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
import { getUniversityFlag } from 'src/utils/countryFlags';
import { getLocalizedText } from 'src/utils/translationUtils';
import UniversityMajorSection from '../majors';

interface IUniversityDetail extends Partial<UniversitiesSchema> {
  isLoading: boolean;
  handleLike: () => void;
  handleClose: () => void;
  open: boolean;
  isLiked: boolean;
}

const UniversityDetailSection = React.memo(({
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
}: IUniversityDetail) => {
  const { screenSize } = useScreenSize();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useColors();

  // Memoize expensive computations
  const blockData = useMemo(() => (content as any)?.blocks, [content]);
  
  const breadcrumbItems = useMemo(() => [
    {
      title: <Link to="/">{t('breadCrumb.home')}</Link>,
    },
    {
      title: <Link to="/universities">{t('breadCrumb.universities')}</Link>,
    },
    {
      title: t('breadCrumb.universitiesInfo'),
    },
  ], [t]);

  const img = useMemo(() => media && media?.[0]?.url, [media]);

  // Editor.js content - memoized
  const firstTwoBlocks = useMemo(() => 
    Array.isArray(blockData) ? blockData.slice(0, 3) : [], 
    [blockData]
  );

  const remainingBlocks = useMemo(() => 
    Array.isArray(blockData) ? blockData.slice(3) : [], 
    [blockData]
  );

  const ranking = useMemo(() => 
    rankings && rankings[0]?.rank, 
    [rankings]
  );

  // Remove skeleton loading for instant display
  // if (isLoading) {
  //   return (
  //     <div className={styles.detail}>
  //       <Flex vertical gap={10}>
  //         <Skeleton active />
  //         <Skeleton active />
  //         <Skeleton.Image
  //           rootClassName={styles.imageSkeleton}
  //           active
  //           style={{ width: '100%', height: 538 }}
  //         />
  //       </Flex>
  //     </div>
  //   );
  // }

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
          <img 
            src={img} 
            alt="University image" 
            loading="eager"
            decoding="async"
            onLoad={(e) => {
              // Fade in effect when image loads
              e.currentTarget.style.opacity = '1';
            }}
            style={{ 
              width: '100%', 
              height: 'auto',
              objectFit: 'cover',
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        ) : null}
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
                const profileImage = getLatestCreatedImg(mentor.profile.media);
                
                // Debug: Log the mentor data to see what we're working with
                console.log('Mentor data:', mentor);
                console.log('selectedUniversities:', mentor?.selectedUniversities);
                console.log('mentorProfile:', mentor?.mentorProfile);
                
                // Get university name - try multiple sources and ensure it's a string
                let universityName = '';
                if (mentor?.selectedUniversities?.[0]?.name) {
                  universityName = typeof mentor.selectedUniversities[0].name === 'string' 
                    ? mentor.selectedUniversities[0].name 
                    : getLocalizedText(mentor.selectedUniversities[0].name, i18n.language);
                } else if (mentor?.mentorProfile?.university) {
                  universityName = typeof mentor.mentorProfile.university === 'string'
                    ? mentor.mentorProfile.university
                    : getLocalizedText(mentor.mentorProfile.university, i18n.language);
                }
                
                // Get major - ensure it's a string
                let major = '';
                if (mentor?.mentorProfile?.major) {
                  major = typeof mentor.mentorProfile.major === 'string'
                    ? mentor.mentorProfile.major
                    : getLocalizedText(mentor.mentorProfile.major, i18n.language);
                }
                
                console.log('Final university name:', universityName);
                console.log('Final major:', major);
                
                return (
                  <MentorCard
                    key={mentor.id}
                    id={mentor.id}
                    name={mentor.profile.name}
                    imgSrc={profileImage}
                    rating={mentor.profile.overallRating}
                    sessionNumber={mentor?.numberOfSessions}
                    major={major}
                    university={universityName}
                    level={mentor.mentorProfile?.level}
                    availableSessions={mentor.sessionStats?.availableSessions || 0}
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
});

export default UniversityDetailSection;
