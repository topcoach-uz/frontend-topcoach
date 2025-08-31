import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_reviews.module.scss';
import { CustomCard } from 'src/components/cards';
import { createArray } from 'src/utils';
import { StarIcon } from 'src/components/icons';
import { Flex } from 'antd';
import { ReviewsSchema } from 'src/app/api/Api';
import dayjs from 'dayjs';

interface ReviewProps {
  data?: ReviewsSchema[];
}

export default function MentorDetailsReviews({ data = [] }: ReviewProps) {
  const colors = useColors();

  // Calculate average rating and total reviews
  const totalReviews = data.length;
  const averageRating = totalReviews > 0 
    ? (data.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
    : 0;

  // Rating distribution
  const ratingDistribution = {
    5: data.filter(review => review.rating === 5).length,
    4: data.filter(review => review.rating === 4).length,
    3: data.filter(review => review.rating === 3).length,
    2: data.filter(review => review.rating === 2).length,
    1: data.filter(review => review.rating === 1).length,
  };

  if (totalReviews === 0) {
    return (
      <div>
        <CustomText
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle5}
          color={colors.colorText}
          mt={32}
          mb={16}
        >
          Reviews
        </CustomText>
        <CustomCard
          className={styles.no_reviews_card}
          bordered
          shadowed={false}
        >
          <CustomText
            color={colors.colorTextSecondary}
            fontSize={themeFontSize.fontSizeTitle9}
          >
            No reviews yet
          </CustomText>
        </CustomCard>
      </div>
    );
  }

  return (
    <div>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        style={{ marginTop: 32, marginBottom: 16 }}
      >
        Reviews
      </CustomText>

      {/* Summary Statistics */}
      <CustomCard
        className={styles.summary_card}
        bordered
        shadowed={false}
        style={{ marginBottom: 24 }}
      >
        <div className={styles.summary_content}>
          <div className={styles.summary_left}>
            <div className={styles.total_reviews}>
              <CustomText
                fontSize={24}
                fontWeight={themeFontWeight.fontWeightBold}
                color={colors.colorText}
              >
                {totalReviews}
              </CustomText>
              <CustomText
                fontSize={14}
                color={colors.colorTextSecondary}
              >
                Total Reviews
              </CustomText>
            </div>
            <div className={styles.average_rating}>
              <CustomText
                fontSize={24}
                fontWeight={themeFontWeight.fontWeightBold}
                color={colors.colorText}
              >
                {averageRating}
              </CustomText>
              <Flex gap={4} style={{ marginBottom: 4 }}>
                {createArray(1, 5).map((num) => (
                  <StarIcon
                    width={16}
                    height={16}
                    key={num}
                    color={num <= Number(averageRating) ? '#FADB14' : '#0000000F'}
                  />
                ))}
              </Flex>
              <CustomText
                fontSize={14}
                color={colors.colorTextSecondary}
              >
                Average Rating
              </CustomText>
            </div>
          </div>
          <div className={styles.rating_distribution}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className={styles.rating_bar}>
                <CustomText fontSize={12} color={colors.colorTextSecondary}>
                  {rating} ★
                </CustomText>
                <div className={styles.bar_container}>
                  <div 
                    className={styles.bar_fill}
                    style={{ 
                      width: `${totalReviews > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100 : 0}%`,
                      backgroundColor: '#FADB14'
                    }}
                  />
                </div>
                <CustomText fontSize={12} color={colors.colorTextSecondary}>
                  {ratingDistribution[rating as keyof typeof ratingDistribution]}
                </CustomText>
              </div>
            ))}
          </div>
        </div>
      </CustomCard>

      {/* Individual Reviews */}
      <ul className={styles.review_list}>
        {data.map((review) => (
          <li key={review.id}>
            <CustomCard
              className={styles.card_wrapper}
              bordered
              shadowed={false}
            >
              <div>
                <div className={styles.review_header}>
                  <div>
                    <CustomText
                      color={colors.colorText}
                      fontSize={themeFontSize.fontSizeTitle9}
                      fontWeight={themeFontWeight.fontWeightSemibold}
                      style={{ marginBottom: 4 }}
                    >
                      {review.reviewer?.profile?.name || 'Anonymous'}
                    </CustomText>
                    <CustomText
                      color={colors.colorTextSecondary}
                      fontSize={12}
                      style={{ marginBottom: 4 }}
                    >
                      {dayjs(review.createdAt).format('MMM DD, YYYY')}
                    </CustomText>
                  </div>
                  <Flex gap={4}>
                    {createArray(1, 5).map((num) => (
                      <StarIcon
                        width={16}
                        height={16}
                        key={num}
                        color={num <= review.rating ? '#FADB14' : '#0000000F'}
                      />
                    ))}
                  </Flex>
                </div>
                <CustomText
                  className={styles.review_description}
                  color={colors.colorText}
                  fontSize={themeFontSize.fontSizeTitle9}
                  style={{ marginTop: 8, lineHeight: 1.5 }}
                >
                  {review.summary}
                </CustomText>
              </div>
            </CustomCard>
          </li>
        ))}
      </ul>
    </div>
  );
}

const reviews = [
  {
    name: 'Abdurahmon Jalolov',
    rating: 3,
    review:
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.',
    avatar: '/img/avatar-1.png',
  },
  {
    name: 'Isabella Martinez',
    rating: 4,
    review:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem. At vero eos et accusam et justo duo dolores et ea rebum accusantium doloremque laudantium, totam rem aperiam.',
    avatar: '/img/avatar-2.png',
  },
  {
    name: 'John Smith',
    rating: 4,
    review:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. At vero eos et accusam et justo duo dolores et ea rebum.',
    avatar: '/img/avatar.png',
  },
];
