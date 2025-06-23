import { CustomText } from 'src/components/common';
import FooterParts from './components';
import styles from './footer.module.scss';
import { Link } from 'react-router-dom';
import useFooter from './useFooter';
import { useTranslation } from 'react-i18next';
import { Logo } from 'src/components/logos';
import { Flex } from 'antd';

export default function Footer() {
  const { footerData } = useFooter();
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={'container ' + styles.container}>
        <div>
          <div className={styles.logo}>
            <Link to="/">
              <Logo color="white" />
            </Link>
            <Flex vertical gap={10}>
              <CustomText
                style={{ color: 'white' }}
                fontSize={16}
                fontWeight={500}
              >
                {t('footer.XCDM')}
              </CustomText>
              <CustomText
                style={{ color: 'white' }}
                fontSize={16}
                fontWeight={500}
                className={styles.copyright}
              >
                {t('footer.allRightsReserved')}
              </CustomText>
            </Flex>
          </div>
        </div>
        <div className={styles.links}>
          {footerData.map((item, index) => (
            <FooterParts key={index} {...item} />
          ))}
        </div>
      </div>
    </footer>
  );
}
