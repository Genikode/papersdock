'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { api } from '@/lib/api';
import {
  ShieldAlert,
  Search,
  Globe,
  MapPin,
  Network,
  CalendarDays,
  Download,
  Copy,
  Phone,
  User2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from 'lucide-react';

/* =========================
   Types (match your API)
========================= */
type SuspiciousItem = {
  id: string;
  userId: string;
  reason: string;
  cities: string[];
  regions: string[];
  countries: string[];
  ipAddresses: string[];
  reviewed: 0 | 1;          // 0 = unreviewed, 1 = reviewed
  createdAt: string;
  studentName: string;
  contact?: string | null;
  parentsContact?: string | null;
  courseName?: string | null;
};

type SuspiciousResponse = {
  status: number;
  success: boolean;
  message: string;
  data: SuspiciousItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers
========================= */
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
};
const joinList = (arr?: string[]) => (Array.isArray(arr) && arr.length ? arr.join(', ') : '—');

function toCSV(rows: SuspiciousItem[]) {
  const headers = [
    'S.No',
    'Student',
    'Contact',
    'Course',
    'Reason',
    'Cities',
    'Regions',
    'Countries',
    'IPs',
    'Reviewed',
    'Created At',
    'User ID',
    'Record ID',
  ];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      `"${(r.studentName || '').replaceAll('"', '""')}"`,
      `"${(r.contact || '').replaceAll('"', '""')}"`,
      `"${(r.courseName || '').replaceAll('"', '""')}"`,
      `"${(r.reason || '').replaceAll('"', '""')}"`,
      `"${(r.cities || []).join('; ').replaceAll('"', '""')}"`,
      `"${(r.regions || []).join('; ').replaceAll('"', '""')}"`,
      `"${(r.countries || []).join('; ').replaceAll('"', '""')}"`,
      `"${(r.ipAddresses || []).join('; ').replaceAll('"', '""')}"`,
      r.reviewed ? 'Reviewed' : 'Unreviewed',
      `"${fmtDate(r.createdAt).replaceAll('"', '""')}"`,
      r.userId,
      r.id,
    ].join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // noop
  }
}

/* =========================
   Component
========================= */
export default function SuspiciousActivitiesPage() {
  // Server params
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Data
  const [rows, setRows] = useState<SuspiciousItem[]>([]);
  const [total, setTotal] = useState(0);

  // UX
  const [loading, setLoading] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null); // per-row action disable
  const [error, setError] = useState<string | null>(null);

  // Client-side search (student name)
  const [search, setSearch] = useState('');

  // Details modal
  const [active, setActive] = useState<SuspiciousItem | null>(null);

  // Delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<SuspiciousItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SuspiciousResponse>('/suspicious-activities', {
        page,
        limit,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
      setTotal(res.pagination?.total ?? list.length);
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Client-side filter by student name
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.studentName || '').toLowerCase().includes(q));
  }, [rows, search]);

  // S.No mapping for current page view
  const displayRows = useMemo(
    () =>
      filteredRows.map((r, idx) => ({
        ...r,
        sNo: (page - 1) * limit + idx + 1,
      })),
    [filteredRows, page, limit]
  );

  const exportCSV = () => {
    const csv = toCSV(displayRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspicious-activities-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== Compact pagination window: ← 1 2 3 → (centered around current when possible) =====
  function pageWindow(current: number, totalP: number, size = 3): number[] {
    if (totalP <= size) return Array.from({ length: totalP }, (_, i) => i + 1);
    let start = Math.max(1, current - Math.floor(size / 2));
    let end = start + size - 1;
    if (end > totalP) {
      end = totalP;
      start = Math.max(1, end - size + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const pagesToShow = pageWindow(page, totalPages, 3);

  // ===== Review toggle =====
  async function setReviewed(id: string, reviewedBool: boolean) {
    setRowBusy(id);
    setError(null);
    try {
      await api.put(`/suspicious-activities/${id}`, {
        reviewed: reviewedBool ? 'TRUE' : 'FALSE',
      });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, reviewed: reviewedBool ? 1 : 0 } : r))
      );
      setActive((cur) => (cur && cur.id === id ? { ...cur, reviewed: reviewedBool ? 1 : 0 } : cur));
    } catch (e: any) {
      setError(e?.message || 'Failed to update review status');
    } finally {
      setRowBusy(null);
    }
  }

  // ===== Delete (with modal) =====
  function openDeleteModal(item: SuspiciousItem) {
    setConfirmDelete(item);
    setError(null);
  }

  async function confirmDeleteActivity() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;

    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/suspicious-activities/${id}`);

      // Optimistic local removal
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));

      // If we removed the last item on this page, adjust page
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
      if (page > newTotalPages) {
        setPage(newTotalPages);
      } else {
        // Refresh to sync server pagination/meta
        fetchList();
      }

      // Close modals related to this record
      setConfirmDelete(null);
      setActive((cur) => (cur && cur.id === id ? null : cur));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      <PageHeader
        title="Suspicious Activities"
        description="Investigate unusual access patterns and potential account sharing."
      />

      {/* Top inline error (for actions) */}
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 dark:border-red-900/40 rounded bg-red-50 dark:bg-red-950/20 p-3">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by student name…"
              className="border rounded pl-7 pr-3 py-2 text-sm w-full sm:w-72
                         bg-white dark:bg-slate-900
                         border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-slate-400">Per page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-2 text-sm
                         bg-white dark:bg-slate-900
                         border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            const csv = toCSV(displayRows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `suspicious-activities-page-${page}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800
                     bg-white dark:bg-slate-900
                     border-slate-300 dark:border-slate-700
                     text-slate-800 dark:text-slate-200"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Loading note */}
      {loading && <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Loading suspicious activities…</p>}

      {/* Cards list */}
      <div className="space-y-3">
        {displayRows.map((r) => {
          const reviewed = r.reviewed === 1;
          const busy = rowBusy === r.id;

          return (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                      #{r.sNo}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        reviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {reviewed ? 'Reviewed' : 'Unreviewed'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-gray-800 dark:text-slate-200 font-medium">
                    <User2 size={16} />
                    <span className="truncate">{r.studentName || 'Unknown'}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">User ID: {r.userId}</div>
                </div>
                <ShieldAlert className="text-amber-500 shrink-0" size={22} />
              </div>

              <div className="mt-3 text-sm">
                <div className="text-gray-800 dark:text-slate-200 font-medium">Reason</div>
                <div className="text-gray-600 dark:text-slate-400">{r.reason || '—'}</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-500 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-400">
                    <span className="font-medium">Cities:</span> {joinList(r.cities)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-gray-500 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-400">
                    <span className="font-medium">Countries:</span> {joinList(r.countries)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Network size={14} className="text-gray-500 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-400">
                    <span className="font-medium">IPs:</span> {joinList(r.ipAddresses)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-gray-500 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-400">
                    <span className="font-medium">Created:</span> {fmtDate(r.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Review / Unreview */}
                <button
                  disabled={busy}
                  onClick={() => setReviewed(r.id, !reviewed)}
                  className={`inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                              hover:bg-gray-50 dark:hover:bg-slate-800
                              bg-white dark:bg-slate-900
                              border-slate-300 dark:border-slate-700
                              text-slate-800 dark:text-slate-200 disabled:opacity-60`}
                >
                  {reviewed ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                  {reviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}
                </button>

                {/* Delete (opens confirmation modal) */}
                <button
                  disabled={busy}
                  onClick={() => openDeleteModal(r)}
                  className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                             hover:bg-red-50 dark:hover:bg-red-950/30
                             bg-white dark:bg-slate-900
                             border-red-300 dark:border-red-700
                             text-red-600 dark:text-red-400 disabled:opacity-60"
                  title="Delete record"
                >
                  <Trash2 size={14} /> Delete
                </button>

                {/* Call */}
                {r.contact ? (
                  <a
                    href={`tel:${r.contact}`}
                    className="border rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 inline-flex items-center gap-1
                               bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <Phone size={14} /> Call
                  </a>
                ) : null}

                {/* Copy IPs */}
                {r.ipAddresses?.length ? (
                  <button
                    onClick={() => copyToClipboard(r.ipAddresses.join(', '))}
                    className="border rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 inline-flex items-center gap-1
                               bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <Copy size={14} /> Copy IPs
                  </button>
                ) : null}

                {/* Details */}
                <button
                  onClick={() => setActive(r)}
                  className="border rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800
                             bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  Details
                </button>
              </div>
            </div>
          );
        })}

        {!loading && displayRows.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-slate-400 py-10">No suspicious activity found.</div>
        )}
      </div>

      {/* Pagination (compact: ← 1 2 3 →) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600 dark:text-slate-400">
        <span>
          Showing {(page - 1) * limit + (displayRows.length ? 1 : 0)} – {Math.min(page * limit, total)} of {total}
        </span>

        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-2 py-1.5 border rounded disabled:opacity-50
                       bg-white dark:bg-slate-900
                       border-slate-300 dark:border-slate-700
                       text-slate-800 dark:text-slate-200
                       hover:bg-gray-50 dark:hover:bg-slate-800"
            aria-label="Previous page"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Numbers (max 3) */}
          {pagesToShow.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={loading}
              className={`px-3 py-1.5 border rounded
                          bg-white dark:bg-slate-900
                          border-slate-300 dark:border-slate-700
                          text-slate-800 dark:text-slate-200
                          hover:bg-gray-50 dark:hover:bg-slate-800
                          ${page === p ? 'bg-gray-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-white' : ''}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-2 py-1.5 border rounded disabled:opacity-50
                       bg-white dark:bg-slate-900
                       border-slate-300 dark:border-slate-700
                       text-slate-800 dark:text-slate-200
                       hover:bg-gray-50 dark:hover:bg-slate-800"
            aria-label="Next page"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {active && (
        <Modal title={`Suspicious Details — ${active.studentName || 'Unknown'}`} onClose={() => setActive(null)}>
          <div className="space-y-3 text-sm text-gray-800 dark:text-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500 dark:text-slate-400">Student</div>
                <div className="font-medium">{active.studentName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400">User ID</div>
                <div className="font-mono text-xs">{active.userId}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400">Contact</div>
                <div>{active.contact || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400">Course</div>
                <div>{active.courseName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400">Status</div>
                <div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      active.reviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {active.reviewed ? 'Reviewed' : 'Unreviewed'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400">Created</div>
                <div>{fmtDate(active.createdAt)}</div>
              </div>
            </div>

            <div>
              <div className="text-gray-500 dark:text-slate-400 mb-1">Reason</div>
              <div className="text-gray-800 dark:text-slate-200">{active.reason || '—'}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500 dark:text-slate-400 mb-1">Cities</div>
                <div className="text-gray-800 dark:text-slate-200">{joinList(active.cities)}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400 mb-1">Regions</div>
                <div className="text-gray-800 dark:text-slate-200">{joinList(active.regions)}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400 mb-1">Countries</div>
                <div className="text-gray-800 dark:text-slate-200">{joinList(active.countries)}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-slate-400 mb-1">IP Addresses</div>
                <div className="text-gray-800 dark:text-slate-200 break-words">{joinList(active.ipAddresses)}</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              {/* Review in modal */}
              <button
                onClick={() => setReviewed(active.id, !(active.reviewed === 1))}
                disabled={rowBusy === active.id}
                className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                           hover:bg-gray-50 dark:hover:bg-slate-800
                           bg-white dark:bg-slate-900
                           border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-200 disabled:opacity-60"
              >
                {active.reviewed ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                {active.reviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}
              </button>

              {/* Delete in modal (opens confirm) */}
              <button
                onClick={() => setConfirmDelete(active)}
                disabled={rowBusy === active.id}
                className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                           hover:bg-red-50 dark:hover:bg-red-950/30
                           bg-white dark:bg-slate-900
                           border-red-300 dark:border-red-700
                           text-red-600 dark:text-red-400 disabled:opacity-60"
              >
                <Trash2 size={14} /> Delete
              </button>

              {active.ipAddresses?.length ? (
                <button
                  onClick={() => copyToClipboard(active.ipAddresses.join(', '))}
                  className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800
                             bg-white dark:bg-slate-900
                             border-slate-300 dark:border-slate-700
                             text-slate-800 dark:text-slate-200"
                >
                  <Copy size={14} /> Copy IPs
                </button>
              ) : null}
              {active.contact ? (
                <a
                  href={`tel:${active.contact}`}
                  className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-slate-800
                             bg-white dark:bg-slate-900
                             border-slate-300 dark:border-slate-700
                             text-slate-800 dark:text-slate-200"
                >
                  <Phone size={14} /> Call
                </a>
              ) : null}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal title="Delete suspicious activity?" onClose={() => !deleting && setConfirmDelete(null)}>
          <div className="space-y-3 text-sm text-slate-800 dark:text-slate-200">
            <p>
              You are about to delete the suspicious record for{' '}
              <span className="font-medium">{confirmDelete.studentName || 'Unknown user'}</span>.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs">
              <div><span className="text-slate-500 dark:text-slate-400">Reason:</span> {confirmDelete.reason || '—'}</div>
              <div><span className="text-slate-500 dark:text-slate-400">IPs:</span> {joinList(confirmDelete.ipAddresses)}</div>
              <div><span className="text-slate-500 dark:text-slate-400">Created:</span> {fmtDate(confirmDelete.createdAt)}</div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-60"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded border border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={confirmDeleteActivity}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
