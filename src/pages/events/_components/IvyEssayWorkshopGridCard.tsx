import { useNavigate } from 'react-router-dom';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from '../events.module.scss';
import {
  IVY_ESSAY_WORKSHOP_BANNER_IMG,
  IVY_ESSAY_WORKSHOP_TITLE,
  isIvyEssayWorkshopLive,
} from './ivyEssayWorkshop';

/**
 * Grid-sized card for the August 26 workshop with Kenza (Princeton),
 * shown once the session has passed. The featured announcement auto-hid
 * itself; this keeps the workshop in the past-events grid, opening its
 * own page at /events/ivy-essay-workshop like every other card.
 */
export default function IvyEssayWorkshopGridCard() {
  const navigate = useNavigate();
  const colors = useColors();

  // Only a past event belongs in the grid — while the session is still
  // upcoming, the featured announcement owns the events page instead.
  if (isIvyEssayWorkshopLive()) return null;

  return (
    <div
      className={styles.card}
      onClick={() => navigate('/events/ivy-essay-workshop')}
    >
      <div className={styles.img_mask}>
        {/* Portrait poster (1080x1350) in a landscape crop — bias the
            window toward the top so Kenza's head isn't clipped. */}
        <img
          src={IVY_ESSAY_WORKSHOP_BANNER_IMG}
          alt="How to Craft an Ivy League-Worthy Personal Essay — live workshop with Kenza, Princeton University"
          className={styles.event_image}
          loading="lazy"
          style={{ objectPosition: 'center 15%' }}
        />
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>
          Live workshop · August 26
        </CustomText>
        <CustomText
          color={colors.colorTextBase}
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          className={styles.event_name}
          as="p"
        >
          {IVY_ESSAY_WORKSHOP_TITLE}
        </CustomText>
      </div>
    </div>
  );
}
