import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme: 'light' | 'dark';
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, theme }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`p-2 rounded-lg transition-colors ${
          currentPage <= 1
            ? 'opacity-50 cursor-not-allowed'
            : theme === 'dark'
            ? 'hover:bg-slate-800 text-slate-400'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`p-2 rounded-lg transition-colors ${
          currentPage >= totalPages
            ? 'opacity-50 cursor-not-allowed'
            : theme === 'dark'
            ? 'hover:bg-slate-800 text-slate-400'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
