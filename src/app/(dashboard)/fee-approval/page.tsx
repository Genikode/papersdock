'use client';
import PageHeader from '@/components/PageHeader';
import TableComponent from '@/components/TableComponent';
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
interface FeeRow {
    sno: number;
    studentId: string;
    month: string;
    year: number;
    studentName: string;
    contact: string;
    receipt: string;
    status: "Approved" | "Pending" | "Overdue" | "Rejected";
    actions?: unknown;
}

interface Column<T> {
    header: string;
    accessor: keyof T | string;
    render?: (value: any, row: T) => React.ReactNode;
}
const yourFeeDataHere = [
  {
    sno: 1,
    studentId: "STU001",
    month: "January",
    year: 2024,
    studentName: "John Doe",
    contact: "+1 (555) 123-4567",
    status: "Pending",
  },
  {
    sno: 2,
    studentId: "STU002",
    month: "February",
    year: 2024,
    studentName: "Jane Smith",
    contact: "+1 (555) 987-6543",
    status: "Approved",
  },
  // etc.
];

const columns: Column<FeeRow>[] = [
    { header: "S.No", accessor: "sno" },
    { header: "Student ID", accessor: "studentId" },
    { header: "Month", accessor: "month" },
    { header: "Year", accessor: "year" },
    { header: "Student Name", accessor: "studentName" },
    { header: "Contact", accessor: "contact" },
    {
        header: "Receipt",
        accessor: "receipt",
        render: (_: any, row: FeeRow) => (
            <button className="text-sm border px-2 py-1 rounded">View Receipt</button>
        ),
    },
    {
        header: "Fee Status",
        accessor: "status",
        render: (status: FeeRow["status"]) => {
            const statusMap: Record<FeeRow["status"], string> = {
                Approved: "bg-green-100 text-green-800",
                Pending: "bg-yellow-100 text-yellow-800",
                Overdue: "bg-red-100 text-red-800",
                Rejected: "bg-gray-100 text-gray-800",
            };
            return <span className={`text-xs px-2 py-1 rounded ${statusMap[status]}`}>{status}</span>;
        },
    },
    {
        header: "Action",
        accessor: "actions",
        render: (_: any, row: FeeRow) => (
            <div className="flex items-center gap-2">
                <button title="View">👁️</button>
                <button title="Approve">✅</button>
                <button title="Reject">❌</button>
            </div>
        ),
    },
];

const stats = [
  { label: "Total Submissions", value: 15, icon: <DollarSign size={16} /> },
  { label: "Pending Review", value: 5, icon: <Clock size={16} /> },
  { label: "Approved", value: 5, icon: <CheckCircle size={16} /> },
  { label: "Rejected", value: 2, icon: <XCircle size={16} /> },
];
interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}

 function StatCard({ label, value, icon, color = "bg-white" }: StatCardProps) {
  return (
    <div className={`p-4 rounded-md shadow-sm border ${color} flex-1`}>
      <div className="text-sm text-gray-500 flex justify-between items-center">
        {label}
        {icon}
      </div>
      <div className="mt-1 text-lg font-semibold text-gray-800">{value}</div>
    </div>
  );
}

export default function FeeApprovalPage() {
  return (
    <main className="bg-[#F9FAFB] p-6 text-gray-800">
      <PageHeader title="Fee Approval" description="Review and approve student fee submissions" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-md">
        <TableComponent columns={columns} data={yourFeeDataHere} />
      </div>
    </main>
  );
}
