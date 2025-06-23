import { Breadcrumb } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import MyCollapse from 'src/components/common/MyCollapse';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useFaq from '../landing/_components/FAQ/useFaq';
import styles from './faq.module.scss';

export default function FaqPage() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { faqItems } = useFaq();

  return (
    <div className={styles.faq}>
      <Breadcrumb rootClassName={styles.breadcrumb} items={breadcrumbItems} />
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
      >
        FAQ
      </CustomText>
      <div className={styles.content}>
        {faqItems?.map((item, index) => (
          <MyCollapse
            key={item.id}
            question={item.label}
            answer={item.children}
            questionNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

const breadcrumbItems = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'FAQ',
  },
];
