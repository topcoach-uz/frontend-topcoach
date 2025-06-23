import { Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomButton, CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useScreenSize } from 'src/hooks/useScreenSize';
import CustomExpandIcon from './_components/expand';
import styles from './faq.module.scss';
import useFaq from './useFaq';
import { useNavigate } from 'react-router-dom';

export default function FaqSection() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const { faqItems } = useFaq();
  const navigate = useNavigate();

  return (
    <section>
      <div className={'container ' + styles.faq}>
        <CustomText
          fontSize={screenSize > 768 ? 36 : themeFontSize.fontSizeTitle4}
          fontWeight={600}
          lineHeight={1.4}
          color={colors.colorTextBase}
          mb={screenSize > 768 ? 24 : 20}
          className={styles.title}
        >
          {t('landing.faqExpanded')}
        </CustomText>
        <CustomText
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle5
              : themeFontSize.fontSizeTitle8
          }
          lineHeight={1.4}
          mb={96}
          color={colors.colorTextDescription}
        >
          {t('landing.faqText')}
        </CustomText>
        <Collapse
          expandIconPosition="end"
          expandIcon={({ isActive }) => (
            <CustomExpandIcon isActive={isActive} />
          )}
          items={faqItems?.map((item) => {
            item.headerClass = styles.panel;
            item.className = styles.collapseItem;
            return item;
          })}
          bordered={false}
        />
        <div className={styles.got_question_container}>
          <div className={styles.avatar_wrapper}>
            <img src={avatars[0]} alt="" />
            <img src={avatars[1]} alt="" />
            <img src={avatars[2]} alt="" />
          </div>
          <CustomText
            fontWeight={themeFontWeight.fontWeightSemibold}
            fontSize={themeFontSize.fontSizeTitle5}
            color={colors.colorTextBase}
            mb={8}
            lineHeight={'30px'}
          >
            {t('landing.stillHaveQuestions')}
          </CustomText>
          <CustomText
            fontWeight={themeFontWeight.fontWeightSemibold}
            fontSize={themeFontSize.fontSizeTitle6}
            color={colors.colorTextSecondary}
            mb={32}
            lineHeight={'28px'}
          >
            {t('landing.contactUs')}
          </CustomText>
          <CustomButton type="primary" onClick={() => navigate('/contact')}>
            {t('landing.contactUsButton')}
          </CustomButton>
        </div>
      </div>
    </section>
  );
}

const avatars = ['/img/avatar_2.jpg', '/img/avatar_1.JPG', '/img/avatar_3.jpg'];
