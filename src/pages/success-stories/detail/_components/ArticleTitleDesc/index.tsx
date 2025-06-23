import React from 'react';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface Props {
  title: string | React.ReactNode;
  desc: string | React.ReactNode;
}

export default function ArticleTitleDesc({ title, desc }: Props) {
  const colors = useColors();

  return (
    <>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorText}
      >
        {title}
      </CustomText>
      <CustomText color={colors.colorText} lineHeight={1.4}>
        {desc}
      </CustomText>
    </>
  );
}
