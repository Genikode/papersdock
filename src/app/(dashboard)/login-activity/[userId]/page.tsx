'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import {
  Globe,
  MapPin,
  Network,
  CalendarDays,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Fingerprint,
  MonitorSmartphone,
} from 'lucide-react';

/* =========================
   Types (match your API)
========================= */
type LoginLog = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  city: string | null;
  region: string | null;
  country: string | null;
  createdAt: string;
};

type LogsResponse = {
  status: number;
  success: boolean;
  message: string;
  data: LoginLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers
========================= */
const fmtDateTime = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const truncate = (t: string, n = 60) => (t.length > n ? t.slice(0, n) + '…' : t);

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function toCSV(rows: LoginLog[]) {
  const headers = ['S.No', 'IP', 'User Agent', 'City', 'Region', 'Country', 'Created', 'User ID', 'Record ID'];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      r.ipAddress,
      `"${(r.userAgent || '').replaceAll('"', '""')}"`,
      r.city ?? '',
      r.region ?? '',
      r.country ?? '',
      fmtDateTime(r.createdAt),
      r.userId,
      r.id,
    ].join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

/* =========================
   Page
========================= */
export default function LoginHistoryPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();

  const userId = params?.userId;
  const userNameParam = searchParams?.get('userName') || '';
  const userName = userNameParam ? decodeURIComponent(userNameParam) : '';

  // server params
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // data
  const [rows, setRows] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);

  // ux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search (client-side convenience — filters logs by IP/city/country/UA)
  const [search, setSearch] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function fetchLogs() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LogsResponse>(`/login-logs/${userId}`, { page, limit });
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
      setTotal(res.pagination?.total ?? list.length);
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      setError(e?.message || 'Failed to load login history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, limit]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const bucket = [
        r.ipAddress,
        r.userAgent,
        r.city ?? '',
        r.region ?? '',
        r.country ?? '',
        fmtDateTime(r.createdAt),
      ]
        .join(' ')
        .toLowerCase();
      return bucket.includes(q);
    });
  }, [rows, search]);

  const display = useMemo(
    () =>
      filtered.map((r, idx) => ({
        ...r,
        sNo: (page - 1) * limit + idx + 1,
      })),
    [filtered, page, limit]
  );

  const exportCSV = () => {
    const csv = toCSV(display);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-history-${userName || userId}-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Compact numbers: show up to 3 buttons centered around current page
  const pageWindow = (current: number, totalP: number, size = 3): number[] => {
    if (totalP <= size) return Array.from({ length: totalP }, (_, i) => i + 1);
    let start = Math.max(1, current - Math.floor(size / 2));
    let end = Math.min(totalP, start + size - 1);
    if (end - start + 1 < size) start = Math.max(1, end - size + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const pageNums = pageWindow(page, totalPages, 3);

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <PageHeader
        title="Login Activity"
        description={`User: ${userName || userId || '—'}`}
      />

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search IP / device / location…"
            className="border rounded px-3 py-2 text-sm w-full sm:w-72
                       bg-white dark:bg-slate-900
                       border-slate-300 dark:border-slate-700
                       text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Per page</span>
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
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm
                     bg-white dark:bg-slate-900
                     border-slate-300 dark:border-slate-700
                     text-slate-800 dark:text-slate-200
                     hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 dark:border-red-900/40 rounded bg-red-50 dark:bg-red-950/20 p-3">
          {error}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {display.map((log) => (
          <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">#{log.sNo}</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                    <Network size={14} />
                    {log.ipAddress}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <CalendarDays size={14} />
                  {fmtDateTime(log.createdAt)}
                </div>
              </div>
              <Fingerprint className="text-slate-400" size={20} />
            </div>

            {/* Location */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                <MapPin size={14} />
                {log.city || 'Unknown'}
              </div>
              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                <Globe size={14} />
                {log.region || '—'}
              </div>
              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                <Globe size={14} />
                {log.country || '—'}
              </div>
            </div>

            {/* UA */}
            <div className="mt-1 text-sm">
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Device / User Agent</div>
              <div className="inline-flex items-start gap-2">
                <MonitorSmartphone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-800 dark:text-slate-200" title={log.userAgent}>
                  {truncate(log.userAgent || '—')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => copyToClipboard(log.ipAddress)}
                className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                           bg-white dark:bg-slate-900
                           border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-200
                           hover:bg-gray-50 dark:hover:bg-slate-800"
                title="Copy IP"
              >
                <Copy size={14} /> Copy IP
              </button>
              <button
                onClick={() => copyToClipboard(log.userAgent || '')}
                className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-xs
                           bg-white dark:bg-slate-900
                           border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-200
                           hover:bg-gray-50 dark:hover:bg-slate-800"
                title="Copy User Agent"
              >
                <Copy size={14} /> Copy UA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && display.length === 0 && !error && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">No login logs found.</div>
      )}

      {/* Pagination: ← 1 2 3 → */}
      <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          Showing {(page - 1) * limit + (display.length ? 1 : 0)} – {Math.min(page * limit, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 border rounded disabled:opacity-50
                       bg-white dark:bg-slate-900
                       border-slate-300 dark:border-slate-700
                       text-slate-800 dark:text-slate-200
                       hover:bg-gray-50 dark:hover:bg-slate-800"
            aria-label="Previous page"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNums.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              disabled={loading}
              className={`px-3 py-1.5 border rounded
                          bg-white dark:bg-slate-900
                          border-slate-300 dark:border-slate-700
                          text-slate-800 dark:text-slate-200
                          hover:bg-gray-50 dark:hover:bg-slate-800
                          ${page === n ? 'bg-gray-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-white' : ''}`}
              aria-current={page === n ? 'page' : undefined}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-1.5 border rounded disabled:opacity-50
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
    </main>
  );
}
