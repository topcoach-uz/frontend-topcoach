import { useNavigate } from 'react-router-dom';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import styles from '../events.module.scss';
import {
  MASTERCLASS_BANNER_IMG,
  MASTERCLASS_TITLE,
  isEssayMasterclassLive,
} from './essayMasterclass';

/**
 * Grid-sized card for the essay masterclass with Shakhnoza Salimjonova,
 * shown once the August 16 session has passed. The featured announcement
 * auto-hid itself; this keeps the event in the past-events grid, opening
 * its own page at /events/essay-masterclass like every other card.
 */
export default function EssayMasterclassGridCard() {
  const navigate = useNavigate();
  const colors = useColors();

  // Only a past event belongs in the grid — while the session is still
  // upcoming, the featured announcement owns the events page instead.
  if (isEssayMasterclassLive()) return null;

  return (
    <div
      className={styles.card}
      onClick={() => navigate('/events/essay-masterclass')}
    >
      <div className={styles.img_mask}>
        <img
          src={MASTERCLASS_BANNER_IMG}
          alt="How to write the essay that gets in — live masterclass with Shakhnoza Salimjonova"
          className={styles.event_image}
          loading="lazy"
        />
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>
          Live masterclass · August 16
        </CustomText>
        <CustomText
          color={colors.colorTextBase}
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          className={styles.event_name}
          as="p"
        >
          {MASTERCLASS_TITLE}
        </CustomText>
      </div>
    </div>
  );
}
