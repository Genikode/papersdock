'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Play, Clock, Film } from 'lucide-react';

/* =========================
   Types (as per your API)
========================= */
type LectureItem = {
  id: string;
  title: string;
  courseId: string;
  chapterId: string;
  videoUrl: string;
  presentationUrl?: string;
  createdAt?: string;
  updatedAt?: string | null;
};

/* =========================
   Page
========================= */
export default function LecturesByChapterPage() {
  const router = useRouter();
  const params = useParams<{ chapterId: string }>();
  const chapterId = typeof params?.chapterId === 'string' ? params.chapterId : '';

  // data + UX
  const [rows, setRows] = useState<LectureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // controls
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  // fetch
  async function fetchLectures() {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ status: number; success: boolean; data: LectureItem[] }>(
        `/lectures/student/get-lectures-by-chapter/${chapterId}`
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Failed to load lectures');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // derived: filter + paginate (client-side; API doesn’t paginate)
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.title || '').toLowerCase().includes(q));
  }, [rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // helpers
  const fmtDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString();
  };

  // for desktop numeric pagination (show up to 7 around current)
  const desktopPages = useMemo(() => {
    const windowSize = 7;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
  <Suspense fallback={<div className="p-6 text-sm text-slate-600 dark:text-slate-400">Loading lectures…</div>}>
  <main className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      >
        &larr; Back
      </button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
            Lectures in Chapter
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse and play lecture videos for this chapter.
          </p>
        </div>

        {/* Controls */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Items:</span>
            <select
              className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900"
              value={itemsPerPage}
              onChange={(e) => {
                setCurrentPage(1);
                setItemsPerPage(Number(e.target.value));
              }}
            >
              {[6, 12, 24].map((n) => (
                <option key={n} value={n} className="bg-white dark:bg-slate-900">
                  {n}
                </option>
              ))}
            </select>
          </div>

          <input
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            placeholder="Search lectures…"
            className="border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm w-full sm:w-64 bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Skeletons */}
        {loading &&
          Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm p-4 animate-pulse"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-1.5" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            </div>
          ))}

        {/* Cards */}
        {!loading &&
          pageSlice.map((lec) => {
            const updated = lec.updatedAt && lec.updatedAt !== lec.createdAt;
            return (
              <div
                key={lec.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {lec.title || 'Untitled lecture'}
                    </h3>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
                      title={updated ? 'Updated' : 'Created'}
                    >
                      <Clock size={12} />
                      {fmtDate(updated ? lec.updatedAt || lec.createdAt : lec.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Film size={12} />
                    <span>{lec.videoUrl ? 'Video available' : 'No video'}</span>
                    {updated && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40">
                        Updated
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/lectures/${lec.id}?tab=video`)}
                    disabled={!lec.videoUrl}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 bg-white dark:bg-slate-900"
                    title={lec.videoUrl ? 'Play video' : 'No video available'}
                  >
                    <Play size={14} /> Video
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">No lectures found.</div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {/* Mobile: compact */}
          <div className="flex w-full items-center justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Desktop: numbered */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Previous
            </button>

            {desktopPages.map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                disabled={loading}
                className={`px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 ${
                  currentPage === n ? 'bg-gray-200 dark:bg-slate-800 font-semibold' : ''
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  </main>
</Suspense>

  );
}
