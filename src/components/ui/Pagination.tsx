import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Pagination Component
 *
 * Implements Mitra UI Section 7 (Data Tables & Lists):
 * - Active page button (.page-btn.active): solid primary blue with tactile feedback
 * - Inactive buttons: borderless subtle hover with active:scale-[0.98]
 * - Info summary text: "Menampilkan 1–10 dari 50 data"
 * - Optional page size selector (10, 20, 50 data per halaman)
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = "",
}) => {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const startItem = (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate visible page numbers with intelligent ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (validTotalPages <= 7) {
      return Array.from({ length: validTotalPages }, (_, i) => i + 1);
    }

    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", validTotalPages];
    }

    if (validCurrentPage >= validTotalPages - 3) {
      return [
        1,
        "...",
        validTotalPages - 4,
        validTotalPages - 3,
        validTotalPages - 2,
        validTotalPages - 1,
        validTotalPages,
      ];
    }

    return [
      1,
      "...",
      validCurrentPage - 1,
      validCurrentPage,
      validCurrentPage + 1,
      "...",
      validTotalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-zinc-800 text-xs ${className}`}
    >
      {/* Left: Summary Info & Page Size */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 font-medium">
        <span>
          Menampilkan <strong className="text-slate-900 dark:text-zinc-100">{startItem}–{endItem}</strong> dari{" "}
          <strong className="text-slate-900 dark:text-zinc-100">{totalItems}</strong> data
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-zinc-800">
            <label htmlFor="pagination-page-size" className="sr-only">
              Jumlah per halaman
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="rounded-md border border-slate-200 bg-white py-1 px-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1 select-none">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          aria-label="Halaman sebelumnya"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-8 w-6 items-center justify-center text-slate-400 dark:text-zinc-500 text-xs"
                >
                  •••
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === validCurrentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= validTotalPages}
          aria-label="Halaman berikutnya"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.98]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
