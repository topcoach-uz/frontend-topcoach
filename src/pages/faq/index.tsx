import { Breadcrumb } from 'antd';
import MyCollapse from 'src/components/common/MyCollapse';
import useFaq from '../landing/_components/FAQ/useFaq';
import styles from './faq.module.scss';

export default function FaqPage() {
  const { faqItems } = useFaq();

  return (
    <section className={styles.shell}>
      <div className={styles.faq}>
        <Breadcrumb rootClassName={styles.breadcrumb} items={breadcrumbItems} />
        <div className={styles.title}>
          <h1>Frequently Asked Questions</h1>
          <p>Answers to the things students ask us most often.</p>
        </div>
        <div className={styles.content}>
          {faqItems?.map((item, index) => (
            <MyCollapse
              key={item.key}
              question={item.label}
              answer={item.children}
              questionNumber={index + 1}
            />
          ))}
        </div>
      </div>
    </section>
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
