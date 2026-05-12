"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types";

interface PaginationControlsProps {
  meta?: PaginationMeta;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function PaginationControls({
  meta,
  pageSize,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (!meta) return null;

  const showingStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const showingEnd = Math.min(meta.total, meta.page * meta.limit);

  return (
    <div className="pagination-footer">
      <span>
        Showing {showingStart} to {showingEnd} of {meta.total} {itemLabel}
      </span>
      <div className="pager">
        <button
          type="button"
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
        >
          <ChevronLeft size={15} />
        </button>
        <span>{`${meta.page} / ${Math.max(meta.totalPages, 1)}`}</span>
        <button
          type="button"
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight size={15} />
        </button>
        {onPageSizeChange && (
          <select
            className="input-field"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            style={{ width: 112, padding: "0.45rem 0.6rem" }}
            aria-label="Page size"
          >
            {[10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value} per page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
