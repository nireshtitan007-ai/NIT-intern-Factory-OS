import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse p-4 space-y-3">
      <div className="h-6 bg-cream-200 rounded-lg w-1/4 mb-4"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-3 py-2 border-b border-subtle-divider">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-cream-100 rounded"
              style={{ width: `${Math.max(15, 100 / cols - 5)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
