import { CustomCard } from 'src/components/cards';
import styles from './banner.module.scss';
import { CustomButton, CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BannerSection() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section>
      <div className="container">
        <CustomCard
          padding={40}
          borderRadius={24}
          className={styles.banner}
          bgColor={colors.colorSecondary}
        >
          <div>
            <CustomText
              fontSize={32}
              fontWeight={600}
              mb={10}
              maxWidth={333}
              color="white"
            >
              {t('home.bannerTitle')}
            </CustomText>
            <CustomText
              fontSize={16}
              fontWeight={400}
              mb={32}
              maxWidth={518}
              color="white"
            >
              {t('home.bannerSubtitle')}
            </CustomText>
            <CustomButton height={40} onClick={() => navigate('/universities')}>
              {t('home.bannerBtn')}
            </CustomButton>
          </div>
        </CustomCard>
      </div>
    </section>
  );
}
