'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { CheckCircle, Clock, DollarSign, Eye, XCircle } from 'lucide-react';

/* =========================
   Types matching your API
========================= */
type FeeApiItem = {
  studentId: string;
  name: string;
  email: string;
  contact: string;
  isBlocked: 'Y' | 'N';
  isFeesPaid: 'Y' | 'N';
  allowedCourses: string;
  dueDate: string;
  feeId: string;
  month: number;
  year: string;
  invoiceUrl: string;
  feeExpiryDate: string;

  status: 'Paid' | 'Pending' | 'Rejected' | string;
  feesAmount: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  feeSubmissionDate?: string | null;
};

type FeeListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: FeeApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type CourseItem = { id: string; title: string; fees?: string };
type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers / formatting
========================= */
const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' },   { value: 5, label: 'May' },      { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },   { value: 9, label: 'September' },
  { value: 10, label: 'October' },{ value: 11, label: 'November' },{ value: 12, label: 'December' },
];

function monthName(n: number) {
  return MONTHS.find(m => m.value === n)?.label ?? String(n);
}

function fmtDate(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString();
}

/* =========================
           Page
========================= */
export default function FeeApprovalPage() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [courseId, setCourseId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const COURSE_LIMIT = 1000;
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  async function loadCourses(page = 1) {
    setLoadingCourses(true);
    try {
      const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page, limit: COURSE_LIMIT });
      const body: any = res as any;

      const items: CourseItem[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.data)
          ? body.data.data
          : [];

      setCourses(items);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    loadCourses(1);
  }, []);

  /* ---- Fees ---- */
  const [rows, setRows] = useState<FeeApiItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [feeamount, setFeeAmount] = useState<string>('');

  // Modals
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [updateId, setUpateId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  // Bulk update modal
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(now.getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(now.getFullYear());
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState<Date>(new Date());
  const [bulkFeeAmount, setBulkFeeAmount] = useState('');

  async function fetchFees() {
    setLoading(true);
    try {
      const res = await api.get<FeeListResponse>('/fee/get-fee-data-monthly', {
        month,
        year,
        page: currentPage,
        limit: itemsPerPage,
        courseId: courseId || undefined,
        search: searchTerm || undefined,
        status: status || undefined,
      });
      setRows(res.data || []);
      setTotalItems(res.pagination?.total ?? (res.data?.length ?? 0));
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFees();
  }, [month, year, courseId, status, currentPage, itemsPerPage, searchTerm]);

  const stats = useMemo(() => {
    const total = totalItems;
    let approved = 0, rejected = 0, pending = 0;
    rows.forEach((r) => {
      if (r.status === 'Paid' || String(r.status).toLowerCase() === 'approved') approved += 1;
      else if (String(r.status).toLowerCase() === 'rejected') rejected += 1;
      else pending += 1;
    });
    return [
      { label: 'Total Submissions', value: total, icon: <DollarSign size={16} /> },
      { label: 'Pending Review', value: pending, icon: <Clock size={16} /> },
      { label: 'Approved', value: approved, icon: <CheckCircle size={16} /> },
      { label: 'Rejected', value: rejected, icon: <XCircle size={16} /> },
    ];
  }, [rows, totalItems]);

  async function approveFee(id: string) {
    try {
      await api.patch(`/fee/approve-fee/${id}`);
      setApproveId(null);
      fetchFees();
    } catch {
      setApproveId(null);
    }
  }
  async function updatefee(id: string) {
    try {
      await api.patch(`/fees/update-fee-data/${id}`, { dueDate: dueDate, feesAmount: feeamount });
      setUpateId(null);
      fetchFees();
    } catch {
      setUpateId(null);
    }
  }
  async function rejectFee(id: string) {
    try {
      await api.patch(`/fee/reject-fee/${id}`);
      setRejectId(null);
      fetchFees();
    } catch {
      setRejectId(null);
    }
  }

  async function updateAllFees() {
    try {
      await api.patch('/fees/update-fee-data-all-students', {
        month: bulkMonth,
        year: bulkYear,
        dueDate: bulkDueDate.toISOString().split('T')[0],
        feesAmount: bulkFeeAmount || undefined,
        courseId: bulkCourseId,
      });
      setShowBulkUpdate(false);
      fetchFees();
    } catch {
      setShowBulkUpdate(false);
    }
  }

  const tableData = useMemo(
    () =>
      rows.map((r, idx) => ({
        ...r,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [rows, currentPage, itemsPerPage]
  );

  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { header: 'S.No', accessor: 'sNo' },
      { header: 'Student', accessor: 'name' },
      { header: 'Contact', accessor: 'contact' },
      {
        header: 'Month',
        accessor: 'month',
        render: (value: number) => monthName(Number(value)),
      },
      { header: 'Year', accessor: 'year' },
      {
        header: 'DueDate',
        accessor: 'dueDate',
        render: (value: string) => <span>{fmtDate(value)}</span>,
      },
      {
        header: 'Fee Status',
        accessor: 'status',
        render: (_: any, row: FeeApiItem) => {
          const statusText = row.status;
          const map: Record<string, string> = {
            Paid: 'bg-green-100 text-green-800',
            Pending: 'bg-yellow-100 text-yellow-800',
            Missed: 'bg-red-100 text-red-800',
            Rejected: 'bg-gray-100 text-gray-800',
            Unpaid: 'bg-red-100 text-red-800',
          };
          const cls = map[statusText] ?? 'bg-gray-100 text-gray-700';
          return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{statusText}</span>;
        },
      },
      {
        header: 'Approved At',
        accessor: 'approvedAt',
        render: (_: any, row: FeeApiItem) => {
          const date = fmtDate(row.approvedAt);
          const dueDate = fmtDate(row.feeExpiryDate);
          return <span className="text-xs px-2 py-1 rounded">{date != null ? date : dueDate}</span>;
        },
      },
      {
        header: 'Fees Amount',
        accessor: 'feesAmount',
        render: (value: string) => (value ? `${value}` : '-'),
      },
      {
        header: 'Action',
        accessor: 'actions',
        render: (_: any, row: FeeApiItem) => {
          const canAct = row.status !== 'Paid' && String(row.status).toLowerCase() !== 'rejected';
          return (
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs"
                title="View"
                onClick={() => row.invoiceUrl && setReceiptUrl(row.invoiceUrl)}
                disabled={!row.invoiceUrl}
              >
                <Eye size={14} /> View
              </button>
              {canAct ? (
                <>
                  <button
                    className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-green-50 hover:text-black"
                    title="Edit"
                    onClick={() => {
                      setFeeAmount(row.feesAmount);
                      setDueDate(row.dueDate ? new Date(row.dueDate) : new Date());
                      setUpateId(row.feeId);
                    }}
                  >
                    <CheckCircle size={14} /> Edit
                  </button>
                  <button
                    className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-green-50 hover:text-black"
                    title="Approve"
                    onClick={() => setApproveId(row.feeId)}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-red-50"
                    title="Reject"
                    onClick={() => setRejectId(row.feeId)}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          );
        },
      },
    ],
    [currentPage, itemsPerPage]
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Month */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">Month</label>
        <select
          value={month}
          onChange={(e) => {
            setMonth(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="text-sm px-2 py-1 rounded border bg-white dark:bg-slate-900"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">Year</label>
        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="text-sm px-2 py-1 rounded border bg-white dark:bg-slate-900"
        >
          {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Course */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">Course</label>
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setCurrentPage(1);
          }}
          className="text-sm px-2 py-1 rounded border min-w-[120px] bg-white dark:bg-slate-900"
        >
          <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">Status</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="text-sm px-2 py-1 rounded border bg-white dark:bg-slate-900"
        >
          <option value="">All</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border rounded text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setShowBulkUpdate(true)}
        >
          Update Deadline
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PageHeader title="Fee Approval" description="Review and approve student fee submissions" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="p-4 rounded-md shadow-sm border bg-white dark:bg-slate-900"
          >
            <div className="text-sm flex justify-between items-center">
              {s.label}
              {s.icon}
            </div>
            <div className="mt-1 text-lg font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-md shadow-md border">
        {loading && <p className="px-4 py-2 text-sm">Loading fees…</p>}
        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
          toolbarLeft={toolbar}
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setCurrentPage(1);
            setSearchTerm(v);
          }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setCurrentPage(1);
            setItemsPerPage(n);
          }}
          totalItems={totalItems}
        />
      </div>

      {/* Receipt Modal */}
      {receiptUrl && (
        <Modal title="Fee Receipt" onClose={() => setReceiptUrl(null)}>
          <div className="w-full">
            <iframe src={receiptUrl} className="w-full h-[70vh]" title="Receipt" />
          </div>
        </Modal>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Update Deadline (All Students)</h2>

            <div className="mb-3">
              <label className="block text-sm mb-1">Month</label>
              <select
                value={bulkMonth}
                onChange={(e) => setBulkMonth(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Year</label>
              <select
                value={bulkYear}
                onChange={(e) => setBulkYear(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              >
                {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Course</label>
              <select
                value={bulkCourseId}
                onChange={(e) => setBulkCourseId(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{loadingCourses ? 'Loading…' : 'Select course'}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Due Date</label>
              <input
                type="date"
                value={bulkDueDate.toISOString().split('T')[0]}
                onChange={(e) => setBulkDueDate(new Date(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Fees Amount (optional)</label>
              <input
                type="number"
                value={bulkFeeAmount}
                onChange={(e) => setBulkFeeAmount(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkUpdate(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateAllFees}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {approveId && (
        <ConfirmationModal
          title="Approve Fee"
          description="Are you sure you want to approve this fee submission?"
          onCancel={() => setApproveId(null)}
          onConfirm={() => approveFee(approveId)}
        />
      )}

      {rejectId && (
        <ConfirmationModal
          title="Reject Fee"
          description="Are you sure you want to reject this fee submission?"
          onCancel={() => setRejectId(null)}
          onConfirm={() => rejectFee(rejectId)}
        />
      )}
    </main>
  );
}
