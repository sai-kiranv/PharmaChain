import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange
}) => {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination">
      <div>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{startRecord}</span> to{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{endRecord}</span> of{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalRecords}</span> records in Oracle
      </div>

      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span style={{ padding: '0 8px', fontSize: '0.85rem' }}>
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
