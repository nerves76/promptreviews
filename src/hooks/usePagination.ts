/**
 * usePagination Hook
 *
 * Reusable pagination logic for tables and lists.
 * Handles page state, bounds checking, and auto-reset on data changes.
 */

import { useState, useMemo, useEffect } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  // Current state
  currentPage: number;
  totalPages: number;
  pageSize: number;

  // Index bounds for slicing data
  startIndex: number;
  endIndex: number;

  // Navigation actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Convenience flags
  isFirstPage: boolean;
  isLastPage: boolean;
}

const DEFAULT_PAGE_SIZE = 25;

export function usePagination({
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Reset to page 1 when total items changes (e.g., after filtering)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, currentPage]);

  // Calculate slice indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Navigation functions with bounds checking
  const goToPage = (page: number) => {
    const boundedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(boundedPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
}

export default usePagination;
