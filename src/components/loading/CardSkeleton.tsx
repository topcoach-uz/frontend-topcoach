import React from 'react';
import { Skeleton } from 'antd';
import { CustomCard } from 'src/components/cards';
import './loading.scss';

export interface CardSkeletonProps {
  count?: number;
  showImage?: boolean;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Card skeleton loader
 * Shows skeleton cards matching card structure
 */
const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  showImage = true,
  showAvatar = false,
  className = ''
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <CustomCard
          key={index}
          padding={16}
          borderRadius={12}
          shadowed={true}
          className={`card-skeleton ${className}`}
          bordered
        >
          {showImage && (
            <Skeleton.Image
              active
              style={{ width: '100%', height: 180, marginBottom: 16 }}
            />
          )}
          <Skeleton
            active
            avatar={showAvatar}
            paragraph={{ rows: 3 }}
            title={{ width: '80%' }}
          />
        </CustomCard>
      ))}
    </>
  );
};

export default CardSkeleton;
