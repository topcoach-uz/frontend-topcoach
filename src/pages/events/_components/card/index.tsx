import { CustomText } from 'src/components/common';
import { Tag } from 'antd';
import styles from '../../events.module.scss';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  id?: string;
  name?: string;
  date?: string;
  img?: string;
  isUpcoming?: boolean;
}

export default function EventCard({ date, img, name, id, isUpcoming }: Props) {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.card} onClick={() => navigate(`/events/${id}`)}>
      <div className={styles.img_mask}>
        <img src={img} alt={name} className={styles.event_image} loading="lazy" />
        {isUpcoming && (
          <Tag color="blue" className={styles.upcoming_badge}>
            {t('events.upcoming')}
          </Tag>
        )}
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>
          {date}
        </CustomText>
        <CustomText
          color={colors.colorTextBase}
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          className={styles.event_name}
          as="p"
        >
          {name}
        </CustomText>
        {/* {price === 0 ? (
          <CustomText lineHeight={'24px'} color={colors.green5}>
            Free
          </CustomText>
        ) : (
          `$${price}`
        )} */}
      </div>
    </div>
  );
}
