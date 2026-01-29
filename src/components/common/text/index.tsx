import React from 'react';
import {
  MarginTypes,
  PaddingTypes,
  colors,
  flexStyles,
} from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

type CombinedProps = React.HTMLAttributes<HTMLDivElement> &
  MarginTypes &
  PaddingTypes;

interface Props extends Omit<CombinedProps, 'prefix'> {
  type?: 'title' | 'subtitle' | 'default';
  width?: React.CSSProperties['width'];
  maxWidth?: React.CSSProperties['maxWidth'];
  height?: React.CSSProperties['height'];
  lineHeight?: React.CSSProperties['lineHeight'];
  maxHeight?: React.CSSProperties['maxHeight'];
  color?: React.CSSProperties['color'];
  fontSize?: React.CSSProperties['fontSize'];
  fontWeight?: React.CSSProperties['fontWeight'];
  centered?: boolean;
  suffix?: React.ReactNode;
  suffixGap?: number;
  prefix?: React.ReactNode;
  prefixGap?: number;
  borderRight?: string;
  as?: React.ElementType;
}

export default function CustomText({
  type = 'default',
  width,
  maxWidth,
  height,
  lineHeight,
  maxHeight,
  color,
  fontSize,
  fontWeight = 400,
  centered,
  m,
  mt,
  mb,
  ml,
  mr,
  p,
  pt,
  pb,
  pl,
  pr,
  style,
  prefix,
  prefixGap = 9,
  suffix,
  suffixGap = 9,
  borderRight,
  as: Component = 'div',
  children,
  ...rest
}: Props) {
  const colors = useColors();

  return (
    <Component
      style={{
        width,
        maxWidth,
        height,
        maxHeight,
        color: color || colors.colorText,
        fontSize:
          fontSize || (type === 'title' ? 24 : type === 'subtitle' ? 18 : 16),
        fontWeight:
          fontWeight ||
          (type === 'title' ? 700 : type === 'subtitle' ? 600 : 400),
        textAlign: centered ? 'center' : 'left',
        lineHeight,
        margin: m,
        marginTop: mt,
        marginBottom: mb,
        marginLeft: ml,
        marginRight: mr,
        padding: p,
        paddingTop: pt,
        paddingBottom: pb,
        paddingLeft: pl,
        paddingRight: pr,
        borderRight,
        ...flexStyles.flexRowCenter,
        ...style,
      }}
      {...rest}
    >
      {prefix && (
        <div style={{ marginRight: prefixGap, display: 'inline-block' }}>
          {prefix}
        </div>
      )}
      {children}
      {suffix && (
        <div style={{ marginLeft: suffixGap, display: 'inline-block' }}>
          {suffix}
        </div>
      )}
    </Component>
  );
}
