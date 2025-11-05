import React from 'react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { cn } from '../../lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
  showFirstLast?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPage = true,
  showFirstLast = true,
  className,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Show first few pages
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last few pages
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show pages around current page
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 md:px-6 w-full', className)}>
      {/* Items info and per page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-shrink-0">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          បានបង្ហាញ <span className="font-medium text-foreground">{startItem}</span> -{' '}
          <span className="font-medium text-foreground">{endItem}</span> នៃ{' '}
          <span className="font-medium text-foreground">{totalItems}</span> ព័ត៌មាន
        </div>
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">បង្ហាញ:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value, 10))}
            >
              <SelectTrigger className="h-9 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination controls - keep all buttons together */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-nowrap overflow-x-auto">
          {/* First page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="ទំព័រដំបូង"
            >
              {/* @ts-ignore */}
              <FiChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="មុន"
          >
            {/* @ts-ignore */}
            <FiChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1 text-sm text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-9 min-w-[36px] px-3 flex-shrink-0',
                    currentPage === pageNum && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="បន្ទាប់"
          >
            {/* @ts-ignore */}
            <FiChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="ទំព័រចុងក្រោយ"
            >
              {/* @ts-ignore */}
              <FiChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

