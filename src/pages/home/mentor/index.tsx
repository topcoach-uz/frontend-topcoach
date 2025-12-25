import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import ProfileStatusSection from './_components/profile_status';
import BookingsSection from './bookings';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { DashboardOutlined, BookOutlined, SettingOutlined } from '@ant-design/icons';
import { Space } from 'antd';

export default function MentorHome() {
  const colors = useColors();
  const navigate = useNavigate();
  
  // Check if user is SuperAdmin
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || user;
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';

  return (
    <main>
      {/* SuperAdmin Quick Access Links - Show at top before Complete your profile section */}
      {isSuperAdmin && (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '24px' }}>
          <CustomCard
            bgColor={colors.colorBgContainer}
            mb={0}
            shadowed
            borderRadius={24}
            padding={24}
          >
            <CustomText 
              fontSize={20}
              fontWeight={600}
              mb={16}
              color={colors.colorTextBase}
            >
              Admin Dashboard
            </CustomText>
            <CustomText 
              fontSize={14} 
              fontWeight={500}
              color={colors.colorTextSecondary}
              style={{ marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Quick Access
            </CustomText>
            <Space size="small" wrap>
              <CustomButton
                size="small"
                height={40}
                onClick={() => navigate('/school-counselor')}
                icon={<DashboardOutlined />}
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: colors.colorPrimary,
                  color: colors.colorPrimary,
                  height: '40px',
                  minHeight: '40px'
                }}
              >
                School Counselor Dashboard
              </CustomButton>
              <CustomButton
                size="small"
                height={40}
                onClick={() => navigate('/topcoach-management')}
                icon={<SettingOutlined />}
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: colors.colorPrimary,
                  color: colors.colorPrimary,
                  height: '40px',
                  minHeight: '40px'
                }}
              >
                TopCoach Management
              </CustomButton>
              <CustomButton
                size="small"
                height={40}
                onClick={() => navigate('/course-admin/courses/modules')}
                icon={<BookOutlined />}
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: colors.colorPrimary,
                  color: colors.colorPrimary,
                  height: '40px',
                  minHeight: '40px'
                }}
              >
                Course Content Management
              </CustomButton>
            </Space>
          </CustomCard>
        </div>
      )}
      <ProfileStatusSection />
      <BookingsSection />
      {/* <FavoriteUniversitiesSection /> */}
      <EventsSection />
      {/* Temporarily hidden - rethinking subscription plans */}
      {/* <SubscriptionPlans /> */}
    </main>
  );
}