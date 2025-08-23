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
  allowedCourses: string; // JSON string array
  feeId: string;
  month: number;          // 1..12
  year: string;           // "2025"
  invoiceUrl: string;
  feeExpiryDate: string;  // ISO
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

function isOverdue(item: FeeApiItem) {
  if (!item.feeExpiryDate) return false;
  const today = new Date();
  const exp = new Date(item.feeExpiryDate);
  return exp.getTime() < today.getTime() && item.status !== 'Paid' && item.status !== 'Rejected';
}

/* =========================
           Page
========================= */
export default function FeeApprovalPage() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [courseId, setCourseId] = useState<string>('');

  /* ---- Courses (limit = 2) with "load more" ---- */
  const COURSE_LIMIT = 2;
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseHasMore, setCourseHasMore] = useState(false);
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

      const pagination =
        body?.pagination ??
        body?.data?.pagination ?? {
          total: items.length,
          page,
          limit: COURSE_LIMIT,
          totalPages: 1,
        };

      setCourses(prev => {
        // de-dup by id if user clicks load more multiple times
        const next = [...prev];
        items.forEach(i => {
          if (!next.find(x => x.id === i.id)) next.push(i);
        });
        return next;
      });
      setCourseHasMore(page < Number(pagination.totalPages || 1));
      setCoursePage(page);
    } catch {
      setCourses([]);
      setCourseHasMore(false);
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    loadCourses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Fees (server-driven table) ---- */
  const [rows, setRows] = useState<FeeApiItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  /* Fetch fee list */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, courseId, currentPage, itemsPerPage, searchTerm]);

  /* Stats */
  const stats = useMemo(() => {
    const total = totalItems;
    let approved = 0, rejected = 0, pending = 0, overdue = 0;
    rows.forEach((r) => {
      if (r.status === 'Paid') approved += 1;
      else if (String(r.status).toLowerCase() === 'rejected') rejected += 1;
      else pending += 1;
      if (isOverdue(r)) overdue += 1;
    });
    return [
      { label: 'Total Submissions', value: total, icon: <DollarSign size={16} /> },
      { label: 'Pending Review', value: pending, icon: <Clock size={16} /> },
      { label: 'Approved', value: approved, icon: <CheckCircle size={16} /> },
      { label: 'Rejected/Overdue', value: rejected + overdue, icon: <XCircle size={16} /> },
    ];
  }, [rows, totalItems]);

  /* Actions */
  async function approveFee(id: string) {
    try {
      await api.patch(`/fee/approve-fee/${id}`);
      setApproveId(null);
      fetchFees();
    } catch {
      setApproveId(null);
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

  /* Pre-compute S.No */
  const tableData = useMemo(
    () =>
      rows.map((r, idx) => ({
        ...r,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [rows, currentPage, itemsPerPage]
  );

  /* Columns */
  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { header: 'S.No', accessor: 'sNo' },
      { header: 'Student', accessor: 'name' },
      { header: 'Email', accessor: 'email' },
      { header: 'Contact', accessor: 'contact' },
      {
        header: 'Month',
        accessor: 'month',
        render: (value: number) => monthName(Number(value)),
      },
      { header: 'Year', accessor: 'year' },
      {
        header: 'Invoice',
        accessor: 'invoiceUrl',
        render: (value: string) =>
          value ? (
            <button
              className="text-sm border px-3 py-1 rounded"
              onClick={() => setReceiptUrl(value)}
            >
              View Receipt
            </button>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
      {
        header: 'Fee Status',
        accessor: 'status',
        render: (_: any, row: FeeApiItem) => {
          const overdue = isOverdue(row);
          const status = overdue ? 'Overdue' : row.status;
          const map: Record<string, string> = {
            Paid: 'bg-green-100 text-green-800',
            Pending: 'bg-yellow-100 text-yellow-800',
            Overdue: 'bg-red-100 text-red-800',
            Rejected: 'bg-gray-100 text-gray-800',
          };
          const cls = map[status] ?? 'bg-gray-100 text-gray-700';
          return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{status}</span>;
        },
      },
      {
        header: 'Approved By',
        accessor: 'approvedBy',
        render: (v: string) => v ?? '—',
      },
      {
        header: 'Approved At',
        accessor: 'approvedAt',
        render: (v: string) => (v ? fmtDate(v) : '—'),
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
                    className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-green-50"
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

  return (
    <main className="bg-[#F9FAFB] p-6 text-gray-800">
      <PageHeader title="Fee Approval" description="Review and approve student fee submissions" />

      {/* Filters */}
      <div className="bg-white border rounded-md p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Month</label>
            <select
              value={month}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
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
            <label className="text-sm text-gray-600">Year</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Course (limit=2, with optional load more) */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Course</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm min-w-[220px]"
            >
              <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Show a tiny "Load more" if backend has more pages */}
            {courseHasMore && (
              <button
                type="button"
                onClick={() => loadCourses(coursePage + 1)}
                className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                disabled={loadingCourses}
                title="Load more courses"
              >
                {loadingCourses ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="p-4 rounded-md shadow-sm border bg-white">
            <div className="text-sm text-gray-500 flex justify-between items-center">
              {s.label}
              {s.icon}
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table (server-driven) */}
      <div className="bg-white rounded-md shadow-md">
        {loading && <p className="px-4 py-2 text-sm text-gray-500">Loading fees…</p>}
        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
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
            <iframe
              src={receiptUrl}
              className="w-full h-[70vh] border rounded"
              title="Receipt"
            />
            <div className="mt-2 text-right">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve confirm */}
      {approveId && (
        <ConfirmationModal
          title="Approve Fee"
          description="Are you sure you want to approve this fee submission?"
          onCancel={() => setApproveId(null)}
          onConfirm={() => approveFee(approveId)}
        />
      )}

      {/* Reject confirm */}
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
