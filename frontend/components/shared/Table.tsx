// components/shared/Table.tsx
// Shared data table for Broker (listings, leads, PG) and Admin screens.
// Takes data + callbacks only — sorting, filtering, and pagination are all
// server-driven via the callbacks below, this component holds no query state.

"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table as TablePrimitive,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
};

export type TableSort = { key: string; direction: "asc" | "desc" };

export type TablePagination = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export type SharedTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyBody?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filtersSlot?: ReactNode;
  sort?: TableSort;
  onSortChange?: (key: string) => void;
  pagination?: TablePagination;
};

const SKELETON_ROWS = 5;

export default function SharedTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  error,
  emptyTitle = "Nothing here yet",
  emptyBody,
  searchValue,
  onSearchChange,
  filtersSlot,
  sort,
  onSortChange,
  pagination,
}: SharedTableProps<T>) {
  const showToolbar = onSearchChange !== undefined || filtersSlot !== undefined;

  return (
    <div className="flex flex-col gap-3">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative max-w-xs flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search…"
                className="pl-8"
              />
            </div>
          )}
          {filtersSlot}
        </div>
      )}

      <div className="rounded-lg border">
        <TablePrimitive>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {column.header}
                      {sort?.key === column.key &&
                        (sort.direction === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={columns.length} className="whitespace-normal">
                  <ErrorState title="Couldn't load this table" body={error} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="whitespace-normal">
                  <EmptyState title={emptyTitle} body={emptyBody} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
              data.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </TablePrimitive>
      </div>

      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm">
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            className={cn(pagination.page <= 1 && "pointer-events-none")}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.page >= pagination.pageCount}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
