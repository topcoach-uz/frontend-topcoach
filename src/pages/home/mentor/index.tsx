import ProfileStatusSection from './_components/profile_status';
import AdmissionsProgramProgressCard from '../../student-hub/components/AdmissionsProgramProgressCard';
import BookingsSection from './bookings';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import { DashboardOutlined, BookOutlined, SettingOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { useTranslation } from 'react-i18next';

export default function MentorHome() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: orgsData } = useGetMyOrganizationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || user;
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';
  const isCounselor = Array.isArray(orgsData) && orgsData.length > 0;

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
              {t('studentHub.dashboard.adminDashboard', 'Admin Dashboard')}
            </CustomText>
            <CustomText fontSize={16} fontWeight={400} lineHeight="22px" color={colors.colorTextSecondary} mb={24}>
              {t('studentHub.dashboard.quickAccess', 'QUICK ACCESS')}
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
                {t('studentHub.dashboard.schoolCounselorDashboard', 'School Counselor Dashboard')}
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
                {t('studentHub.dashboard.topcoachManagement', 'TopCoach Management')}
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
                {t('studentHub.dashboard.courseContentManagement', 'Course Content Management')}
              </CustomButton>
            </Space>
          </CustomCard>
        </div>
      )}
      {/* School Counselor card – for mentors with counselor access (non–SuperAdmin) */}
      {isCounselor && !isSuperAdmin && (
        <div className="container" style={{ paddingTop: 24, marginBottom: sectionSpacing }}>
          <CustomCard
            bgColor={colors.colorBgContainer}
            shadowed={false}
            borderRadius={24}
            padding={24}
            style={{ width: '100%', maxWidth: '100%', boxShadow: 'none', border: 'none', borderWidth: 0 }}
          >
            <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase} lineHeight="38px" mb={4}>
              {t('homeMentor.schoolCounselorCardTitle', 'School Counselor')}
            </CustomText>
            <CustomText fontSize={16} fontWeight={400} lineHeight="22px" color={colors.colorTextSecondary} mb={24}>
              {t('homeMentor.schoolCounselorQuickAccess', 'Quick Access')}
            </CustomText>
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
              {t('homeMentor.schoolCounselorDashboardButton', 'School Counselor Dashboard')}
            </CustomButton>
          </CustomCard>
        </div>
      )}
      {/* 2. Complete your profile – above Sessions when not 100%; hidden when complete */}
      <ProfileStatusSection />
      {/* 3. Sessions (Bookings) – same spacing */}
      <BookingsSection />
    </main>
  );
}