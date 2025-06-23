import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';

interface Props {
  title: string;
  description: string;
}
export default function TitleDescriptionPair({ title, description }: Props) {
  const colors = useTypedSelector((state) => state.layout.colors);

  return (
    <>
      <CustomText
        fontSize={32}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorText}
        mb={8}
      >
        {title}
      </CustomText>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle7}
        fontWeight={themeFontWeight.fontWeightMedium}
        color={colors.colorTextDescription}
        mb={24}
      >
        {description}
      </CustomText>
    </>
  );
}
