// …existing imports…
"use client";
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import React, { useState } from 'react';
export interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];

  /* server mode props you already had */
  serverMode?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (v: string) => void;
  currentPage?: number;
  onPageChange?: (n: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
  totalItems?: number;

  /* NEW */
  toolbarLeft?: React.ReactNode;   // replace the left area in the header
  hideSearch?: boolean;            // hide internal search input
}

export default function TableComponent({
  columns,
  data,
  serverMode,
  searchTerm,
  onSearchTermChange,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems,

  toolbarLeft,
  hideSearch,
}: TableProps) {
  // local state only if not serverMode
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localPerPage, setLocalPerPage] = useState(10);

  const effectiveSearch = serverMode ? (searchTerm ?? '') : localSearch;
  const effectivePage = serverMode ? currentPage : localPage;
  const effectivePerPage = serverMode ? itemsPerPage : localPerPage;

  const filteredData = serverMode
    ? data
    : data.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? '').toLowerCase().includes(effectiveSearch.toLowerCase())
        )
      );

  const total = serverMode ? (totalItems ?? filteredData.length) : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / effectivePerPage));
  const pageData = serverMode
    ? data
    : filteredData.slice((effectivePage - 1) * effectivePerPage, effectivePage * effectivePerPage);

  return (
    <div className="bg-white shadow rounded-md">
      {/* Header toolbar */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <div className="flex gap-3 items-center">
          {toolbarLeft ?? (
            <button className="border rounded px-3 py-1 flex items-center gap-2 text-sm">
              <Filter size={16} /> All
            </button>
          )}
        </div>

        {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search…"
              value={effectiveSearch}
              onChange={(e) =>
                serverMode
                  ? onSearchTermChange?.(e.target.value)
                  : (setLocalSearch(e.target.value), setLocalPage(1))
              }
              className="border rounded pl-8 pr-3 py-1 text-sm w-64"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {columns.map((col, idx) => (
                <th key={idx} className="text-left font-medium px-4 py-3 text-gray-600">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-2 text-gray-800">
                    {col.render ? col.render((row as any)[col.accessor], row) : (row as any)[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <select
            className="border rounded px-2 py-1"
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
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>
            items | Showing {(effectivePage - 1) * effectivePerPage + 1} -
            {Math.min(effectivePage * effectivePerPage, total)} of {total} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={effectivePage === 1}
            onClick={() =>
              serverMode ? onPageChange?.(effectivePage - 1) : setLocalPage((p) => p - 1)
            }
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`border rounded px-2 py-1 ${effectivePage === i + 1 ? 'bg-gray-200 font-semibold' : ''}`}
              onClick={() =>
                serverMode ? onPageChange?.(i + 1) : setLocalPage(i + 1)
              }
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={effectivePage === totalPages}
            onClick={() =>
              serverMode ? onPageChange?.(effectivePage + 1) : setLocalPage((p: number) => p + 1)
            }
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
