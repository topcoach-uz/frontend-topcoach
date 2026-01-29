import React from 'react';
import { Skeleton } from 'antd';
import './loading.scss';

export interface PageSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Page-level skeleton loader
 * Shows skeleton placeholders matching page layout
 */
const PageSkeleton: React.FC<PageSkeletonProps> = ({
  rows = 4,
  showAvatar = false,
  showTitle = true,
  className = '',
  style
}) => {
  return (
    <div className={`page-skeleton ${className}`} style={style}>
      {showTitle && (
        <Skeleton.Input 
          active 
          size="large" 
          style={{ width: '60%', height: 32, marginBottom: 24 }}
        />
      )}
      <Skeleton 
        active 
        avatar={showAvatar}
        paragraph={{ rows }}
        className="page-skeleton-content"
      />
    </div>
  );
};

export default PageSkeleton;
