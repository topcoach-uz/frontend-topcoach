import { ArrowTopRight } from 'src/components/icons';
import styles from './right_arrow.module.scss';
import useColors from 'src/hooks/useColors';

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

export default function CustomRightArrow({ className, ...rest }: Props) {
  const colors = useColors();

  return (
    <button
      style={{ color: colors.colorText }}
      className={`${styles.button} ${className}`}
      {...rest}
    >
      Read more
      <ArrowTopRight color={colors.colorTextBase} width={32} height={32} />
    </button>
  );
}
