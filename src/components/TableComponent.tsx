// components/TableComponent.tsx
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
  searchTerm?: string;                      // external controlled value (server mode)
  onSearchTermChange?: (v: string) => void; // called (debounced) in server mode
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

  /** Max numbered buttons to render in the footer (windowed pagination). Default 7. */
  maxPageButtons?: number;
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
  maxPageButtons = 7,
}: TableProps) {
  // Local states for client mode
  const [localPage, setLocalPage] = useState(1);
  const [localPerPage, setLocalPerPage] = useState(10);

  // ----- Unified "effective" state -----
  const effectivePage = serverMode ? currentPage : localPage;
  const effectivePerPage = serverMode ? itemsPerPage : localPerPage;

  // ----- Search handling -----
  const [searchInput, setSearchInput] = useState<string>(serverMode ? (searchTerm ?? "") : "");

  // Keep input in sync if parent changes `searchTerm` (server mode)
  useEffect(() => {
    if (serverMode) setSearchInput(searchTerm ?? "");
  }, [serverMode, searchTerm]);

  // Debounce server-mode search callback
  useEffect(() => {
    if (!serverMode) return;
    const t = setTimeout(() => onSearchTermChange?.(searchInput), searchDebounceMs);
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

  // Clamp page if totalPages shrinks (e.g., after filtering)
  useEffect(() => {
    if (effectivePage > totalPages) {
      if (serverMode) onPageChange?.(totalPages);
      else setLocalPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageData = serverMode
    ? data
    : filteredData.slice((effectivePage - 1) * effectivePerPage, effectivePerPage * effectivePage);

  const startIndex = total === 0 ? 0 : (effectivePage - 1) * effectivePerPage + 1;
  const endIndex = Math.min(effectivePage * effectivePerPage, total);

  // Helpers
  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (!serverMode) setLocalPage(1);
  };
  const clearSearch = () => handleSearchChange("");

  function getPageRange(current: number, totalP: number, maxButtons: number): (number | "…")[] {
    if (totalP <= 1) return [1];

    const max = Math.max(3, maxButtons);
    const half = Math.floor(max / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(totalP, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);

    const out: (number | "…")[] = [];
    if (start > 1) {
      out.push(1);
      if (start > 2) out.push("…");
    }
    for (let p = start; p <= end; p++) out.push(p);
    if (end < totalP) {
      if (end < totalP - 1) out.push("…");
      out.push(totalP);
    }
    return out;
  }
  const pageItems = useMemo(
    () => getPageRange(effectivePage, totalPages, maxPageButtons),
    [effectivePage, totalPages, maxPageButtons]
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        {/* LEFT: external filters/actions */}
        <div className="flex flex-wrap items-center gap-3">{toolbarLeft}</div>

        {/* RIGHT: Search */}
        {!hideSearch && (
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (serverMode && e.key === "Enter") onSearchTermChange?.(searchInput);
              }}
              className="w-full sm:w-64 text-sm rounded pl-8 pr-8 py-1
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col, idx) => (
                <th key={idx} className="text-left font-medium px-4 py-3 text-slate-700 dark:text-slate-300">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
                      {/* Wrap cell content so long text will break/wrap after a threshold.
                          Use `break-all` for name/email to force breaks inside long continuous text. */}
                      <div
                        className={`  ${
                          ['email', 'name'].includes(((col.accessor || "") as string).toLowerCase())
                            ? 'break-all'
                            : 'break-words'
                        }`}
                      >
                        {col.render ? col.render((row as any)[col.accessor], row) : (row as any)[col.accessor]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-3 text-sm text-slate-600 dark:text-slate-400">
        {/* Left: per-page + showing */}
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Right: Pagination */}
        <div className="flex items-center gap-2">
          {/* Prev */}
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
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Desktop: numbered buttons (compact window) */}
          <div className="hidden sm:flex items-center gap-1">
            {pageItems.map((item, idx) =>
              item === "…" ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 py-1 text-slate-500 dark:text-slate-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => (serverMode ? onPageChange?.(item) : setLocalPage(item))}
                  className={`border rounded px-2 py-1
                              border-slate-300 dark:border-slate-700
                              bg-white dark:bg-slate-900
                              text-slate-700 dark:text-slate-300
                              hover:bg-slate-50 dark:hover:bg-slate-800
                              ${effectivePage === item ? 'bg-slate-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-slate-100' : ''}`}
                  aria-current={effectivePage === item ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* Mobile: just "X / Y" */}
          <div className="sm:hidden text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {effectivePage} / {totalPages}
          </div>

          {/* Next */}
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
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
