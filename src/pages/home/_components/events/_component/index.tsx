import { useNavigate } from 'react-router-dom';
import { ApplicationStatusEnum } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import styles from './eventCard.module.scss';

interface EventCardCompProps {
  img: string;
  title: string;
  date: string;
  statusText: string;
  status: ApplicationStatusEnum;
}

export default function EventCardComp({
  img,
  title,
  date,
  status,
  statusText,
}: EventCardCompProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const navigate = useNavigate();
  return (
    <CustomCard
      padding={0}
      bordered
      borderRadius={12}
      className={styles.event}
      shadowed={false}
      onClick={() => navigate('/events/')}
    >
      <div className={styles.img}>
        <img src={img} alt="Img error" />
      </div>
      <div className={styles.info}>
        <div>
          <CustomText fontSize={20} fontWeight={600} color={colors.colorText}>
            {title}
          </CustomText>
          <CustomText
            fontSize={14}
            color={colors.colorTextDescription}
            mt={4}
            mb={8}
          >
            {date}
          </CustomText>
        </div>
        <CustomText
          fontSize={16}
          fontWeight={500}
          className={
            status === ApplicationStatusEnum.Pending
              ? styles.reviewing
              : status === ApplicationStatusEnum.Successful
                ? styles.accepted
                : styles.rejected
          }
        >
          {statusText}
        </CustomText>
      </div>
    </CustomCard>
  );
}
