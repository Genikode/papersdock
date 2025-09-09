// TableComponent.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];

  /* Server mode props */
  serverMode?: boolean;
  searchTerm?: string;                         // external controlled value (server mode)
  onSearchTermChange?: (v: string) => void;    // called (debounced) in server mode
  currentPage?: number;
  onPageChange?: (n: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
  totalItems?: number;

  /* Extras */
  toolbarLeft?: React.ReactNode;
  hideSearch?: boolean;

  /** Debounce delay for serverMode search (ms). Default 300. */
  searchDebounceMs?: number;
}

export default function TableComponent({
  columns,
  data,
  serverMode = false,
  searchTerm,
  onSearchTermChange,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems,
  toolbarLeft,
  hideSearch = false,
  searchDebounceMs = 300,
}: TableProps) {
  // Local states for client mode
  const [localSearch, setLocalSearch] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [localPerPage, setLocalPerPage] = useState(10);

  // ----- Unified "effective" state -----
  const effectivePage = serverMode ? currentPage : localPage;
  const effectivePerPage = serverMode ? itemsPerPage : localPerPage;

  // ----- Search handling -----
  // We keep a local input state for BOTH modes so typing is instant.
  const [searchInput, setSearchInput] = useState<string>(serverMode ? (searchTerm ?? "") : localSearch);

  // Keep input in sync if parent changes `searchTerm` (server mode)
  useEffect(() => {
    if (serverMode) {
      setSearchInput(searchTerm ?? "");
    }
  }, [serverMode, searchTerm]);

  // Debounce: in server mode, call parent after delay; in client mode, just update local state.
  useEffect(() => {
    if (!serverMode) return;
    const t = setTimeout(() => {
      // Reset to page 1 is handled by parent, but if not, they can listen and reset.
      onSearchTermChange?.(searchInput);
    }, searchDebounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMode, searchInput, searchDebounceMs]);

  // Client-mode filtering
  const filteredData = useMemo(() => {
    if (serverMode) return data;
    const q = (searchInput || "").toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [data, serverMode, searchInput]);

  // Pagination math
  const total = serverMode ? (totalItems ?? filteredData.length) : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / effectivePerPage));
  const pageData = serverMode
    ? data
    : filteredData.slice((effectivePage - 1) * effectivePerPage, effectivePerPage * effectivePage);

  const startIndex = total === 0 ? 0 : (effectivePage - 1) * effectivePerPage + 1;
  const endIndex = Math.min(effectivePage * effectivePerPage, total);

  // Helpers
  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (!serverMode) {
      setLocalPage(1);
    }
  };
  const clearSearch = () => handleSearchChange("");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
  {/* Header toolbar */}
  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
    {/* LEFT: external filters/actions */}
    <div className="flex flex-wrap items-center gap-3">{toolbarLeft}</div>

    {/* RIGHT: Search */}
    {!hideSearch && (
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            // Optional: submit immediately on Enter in server mode
            if (serverMode && e.key === 'Enter') {
              onSearchTermChange?.(searchInput);
            }
          }}
          className="w-64 text-sm rounded pl-8 pr-8 py-1
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchInput ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1 rounded
                       border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-600 dark:text-slate-300
                       hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        ) : null}
      </div>
    )}
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          {columns.map((col, idx) => (
            <th key={idx} className="text-left font-medium px-4 py-3 text-slate-700 dark:text-slate-300">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pageData.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
              No data found.
            </td>
          </tr>
        ) : (
          pageData.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-2 text-slate-800 dark:text-slate-200">
                  {col.render ? col.render((row as any)[col.accessor], row) : (row as any)[col.accessor]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* Footer / pagination */}
  <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
    <div className="flex items-center gap-2">
      <span>Showing</span>
      <select
        className="border rounded px-2 py-1
                   border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        value={effectivePerPage}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (serverMode) {
            onItemsPerPageChange?.(next);
          } else {
            setLocalPerPage(next);
            setLocalPage(1);
          }
        }}
      >
        {[5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span>
        items | Showing {startIndex} - {endIndex} of {total} entries
      </span>
    </div>

    <div className="flex items-center gap-2">
      <button
        disabled={effectivePage === 1}
        onClick={() =>
          serverMode ? onPageChange?.(effectivePage - 1) : setLocalPage((p) => Math.max(1, p - 1))
        }
        className="border rounded px-2 py-1 disabled:opacity-30
                   border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          className={`border rounded px-2 py-1
                      border-slate-300 dark:border-slate-700
                      bg-white dark:bg-slate-900
                      text-slate-700 dark:text-slate-300
                      hover:bg-slate-50 dark:hover:bg-slate-800
                      ${effectivePage === i + 1 ? 'bg-slate-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-slate-100' : ''}`}
          onClick={() => (serverMode ? onPageChange?.(i + 1) : setLocalPage(i + 1))}
        >
          {i + 1}
        </button>
      ))}

      <button
        disabled={effectivePage === totalPages}
        onClick={() =>
          serverMode ? onPageChange?.(effectivePage + 1) : setLocalPage((p) => Math.min(totalPages, p + 1))
        }
        className="border rounded px-2 py-1 disabled:opacity-30
                   border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
</div>

  );
}
