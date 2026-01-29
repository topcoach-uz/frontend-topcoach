import React from 'react';
import Spinner from './Spinner';
import './loading.scss';

export interface InlineLoaderProps {
  text?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Inline loading indicator
 * For loading states within content areas
 */
const InlineLoader: React.FC<InlineLoaderProps> = ({
  text,
  size = 'default',
  className = '',
  style
}) => {
  return (
    <div className={`inline-loader ${className}`} style={style}>
      <Spinner size={size} tip={text} />
    </div>
  );
};

export default InlineLoader;
