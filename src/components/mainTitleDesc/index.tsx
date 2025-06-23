import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { CustomText } from '../common';

interface Props {
  title: string;
  description: string;
  mb?: string | number;
  mt?: string | number;
  titleColor?: string;
  descriptionColor?: string;
  centered?: boolean;
}

export default function MainTitleDescription({
  description,
  title,
  mb,
  mt,
  titleColor,
  descriptionColor,
  centered = true,
}: Props) {
  const colors = useColors();
  const { screenSize } = useScreenSize();

  const clr = titleColor || colors.colorTextBase;
  const descClr = descriptionColor || colors.colorTextDescription;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
      }}
    >
      <CustomText
        fontSize={screenSize > 560 ? 32 : 26}
        fontWeight={600}
        color={clr}
        mt={mt}
        mb={4}
      >
        {title}
      </CustomText>
      <CustomText
        maxWidth={650}
        fontSize={screenSize > 560 ? 16 : 14}
        color={descClr}
        mb={mb}
        style={{ textAlign: 'center' }}
      >
        {description}
      </CustomText>
    </div>
  );
}
