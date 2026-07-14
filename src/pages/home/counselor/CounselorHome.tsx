/**
 * Home page for school counselors.
 * Shows only: Admin Dashboard Quick Access (School Counselor Dashboard) + Sessions + Events.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { LayoutDashboard } from 'lucide-react';
import BookingsSection from '../mentor/bookings';
import EventsSection from '../_components/events';

export default function CounselorHome() {
  const colors = useColors();
  const navigate = useNavigate();
  const sectionSpacing = 24;

  return (
    <main>
      <div className="container" style={{ paddingTop: 24, marginBottom: sectionSpacing }}>
        <CustomCard
          bgColor={colors.colorBgContainer}
          shadowed={false}
          borderRadius={24}
          padding={24}
          style={{ width: '100%', maxWidth: '100%', boxShadow: 'none', border: 'none', borderWidth: 0 }}
        >
          <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase} lineHeight="38px" mb={4}>
            Admin Dashboard
          </CustomText>
          <CustomText fontSize={16} fontWeight={400} lineHeight="22px" color={colors.colorTextSecondary} mb={24}>
            Quick Access
          </CustomText>
          <CustomButton
            size="small"
            height={40}
            onClick={() => navigate('/counselor-console')}
            icon={<LayoutDashboard size={16} />}
            style={{
              backgroundColor: 'transparent',
              borderColor: colors.colorPrimary,
              color: colors.colorPrimary,
              height: '40px',
              minHeight: '40px',
            }}
          >
            School Counselor Dashboard
          </CustomButton>
        </CustomCard>
      </div>
      <BookingsSection />
      <EventsSection />
    </main>
  );
}
