import { CustomText } from 'src/components/common';
import styles from './footerPart.module.scss';
import { Link } from 'react-router-dom';
interface FooterPartsProps {
  title?: string;
  links?: string[];
  descriptions?: string[];
  icons?: JSX.Element[];
}

export default function FooterParts({
  title,
  descriptions,
  icons,
  links,
}: FooterPartsProps) {
  return (
    <div className={styles.footerPart}>
      <CustomText
        fontSize={24}
        fontWeight={600}
        mb={4}
        style={{ color: '#FFF' }}
      >
        {title}
      </CustomText>
      <div>
        {descriptions &&
          descriptions.map((item, index) => (
            <CustomText fontSize={16} fontWeight={500} mt={12} key={index}>
              <Link
                // target="_blank"
                className={styles.link}
                to={links?.[index] ?? '#'}
              >
                {icons?.[index]}
                {item}
              </Link>
            </CustomText>
          ))}
      </div>
    </div>
  );
}
