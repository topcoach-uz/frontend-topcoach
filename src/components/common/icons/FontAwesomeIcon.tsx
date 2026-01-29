import React from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, IconName, IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';

interface FontAwesomeIconProps {
  icon: IconProp;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl';
  color?: string;
  spin?: boolean;
  pulse?: boolean;
  fixedWidth?: boolean;
  inverse?: boolean;
  flip?: 'horizontal' | 'vertical' | 'both';
  rotation?: 90 | 180 | 270;
  transform?: string;
  mask?: IconDefinition;
  symbol?: string | boolean;
  title?: string;
  titleId?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({
  icon,
  className = '',
  size = 'sm',
  color,
  spin = false,
  pulse = false,
  fixedWidth = false,
  inverse = false,
  flip,
  rotation,
  transform,
  mask,
  symbol,
  title,
  titleId,
  style,
  onClick,
  ...props
}) => {
  const sizeMap: Record<string, SizeProp> = {
    xs: 'xs',
    sm: 'sm',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl',
  };

  const iconStyle = {
    color,
    ...style,
  };

  return (
    <FAIcon
      icon={icon}
      className={className}
      size={sizeMap[size]}
      spin={spin}
      pulse={pulse}
      fixedWidth={fixedWidth}
      inverse={inverse}
      flip={flip}
      rotation={rotation}
      transform={transform}
      mask={mask}
      symbol={symbol}
      title={title}
      titleId={titleId}
      style={iconStyle}
      onClick={onClick}
      {...props}
    />
  );
};

export default FontAwesomeIcon;