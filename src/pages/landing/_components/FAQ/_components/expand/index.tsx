import { CollapseExpandSvg, CollapseMinusSvg } from 'src/assets/svg';
import useColors from 'src/hooks/useColors';

interface Props {
  isActive?: boolean;
}

const CustomExpandIcon = ({ isActive }: Props) => {
  const colors = useColors();
  return (
    <span style={{ marginRight: 8 }}>
      {isActive ? (
        <CollapseMinusSvg color={colors.colorIcon} />
      ) : (
        <CollapseExpandSvg color={colors.colorIcon} />
      )}
    </span>
  );
};

export default CustomExpandIcon;
