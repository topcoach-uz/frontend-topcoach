import React from 'react';
import { colors } from 'src/constants/theme';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'success' | 'warning' | 'danger';
  bg?: React.CSSProperties['backgroundColor'];
  color?: React.CSSProperties['color'];
  fontSize?: number;
  fontWeight?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  borderRadius?: number;
  top?: number;
  right?: number;
}

export default function CustomBadge({
  type,
  bg,
  color,
  fontSize = 18,
  fontWeight = 600,
  paddingHorizontal = 26,
  paddingVertical = 11,
  borderRadius = 50,
  top = 23,
  right = 0,
  style,
  children,
  ...rest
}: Props) {
  return (
    <div
      style={{
        backgroundColor:
          bg ||
          (type === 'danger' && colors.red) ||
          (type && colors[type]) ||
          colors.primary,
        color,
        fontSize,
        fontWeight,
        padding: `${paddingVertical}px ${paddingHorizontal}px`,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
        position: 'absolute',
        top,
        right,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
