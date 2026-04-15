import { Card, Button, Progress, Tag, Space } from 'antd';
import { Calendar, User, Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from 'src/utils';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import dayjs from 'dayjs';
import styles from './WorkshopCard.module.scss';

interface WorkshopCardProps {
  id: string;
  title: string;
  summary: string;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null; // Using deadline instead of registrationDeadline
  maxParticipants?: number;
  currentParticipants?: number;
  img?: string;
  locations: any[];
}

export default function WorkshopCard({
  id,
  title,
  summary,
  startDate,
  endDate,
  deadline,
  maxParticipants,
  currentParticipants,
  img,
  locations,
}: WorkshopCardProps) {
  const { t } = useTranslation();
  
  const now = new Date();
  const hasDeadline = deadline && dayjs(deadline).isValid();
  const deadlineDate = hasDeadline ? new Date(deadline) : null;
  const isRegistrationOpen = (!hasDeadline || (deadlineDate && deadlineDate > now)) && (currentParticipants || 0) < (maxParticipants || 0);
  
  const participationPercentage = maxParticipants ? ((currentParticipants || 0) / maxParticipants) * 100 : 0;

  const handleRegister = () => {
    // TODO: Implement workshop registration
    console.log('Register for workshop:', id);
  };

  return (
    <Card
      className={styles.workshop_card}
      cover={
        img && (
          <div className={styles.card_image}>
            <img alt={title} src={img} />
          </div>
        )
      }
      actions={[
        <Button
          key="register"
          type="primary"
          disabled={!isRegistrationOpen}
          onClick={handleRegister}
          className={styles.register_button}
        >
          {isRegistrationOpen ? t('events.register') : t('events.registrationClosed')}
        </Button>,
      ]}
    >
      <div className={styles.card_content}>
        <h3 className={styles.workshop_title}>{title}</h3>
        
        {summary && (
          <p className={styles.workshop_summary}>{getTranslation(summary)}</p>
        )}

        <Space direction="vertical" size="small" className={styles.workshop_info}>
          <div className={styles.info_item}>
            <Calendar size={16} className={styles.info_icon} />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>

          <div className={styles.info_item}>
            <Clock size={16} className={styles.info_icon} />
            <span>
              {t('events.registrationDeadline')}: {hasDeadline ? dayjs(deadline).format('MMMM Do, YYYY [at] h:mm A') : 'TBA'}
            </span>
          </div>

          {locations && locations.length > 0 && (
            <div className={styles.info_item}>
              <MapPin size={16} className={styles.info_icon} />
              <span>{locations[0]?.address || locations[0]?.region || 'TBA'}</span>
            </div>
          )}

        </Space>

        <div className={styles.workshop_tags}>
          <Tag color="blue">{t('events.workshop')}</Tag>
          {isRegistrationOpen ? (
            <Tag color="green">{t('events.openForRegistration')}</Tag>
          ) : (
            <Tag color="red">{t('events.registrationClosed')}</Tag>
          )}
        </div>
      </div>
    </Card>
  );
}