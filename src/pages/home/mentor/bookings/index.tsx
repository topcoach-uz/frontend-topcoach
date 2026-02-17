import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useState } from 'react';
import { CustomCard } from 'src/components/cards';
import { CustomTabs, CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import styles from './bookings.module.scss';
import useBookings from './useBookings';
import { useTranslation } from 'react-i18next';
import AvailabilitySettings from './_components/AvailabilitySettings';
import type { TabsProps } from 'antd';

dayjs.extend(customParseFormat);

type ViewMode = 'availability' | 'sessions';

export default function BookingsSection() {
  const { activeTab, tabItems, handleTabsChange } = useBookings();
  const colors = useColors();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('availability');

  const tabItemsWithViewMode: TabsProps['items'] = [
    {
      key: 'availability',
      label: (
        <CustomText fontSize={14} color={viewMode === 'availability' ? colors.colorPrimary : undefined}>
          {t('homeMentor.availability', 'Availability')}
        </CustomText>
      ),
      children: <AvailabilitySettings />,
    },
    {
      key: 'sessions',
      label: (
        <CustomText fontSize={14} color={viewMode === 'sessions' ? colors.colorPrimary : undefined}>
          {t('homeMentor.upcomingBookings', 'Sessions')}
        </CustomText>
      ),
      children: (
        <>
          <div className={styles.sessions_header}>
            <h3 className={styles.sessions_title}>{t('homeMentor.sessionsSectionTitle', 'Your sessions')}</h3>
            <p className={styles.sessions_subtitle}>
              {t('homeMentor.upcomingBookingsDescription', 'See upcoming and past sessions booked through your availability')}
            </p>
          </div>
          <CustomTabs
            activeKey={activeTab}
            items={tabItems}
            onChange={handleTabsChange}
          />
        </>
      ),
    },
  ];

  return (
    <div className={'container ' + styles.bookings}>
      <CustomCard
        className={styles.card_wrapper}
        bgColor={colors.colorBgContainer}
        padding={24}
        borderRadius={24}
        mb={24}
        shadowed
      >
        <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase} lineHeight="38px" mb={15}>
          {t('homeMentor.availabilitySessionsTitle', 'Availability & Sessions')}
        </CustomText>
        <CustomTabs
          activeKey={viewMode}
          items={tabItemsWithViewMode}
          onChange={(key) => setViewMode(key as ViewMode)}
        />
      </CustomCard>
    </div>
  );
}
