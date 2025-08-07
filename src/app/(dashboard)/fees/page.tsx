"use client";

import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { FiDownload } from "react-icons/fi";
import { MdEdit } from "react-icons/md";

const feesData = [
  {
    month: "March",
    year: 2024,
    status: "Paid",
    amount: 1500,
    hasInvoice: true,
  },
  {
    month: "August",
    year: 2024,
    status: "Pending",
    amount: 1500,
    hasInvoice: true,
  },
  {
    month: "December",
    year: 2024,
    status: "Upcoming",
    amount: 1500,
    hasInvoice: false,
  },
  {
    month: "March",
    year: 2025,
    status: "Upcoming",
    amount: 1500,
    hasInvoice: false,
  },
  {
    month: "June",
    year: 2024,
    status: "Paid",
    amount: 750,
    hasInvoice: true,
  },
];

const statusClasses: Record<string, string> = {
  Paid: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Upcoming: "bg-blue-100 text-blue-800",
};

export default function FeesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFees = feesData.filter(fee =>
    `${fee.month} ${fee.year}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="bg-gray-50 min-h-screen text-gray-800 px-6 py-6">
      <PageHeader
        title="Fee Management"
        description="Manage and track your fee payments"
      />

      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fee Records</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search students..."
              className="border px-3 py-1 rounded-md text-sm w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="border px-4 py-1 rounded-md text-sm">Filters</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Month</th>
                <th>Year</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Invoice</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.map((fee, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3">{fee.month}</td>
                  <td>{fee.year}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[fee.status]}`}
                    >
                      {fee.status}
                    </span>
                  </td>
                  <td>${fee.amount}</td>
                  <td>
                    {fee.hasInvoice ? (
                      <button className="flex items-center gap-2 border px-3 py-1 rounded-md text-sm">
                        <FiDownload />
                        View Invoice
                      </button>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="flex items-center gap-2 mt-1">
                    <button className="bg-[#0A112D] text-white text-sm px-3 py-1 rounded-md">
                      Submit Invoice
                    </button>
                    <button className="text-[#0A112D] p-1">
                      <MdEdit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <div className="border px-2 py-1 rounded">10</div>
            <span>items</span>
          </div>
          <div className="flex items-center gap-3">
            <button>{`<`} Previous</button>
            <div className="border px-2 py-1 rounded text-black">1</div>
            <button>2</button>
            <button>3</button>
            <button>Next {`>`}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
