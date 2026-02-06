import { ArrowTopRight } from 'src/components/icons';
import styles from './right_arrow.module.scss';
import useColors from 'src/hooks/useColors';
import { useTranslation } from 'react-i18next';

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

export default function CustomRightArrow({ className, ...rest }: Props) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <button
      style={{ color: colors.colorText }}
      className={`${styles.button} ${className || ''}`}
      {...rest}
    >
      {t('landing.reviews.readMore')}
      <ArrowTopRight color={colors.colorTextBase} width={20} height={20} />
    </button>
  );
}
