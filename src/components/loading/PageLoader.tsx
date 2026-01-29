import React from 'react';
import Spinner from './Spinner';
import useColors from 'src/hooks/useColors';
import './loading.scss';

export interface PageLoaderProps {
  height?: string | number;
  width?: string | number;
  text?: string;
  bgColor?: string;
  className?: string;
}

/**
 * Full page loader
 * Replaces the old Loader component with unified styling
 */
const PageLoader: React.FC<PageLoaderProps> = ({
  height = '100vh',
  width,
  text = 'Loading...',
  bgColor,
  className = ''
}) => {
  const colors = useColors();

  return (
    <div
      className={`page-loader ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: height,
        background: bgColor ?? colors.colorBgLayout,
        width: width || 'auto',
      }}
    >
      <div className="page-loader-content">
        <Spinner size="large" tip={text} />
      </div>
    </div>
  );
};

export default PageLoader;
