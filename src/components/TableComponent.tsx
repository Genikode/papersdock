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
}

export default function TableComponent({ columns, data }: TableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pageData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
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
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span>
            items | Showing {(currentPage - 1) * itemsPerPage + 1} -
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
            {filteredData.length} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`border rounded px-2 py-1 ${
                currentPage === idx + 1 ? 'bg-gray-200 font-semibold' : ''
              }`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="border rounded px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
