import { Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from '../events.module.scss';

/**
 * Grid-sized card for the Personal Statement Workshop replay (Nazira
 * Davroni). The workshop used to own the featured slot at the top of
 * the events page; now it sits in the regular grid and opens its own
 * page at /events/personal-statement-workshop, like every other card.
 */
export default function PersonalStatementWorkshopGridCard() {
  const navigate = useNavigate();
  const colors = useColors();

  return (
    <div
      className={styles.card}
      onClick={() => navigate('/events/personal-statement-workshop')}
    >
      <div className={styles.img_mask}>
        {/* Portrait poster (1080x1350) in a landscape crop — bias the
            window toward the top so Nazira's head isn't clipped. */}
        <img
          src="/img/workshop2.jpeg"
          alt="Personal Statement Workshop with Nazira Davroni"
          className={styles.event_image}
          loading="lazy"
          style={{ objectPosition: 'center 15%' }}
        />
        <Tag className={styles.upcoming_badge}>Recording</Tag>
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>
          Workshop replay · Watch anytime
        </CustomText>
        <CustomText
          color={colors.colorTextBase}
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          className={styles.event_name}
          as="p"
        >
          How to Write a Strong Personal Statement
        </CustomText>
      </div>
    </div>
  );
}
