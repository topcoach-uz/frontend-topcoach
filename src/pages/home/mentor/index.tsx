import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import ProfileStatusSection from './_components/profile_status';
import AdmissionsProgramProgressCard from '../../student-hub/components/AdmissionsProgramProgressCard';
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

  const sectionSpacing = 24;

  return (
    <main>
      {/* 0. Admissions Program Progress — when mentor is enrolled in a course */}
      <div className="container" style={{ paddingTop: 24 }}>
        <AdmissionsProgramProgressCard />
      </div>
      {/* 1. Admin Dashboard – same card style as Sessions / Events, consistent spacing */}
      {isSuperAdmin && (
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
                  minHeight: '40px',
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
                  minHeight: '40px',
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
                  minHeight: '40px',
                }}
              >
                Course Content Management
              </CustomButton>
            </Space>
          </CustomCard>
        </div>
      )}
      {/* 2. Complete your profile – above Sessions when not 100%; hidden when complete */}
      <ProfileStatusSection />
      {/* 3. Sessions (Bookings) – same spacing */}
      <BookingsSection />
      {/* 4. Events – same spacing */}
      <EventsSection />
    </main>
  );
}