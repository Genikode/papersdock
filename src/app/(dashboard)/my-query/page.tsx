'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Globe, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

/* ===================== API Types ===================== */

type Yn = 'Y' | 'N';

type QueryApiItem = {
  id: string;
  title: string;
  text: string;
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  isPublic: Yn;
  isClosed: Yn;
  replyCount: number;
};

type ListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: QueryApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* ===================== UI Types ====================== */

type Status = 'pending' | 'resolved';

type QueryItem = {
  id: string;
  title: string;
  body: string;
  status: Status;
  isPublic: Yn;
  replyCount: number;
};

/* ===================== Small bits ==================== */

function StatusBadge({ status }: { status: Status }) {
  const map =
    status === 'resolved'
      ? { text: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
      : { text: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        map.cls
      )}
    >
      {map.text}
    </span>
  );
}

function Card({ item }: { item: QueryItem }) {
  const router = useRouter();
  return (
    <article className="rounded-lg border bg-white p-4 sm:p-5 shadow-[0_1px_0_#eceef1]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-slate-900">{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>

      <p className="mt-3 text-sm text-slate-700">{item.body}</p>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            {item.isPublic === 'Y' ? (
              <>
                <Globe size={14} className="text-emerald-600" /> Public
              </>
            ) : (
              <>
                <Lock size={14} className="text-slate-500" /> Private
              </>
            )}
          </span>
          <span className="text-slate-400">•</span>
          <span>
            {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
          </span>
        </div>

        <button
          className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => router.push(`/view-query/${item.id}`)}
        >
          View
        </button>
      </div>
    </article>
  );
}

/* ===================== Debounce hook ===================== */

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debounced;
}

/* ======================= Page ========================= */

export default function MyQueriesPage() {
  const router = useRouter();

  // server params
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 400);

  // client status filter (API doesn’t provide status filter on student endpoint)
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  // data
  const [itemsRaw, setItemsRaw] = useState<QueryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchList() {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<ListResponse>('/query/student/my-queries', {
        search: search || '',
        page,
        limit,
      });

      const data = res.data ?? [];
      const mapped: QueryItem[] = data.map((q) => ({
        id: q.id,
        title: q.title,
        body: q.text,
        status: q.isClosed === 'Y' ? 'resolved' : 'pending',
        isPublic: q.isPublic,
        replyCount: q.replyCount ?? 0,
      }));

      setItemsRaw(mapped);
      const p = res.pagination ?? { total: mapped.length, page, limit, totalPages: 1 };
      setTotal(p.total);
      setTotalPages(Math.max(1, p.totalPages));
    } catch (e: any) {
      setErr(e?.message || 'Failed to load queries');
      setItemsRaw([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  // reset page on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  // fetch on params change
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  // client-side filter for status
  const items = useMemo(() => {
    if (statusFilter === 'all') return itemsRaw;
    return itemsRaw.filter((x) => x.status === statusFilter);
  }, [itemsRaw, statusFilter]);

  // page “showing” counts (server totals stay accurate; status filter is per-page)
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = total === 0 ? 0 : Math.min(total, (page - 1) * limit + items.length);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">My Queries</h1>

          {/* Add Query */}
          <button
            type="button"
            onClick={() => router.push('/add-query')}
            className="ml-auto rounded-md bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:opacity-95"
          >
            Add Query
          </button>
        </div>

        {/* Filters row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Status filter (client-side) */}
          <div className="flex overflow-hidden rounded-md border bg-white">
            {(['all', 'pending', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                }}
                className={clsx(
                  'px-4 py-2 text-sm capitalize',
                  statusFilter === s ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto w-full min-w-[200px] max-w-sm flex-1 sm:w-auto">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search queries..."
              className="w-full rounded-md border bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
          </div>
        </div>

        {/* Grid */}
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading &&
            Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-4 sm:p-5 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
                <div className="mt-4 h-8 w-28 rounded bg-slate-200" />
              </div>
            ))}

          {!loading && items.map((item) => <Card key={item.id} item={item} />)}

          {!loading && items.length === 0 && (
            <div className="rounded-md border bg-white p-6 text-center text-sm text-slate-500">
              {err ? err : 'No queries found.'}
            </div>
          )}
        </section>

        {/* Footer / pagination */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t pt-4 text-sm text-slate-600 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              className="rounded border bg-white px-2 py-1"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>items</span>
            <span className="hidden sm:inline mx-3 text-slate-300">|</span>
            <span className="hidden sm:inline">
              Showing {startIndex} - {endIndex} of {total}
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 disabled:opacity-50"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {Array.from({ length: totalPages }).slice(0, 3).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  disabled={loading}
                  className={clsx(
                    'rounded-md px-3 py-2',
                    page === n ? 'bg-slate-900 text-white' : 'bg-white border'
                  )}
                >
                  {n}
                </button>
              );
            })}

            <button
              className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 disabled:opacity-50"
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}
