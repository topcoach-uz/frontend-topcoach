import { ConfigProvider } from 'antd';
import styles from './mentors.module.scss';
import { useTypedSelector } from 'src/app/store';
import { RightArrowSvg } from 'src/assets/svg';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import { themeColors, themeFontSize } from 'src/constants/theme';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function MentorsSectionLanding() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ConfigProvider
      theme={{
        token: { ...themeColors.light },
        components: {
          Button: {
            defaultColor: themeColors.light.colorText,
          },
        },
      }}
    >
      <section>
        <div className={'container ' + styles.container}>
          <CustomCard
            bgColor={themeColors.light.colorSecondaryActive}
            mb={80}
            padding={0}
            className={styles.mentors}
          >
            <div className={styles.info}>
              <CustomText
                fontSize={
                  screenSize > 768
                    ? themeFontSize.fontSizeTitle3
                    : themeFontSize.fontSizeTitle5
                }
                lineHeight={1.4}
                fontWeight={600}
                color={colors.colorTextLight}
              >
                {t('landing.becomeMentorTitle')}
              </CustomText>
              <CustomText
                fontSize={
                  screenSize > 768
                    ? themeFontSize.fontSizeTitle5
                    : themeFontSize.fontSizeTitle8
                }
                lineHeight={1.4}
                color={colors.colorTextLight}
                mt={20}
                mb={screenSize > 768 ? 48 : 24}
              >
                {t('landing.becomeMentorSubtitle')}
              </CustomText>
              <CustomButton
                height={46}
                width={screenSize > 768 ? undefined : '100%'}
                onClick={() => navigate('/auth/signup/mentor')}
              >
                {t('landing.becomeMentorButton')} <RightArrowSvg />
              </CustomButton>
            </div>
            <div className={styles.img}>
              <img src={'/img/mentor.png'} alt="Img error" />
            </div>
          </CustomCard>
        </div>
      </section>
    </ConfigProvider>
  );
}
