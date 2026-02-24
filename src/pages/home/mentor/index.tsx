import ProfileStatusSection from './_components/profile_status';
import AdmissionsProgramProgressCard from '../../student-hub/components/AdmissionsProgramProgressCard';
import BookingsSection from './bookings';
import styles from './bookings/bookings.module.scss';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import { useGetMentorRosterQuery } from 'src/app/services/fullSupportApi';
import { DashboardOutlined, BookOutlined, SettingOutlined, TeamOutlined, AuditOutlined } from '@ant-design/icons';
import { Space, Row, Col } from 'antd';
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
  const { data: mentorRosterData } = useGetMentorRosterQuery(undefined, { skip: !isAuthenticated });
  const hasFullSupportAssignments = (mentorRosterData?.data?.length ?? 0) > 0;

  const sectionSpacing = 24;

  return (
    <main>
      {/* 0. Admissions Program Progress — when mentor is enrolled in a course */}
      <div className="container" style={{ paddingTop: 24 }}>
        <AdmissionsProgramProgressCard />
      </div>
      {/* Profile status (under review + complete your profile) — before Availability & Sessions when not 100% complete */}
      <ProfileStatusSection />
      {/* SuperAdmin: left = Admin + Full Support stacked, right = Availability. Regular mentor: one container, Full Support + Availability full width (2 cards / 1 card layout). */}
      <div className="container" style={{ paddingTop: 12, marginBottom: sectionSpacing }}>
        {isSuperAdmin ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <BookingsSection />
            </Col>
            <Col xs={24} lg={12}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <CustomCard
                  bgColor={colors.colorBgContainer}
                  shadowed={false}
                  borderRadius={24}
                  padding={24}
                  style={{ width: '100%', boxShadow: 'none', border: 'none', borderWidth: 0 }}
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
                    <CustomButton
                      size="small"
                      height={40}
                      onClick={() => navigate('/full-support/admin')}
                      icon={<AuditOutlined />}
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: colors.colorPrimary,
                        color: colors.colorPrimary,
                        height: '40px',
                        minHeight: '40px',
                      }}
                    >
                      {t('fullSupport.adminDashboard', 'Full Support Admin')}
                    </CustomButton>
                  </Space>
                </CustomCard>
                {hasFullSupportAssignments && (
                  <CustomCard
                    className={styles.card_wrapper}
                    bgColor={colors.colorBgContainer}
                    shadowed
                    borderRadius={24}
                    padding={24}
                    mb={24}
                    style={{ width: '100%' }}
                  >
                    <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase} lineHeight="38px" mb={4}>
                      {t('fullSupport.mentorManagement', 'Full Support Mentorship program')}
                    </CustomText>
                    <CustomText fontSize={16} fontWeight={400} lineHeight="22px" color={colors.colorTextSecondary} mb={24}>
                      {t('fullSupport.mentorManagementDesc', 'Mentor Management — Monitor your students, log sessions, assign tasks, and track applications.')}
                    </CustomText>
                    <CustomButton
                      size="small"
                      height={40}
                      onClick={() => navigate('/full-support/mentor')}
                      icon={<TeamOutlined />}
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: colors.colorPrimary,
                        color: colors.colorPrimary,
                        height: '40px',
                        minHeight: '40px',
                      }}
                    >
                      {t('fullSupport.openMentorDashboard', 'Open Mentor Dashboard')}
                    </CustomButton>
                  </CustomCard>
                )}
              </Space>
            </Col>
          </Row>
        ) : (
          <>
            {hasFullSupportAssignments && (
              <CustomCard
                className={styles.card_wrapper}
                bgColor={colors.colorBgContainer}
                shadowed={false}
                padding={24}
                borderRadius={24}
                mb={24}
                style={{ width: '100%', maxWidth: '100%', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
              >
                <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase} lineHeight="38px" mb={4}>
                  {t('fullSupport.mentorManagement', 'Full Support Mentorship program')}
                </CustomText>
                <CustomText fontSize={16} fontWeight={400} lineHeight="22px" color={colors.colorTextSecondary} mb={24}>
                  {t('fullSupport.mentorManagementDesc', 'Mentor Management — Monitor your students, log sessions, assign tasks, and track applications.')}
                </CustomText>
                <CustomButton
                  size="small"
                  height={40}
                  onClick={() => navigate('/full-support/mentor')}
                  icon={<TeamOutlined />}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.colorPrimary,
                    color: colors.colorPrimary,
                    height: '40px',
                    minHeight: '40px',
                  }}
                >
                  {t('fullSupport.openMentorDashboard', 'Open Mentor Dashboard')}
                </CustomButton>
              </CustomCard>
            )}
            <BookingsSection skipContainer />
          </>
        )}
      </div>
      {/* School Counselor card — for mentors with counselor access (non-SuperAdmin) */}
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
    </main>
  );
}