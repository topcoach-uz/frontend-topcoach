import { useNavigate } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { DashboardOutlined, TeamOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './b2bDashboard.module.scss';

export default function B2BDashboardSection() {
  const colors = useColors();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <section className={styles.b2b_section}>
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
              onClick={() => handleNavigate('/b2b')}
            >
              <DashboardOutlined className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Dashboard
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                View overview and key metrics
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/b2b/students')}
            >
              <TeamOutlined className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Students
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                Manage and track student progress
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/b2b/analytics')}
            >
              <BarChartOutlined className={styles.card_icon} />
              <CustomText fontSize={18} fontWeight={600} mb={8} color={colors.colorTextBase}>
                Analytics
              </CustomText>
              <CustomText fontSize={14} color={colors.colorTextSecondary}>
                View detailed reports and insights
              </CustomText>
            </div>

            <div
              className={styles.dashboard_card}
              onClick={() => handleNavigate('/b2b/settings')}
            >
              <SettingOutlined className={styles.card_icon} />
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

