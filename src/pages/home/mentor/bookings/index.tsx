import {
  Segmented,
} from 'antd';
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

dayjs.extend(customParseFormat);

type ViewMode = 'availability' | 'sessions';

export default function BookingsSection() {
  const {
    activeTab,
    tabItems,
    mainTab,
    mainTabOptions,
    handleTabsChange,
    setMainTab,
  } = useBookings();
  const colors = useColors();
  const { t } = useTranslation();

  // Default to availability tab - the new primary flow
  const [viewMode, setViewMode] = useState<ViewMode>('availability');

  return (
    <div className={'container ' + styles.bookings}>
      <CustomCard
        className={styles.card_wrapper}
        padding={24}
        borderRadius={24}
        shadowed={false}
      >
        <div className={styles.viewModeSwitch}>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { label: t('homeMentor.availability', 'Availability'), value: 'availability' },
              { label: t('homeMentor.upcomingBookings', 'Sessions'), value: 'sessions' },
            ]}
          />
        </div>
        {viewMode === 'availability' ? (
          <AvailabilitySettings />
        ) : (
          <>
            <CustomText
              fontSize={32}
              fontWeight={600}
              color={colors.colorTextBase}
              lineHeight="38px"
              mb={4}
            >
              {t('homeMentor.upcomingBookings', 'Sessions')}
            </CustomText>
            <CustomText
              fontSize={16}
              fontWeight={400}
              mb={24}
              lineHeight="22px"
              color={colors.colorTextSecondary}
            >
              {t('homeMentor.upcomingBookingsDescription', 'See upcoming and past sessions booked through your availability.')}
            </CustomText>
            <div className={styles.main_tab_wrapper}>
              <Segmented
                value={mainTab}
                onChange={setMainTab}
                rootClassName={styles.main_tab}
                options={mainTabOptions}
              />
            </div>
            <CustomTabs
              activeKey={activeTab}
              items={tabItems}
              onChange={handleTabsChange}
            />
          </>
        )}
      </CustomCard>
    </div>
  );
}
