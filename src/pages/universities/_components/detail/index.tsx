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
import { useGetMentorsQuery } from 'src/app/services/mentors';

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
  
  // Fetch full mentors data to get university and major (same as mentors page)
  const { data: allMentorsData } = useGetMentorsQuery();
  
  // Create a map of mentor IDs to full mentor data for quick lookup
  const mentorsMap = useMemo(() => {
    if (!allMentorsData) return new Map();
    const map = new Map();
    allMentorsData.forEach(mentor => {
      map.set(mentor.id, mentor);
    });
    return map;
  }, [allMentorsData]);

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
          {isLoading ? (
            <Flex justify="space-between" style={{ marginBottom: 16 }}>
              <Skeleton.Input active size="small" style={{ width: 200 }} />
              <Skeleton.Button active size="small" style={{ width: 32, height: 32 }} />
            </Flex>
          ) : (
            <Flex justify="space-between">
              <Breadcrumb items={breadcrumbItems} />
              <div className={styles.like} onClick={handleLike}>
                <LikeIcon stroke={'#F5222D'} fill={isLiked ? '#F5222D' : ''} />
              </div>
            </Flex>
          )}
          <RichTextRenderer
            id={id || ''}
            blocks={Array.isArray(firstTwoBlocks) ? firstTwoBlocks : []}
            ranking={rankings && rankings[0]?.rank}
            isUniversityDetail={true}
          />
        </>
      )}

      <div className={styles.img}>
        {isLoading ? (
          <div className={styles.imageSkeletonWrapper}>
            {/* Empty div to maintain the grey background area without image icon */}
          </div>
        ) : img ? (
          // No opacity trick: if the browser can't run onLoad (CORS, slow net,
          // stale cache hits) the image would stay invisible. Native <img> with
          // a decoded async handoff already renders progressively.
          <img
            src={img}
            alt="University image"
            loading="eager"
            decoding="async"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
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
              selectedBy?.map((mentor: any) => {
                // Get full mentor data from mentors list (same data source as mentors page)
                const fullMentorData = mentorsMap.get(mentor.id) || mentor;
                
                // EXACT COPY from mentors page - apply same transformation as mentors API
                const transformedMentor = {
                  ...fullMentorData,
                  // Pre-calculate displayUniversity exactly like mentors API transformResponse does
                  displayUniversity: fullMentorData?.mentorProfile?.university,
                };
                
                // EXACT COPY from mentors page - line by line
                // Use the same approach as mentor detail page - get latest image from full media array
                const profileImage = getLatestCreatedImg(transformedMentor.profile?.media || []);
                
                // Debug logging for missing images
                if (!profileImage && transformedMentor.profile?.media?.length > 0) {
                  console.log(`Mentor ${transformedMentor.profile.name} has media but no image:`, transformedMentor.profile.media);
                }
                
                // EXACT COPY from mentors page - same logic
                return (
                  <MentorCard
                    key={transformedMentor.id}
                    id={transformedMentor.id}
                    name={transformedMentor.profile.name}
                    imgSrc={profileImage || ''}
                    rating={transformedMentor.profile.overallRating}
                    sessionNumber={transformedMentor?.numberOfSessions}
                    major={transformedMentor?.mentorProfile?.major}
                    university={(transformedMentor as any).displayUniversity || transformedMentor?.mentorProfile?.university || ''}
                    level={transformedMentor.mentorProfile?.level}
                    mentorshipType={transformedMentor.mentorProfile?.mentorshipType}
                    showPrice={transformedMentor.mentorProfile?.showPrice}
                    email={transformedMentor.email}
                    availableSessions={transformedMentor.sessionStats?.availableSessions || 0}
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
        {isLoading ? (
          <div className={styles.majorTitle}>
            <Skeleton.Input active size="large" style={{ width: 100, height: 32 }} />
          </div>
        ) : (
          <div className={styles.majorTitle}>
            <h2>Majors</h2>
          </div>
        )}
        <UniversityMajorSection majors={majors} isLoading={isLoading} />
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
