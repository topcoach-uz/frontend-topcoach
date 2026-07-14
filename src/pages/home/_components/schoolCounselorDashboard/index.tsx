import { useNavigate } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { LayoutDashboard, Users, BarChart2, Settings } from 'lucide-react';
import styles from './schoolCounselorDashboard.module.scss';

export default function SchoolCounselorDashboardSection() {
  const colors = useColors();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <section className={styles.school_counselor_section}>
      <div className={'container ' + styles.container}>
        <CustomCard
          bgColor={colors.colorBgContainer}
          mb={40}
          shadowed
          borderRadius={24}
          padding={24}
        >
          <CustomText
            fontSize={32}
            fontWeight={600}
            mb={4}
            color={colors.colorTextBase}
          >
            Organization Dashboard
          </CustomText>
          <CustomText
            fontSize={16}
            fontWeight={400}
            mb={32}
            color={colors.colorTextSecondary}
          >
            Manage and track your organization's students and their progress
          </CustomText>

          <div className={styles.dashboard_grid}>
            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/counselor-console')}
            >
              <LayoutDashboard size={16} className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Dashboard
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                View overview and key metrics
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/counselor-console/students')}
            >
              <Users size={16} className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Students
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                Manage and track student progress
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/counselor-console/analytics')}
            >
              <BarChart2 size={16} className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Analytics
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                View detailed reports and insights
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/counselor-console/settings')}
            >
              <Settings size={16} className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Settings
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                Manage organization settings
              </CustomText>
            </div>
          </div>
        </CustomCard>
      </div>
    </section>
  );
}

