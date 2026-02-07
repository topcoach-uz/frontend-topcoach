import React from 'react';
import { Spin } from 'antd';
import './loading.scss';

export interface SpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Unified Spinner Component
 * Consistent spinner across the platform with brand colors
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'default',
  tip,
  className = '',
  style
}) => {
  return (
    <div className={`unified-spinner ${className}`} style={style}>
      <Spin size={size} tip={tip} className="unified-spinner-inner">
        <div className="unified-spinner-placeholder" style={{ minHeight: tip ? 80 : 32 }} />
      </Spin>
    </div>
  );
};

export default Spinner;
