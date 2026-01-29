import React from 'react';
import Spinner from './Spinner';
import './loading.scss';

export interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Full-screen loading overlay
 * Shows spinner with semi-transparent backdrop
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  size = 'large',
  className = '',
  style
}) => {
  if (!isLoading) return null;

  return (
    <div className={`loading-overlay ${className}`} style={style}>
      <div className="loading-overlay-content">
        <Spinner size={size} tip={text} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
