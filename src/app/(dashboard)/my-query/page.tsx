'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LogOut,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
type Status = 'pending' | 'resolved';
type QueryItem = {
  id: string;
  title: string;
  paper: string;
  chapter: string;
  body: string;
  due: string; // MM/DD/YYYY
  status: Status;
};

const MOCK: QueryItem[] = [
  {
    id: '1',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'resolved',
  },
  {
    id: '3',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '5',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '6',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '7',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '8',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '9',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '10',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '11',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
  {
    id: '12',
    title: 'Help with Binary Search Algorithm',
    paper: 'AS',
    chapter: 'AD',
    body: 'Can you explain the time complexity?',
    due: '1/25/2024',
    status: 'pending',
  },
];

function StatusBadge({ status }: { status: Status }) {
  const map = {
    pending: { text: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    resolved: { text: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  }[status];

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

      <div className="mt-2 grid grid-cols-2 gap-x-4 text-xs text-slate-600 max-[420px]:grid-cols-1">
        <div>Paper: <span className="font-medium">{item.paper}</span></div>
        <div>Chapter: <span className="font-medium">{item.chapter}</span></div>
      </div>

      <p className="mt-3 text-sm text-slate-700">{item.body}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">Due: {item.due}</div>
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

export default function MyQueriesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filtered = useMemo(() => {
    const base =
      statusFilter === 'all'
        ? MOCK
        : MOCK.filter((x) => x.status === statusFilter);

    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.body.toLowerCase().includes(q) ||
        x.paper.toLowerCase().includes(q) ||
        x.chapter.toLowerCase().includes(q)
    );
  }, [statusFilter, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * limit;
  const pageItems = filtered.slice(startIndex, startIndex + limit);
    const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar (content area header) */}
    

      {/* Page body */}
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">My Queries</h1>

        {/* Filters row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
           className='rounded-md bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:opacity-95'
          onClick={()=>router.push('/add-query')}
          >
           Add Query
          </button>

          <div className="flex overflow-hidden rounded-md border bg-white">
            {(['all', 'pending', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={clsx(
                  'px-4 py-2 text-sm capitalize',
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative ml-auto w-full min-w-[200px] max-w-sm flex-1 sm:w-auto">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search queries..."
              className="w-full rounded-md border bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
          </div>
        </div>

        {/* Card grid */}
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pageItems.map((item) => (
            <Card key={item.id} item={item} />
          ))}
          {pageItems.length === 0 && (
            <div className="rounded-md border bg-white p-6 text-center text-sm text-slate-500">
              No queries match your filters.
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
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            >
              {[10, 20, 30].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>items</span>
            <span className="hidden sm:inline mx-3 text-slate-300">|</span>
            <span className="hidden sm:inline">
              Showing {Math.min(total, startIndex + 1)} - {Math.min(total, startIndex + pageItems.length)} out of {total} queries
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 disabled:opacity-50"
              disabled={clampedPage === 1}
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
                  className={clsx(
                    'rounded-md px-3 py-2',
                    clampedPage === n ? 'bg-slate-900 text-white' : 'bg-white border'
                  )}
                >
                  {n}
                </button>
              );
            })}

            <button
              className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 disabled:opacity-50"
              disabled={clampedPage === totalPages}
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
