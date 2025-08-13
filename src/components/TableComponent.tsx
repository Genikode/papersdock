'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';

export interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  // Optional server-driven mode: parent controls search/pagination and supplies paged data
  serverMode?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
  totalItems?: number;
}

export default function TableComponent({
  columns,
  data,
  serverMode = false,
  searchTerm: controlledSearchTerm,
  onSearchTermChange,
  currentPage: controlledCurrentPage,
  onPageChange,
  itemsPerPage: controlledItemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: TableProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);

  const effectiveSearchTerm = serverMode ? controlledSearchTerm ?? '' : localSearchTerm;
  const effectiveCurrentPage = serverMode ? controlledCurrentPage ?? 1 : localCurrentPage;
  const effectiveItemsPerPage = serverMode ? controlledItemsPerPage ?? 10 : localItemsPerPage;

  const filteredData = serverMode
    ? data // assume server already filtered by search
    : data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(effectiveSearchTerm.toLowerCase())
        )
      );

  const totalCount = serverMode ? totalItems ?? filteredData.length : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / effectiveItemsPerPage));
  const pageData = serverMode
    ? filteredData // assume server provided just the current page data
    : filteredData.slice(
        (effectiveCurrentPage - 1) * effectiveItemsPerPage,
        effectiveCurrentPage * effectiveItemsPerPage
      );

  return (
    <div className="bg-white shadow rounded-md">
      {/* Header Controls */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <div className="flex gap-3 items-center">
        
        </div>
        <div className="flex items-center gap-2 ">
          <Filter className="text-gray-400 border rounded px-2 py-1" size={16} />
          <span className="text-sm text-gray-600">All</span>
            <div className="relative">
           
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={effectiveSearchTerm}
            onChange={(e) => {
              if (serverMode) {
                onSearchTermChange?.(e.target.value);
                onPageChange?.(1);
              } else {
                setLocalSearchTerm(e.target.value);
                setLocalCurrentPage(1);
              }
            }}
            className="border rounded pl-8 pr-3 py-1 text-sm w-64"
          />
        </div>
        </div>
      
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
            {pageData.length > 0 ? (
              pageData.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b hover:bg-gray-50">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 text-gray-800">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-400 text-sm"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - Pagination */}
      <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <select
            className="border rounded px-2 py-1"
            value={effectiveItemsPerPage}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (serverMode) {
                onItemsPerPageChange?.(newValue);
                onPageChange?.(1);
              } else {
                setLocalItemsPerPage(newValue);
                setLocalCurrentPage(1);
              }
            }}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span>
            items | Showing {(effectiveCurrentPage - 1) * effectiveItemsPerPage + 1} -
            {Math.min(effectiveCurrentPage * effectiveItemsPerPage, totalCount)} of{' '}
            {totalCount} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={effectiveCurrentPage === 1}
            onClick={() => {
              if (serverMode) {
                onPageChange?.(Math.max(1, (effectiveCurrentPage ?? 1) - 1));
              } else {
                setLocalCurrentPage((p) => Math.max(1, p - 1));
              }
            }}
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`border rounded px-2 py-1 ${
                effectiveCurrentPage === idx + 1 ? 'bg-gray-200 font-semibold' : ''
              }`}
              onClick={() => {
                if (serverMode) {
                  onPageChange?.(idx + 1);
                } else {
                  setLocalCurrentPage(idx + 1);
                }
              }}
            >
              {idx + 1}
            </button>
          ))}

          <button
            disabled={effectiveCurrentPage === totalPages}
            onClick={() => {
              if (serverMode) {
                onPageChange?.(Math.min(totalPages, (effectiveCurrentPage ?? 1) + 1));
              } else {
                setLocalCurrentPage((p) => Math.min(totalPages, p + 1));
              }
            }}
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
