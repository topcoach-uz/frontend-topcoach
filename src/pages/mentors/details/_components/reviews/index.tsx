import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_reviews.module.scss';
import { CustomCard } from 'src/components/cards';
import { createArray } from 'src/utils';
import { StarIcon } from 'src/components/icons';
import { Flex } from 'antd';
import { ReviewsSchema } from 'src/app/api/Api';

interface ReviewProps {
  data?: any;
}

export default function MentorDetailsReviews({ data }: ReviewProps) {
  const colors = useColors();

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
      <ul className={styles.review_list}>
        {data.map(({ id, rating, summary }: ReviewsSchema) => (
          <li key={id}>
            <CustomCard
              className={styles.card_wrapper}
              bordered
              shadowed={false}
            >
              <div>
                <CustomText
                  color={colors.colorText}
                  fontSize={themeFontSize.fontSizeTitle9}
                  fontWeight={themeFontWeight.fontWeightSemibold}
                  mb={4}
                >
                  Jhon Do
                </CustomText>
                <Flex gap={8}>
                  {createArray(1, 5).map((num) => (
                    <StarIcon
                      width={16}
                      height={16}
                      key={num}
                      color={num <= rating ? '#FADB14' : '#0000000F'}
                    />
                  ))}
                </Flex>
                <CustomText
                  className={styles.review_description}
                  color={colors.colorText}
                  fontSize={themeFontSize.fontSizeTitle9}
                  mt={4}
                  mb={4}
                  lineHeight={1.5}
                >
                  {summary}
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
