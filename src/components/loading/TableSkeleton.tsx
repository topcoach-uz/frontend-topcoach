import React from 'react';
import { Skeleton, Table } from 'antd';
import './loading.scss';

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Table skeleton loader
 * Shows skeleton rows matching table structure
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 5,
  rows = 5,
  showHeader = true,
  className = ''
}) => {
  const skeletonColumns = Array.from({ length: columns }).map((_, index) => ({
    title: showHeader ? (
      <Skeleton.Input active size="small" style={{ width: 100, height: 16 }} />
    ) : null,
    dataIndex: `col${index}`,
    key: `col${index}`,
    render: () => (
      <Skeleton.Input 
        active 
        size="small" 
        style={{ width: '80%', height: 16 }} 
      />
    )
  }));

  const skeletonData = Array.from({ length: rows }).map((_, index) => ({
    key: index,
    ...Object.fromEntries(
      Array.from({ length: columns }).map((_, colIndex) => [`col${colIndex}`, ''])
    )
  }));

  return (
    <div className={`table-skeleton ${className}`}>
      <Table
        columns={skeletonColumns}
        dataSource={skeletonData}
        pagination={false}
        className="table-skeleton-inner"
      />
    </div>
  );
};

export default TableSkeleton;
