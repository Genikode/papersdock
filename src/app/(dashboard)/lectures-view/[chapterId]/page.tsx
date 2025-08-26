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

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading lectures…</div>}>
      <main className="min-h-screen bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Lectures in Chapter
              </h1>
              <p className="text-sm text-gray-500">
                Browse and play lecture videos for this chapter.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Items:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setItemsPerPage(Number(e.target.value));
                  }}
                >
                  {[6, 12, 24].map((n) => (
                    <option key={n} value={n}>
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
                className="border rounded px-3 py-2 text-sm w-64"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Skeletons */}
            {loading &&
              Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, i) => (
                <div key={i} className="bg-white border rounded shadow-sm p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-1.5" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-full" />
                </div>
              ))}

            {/* Cards */}
            {!loading &&
              pageSlice.map((lec) => {
                const updated = lec.updatedAt && lec.updatedAt !== lec.createdAt;
                return (
                  <div
                    key={lec.id}
                    className="bg-white border rounded shadow-sm p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {lec.title || 'Untitled lecture'}
                        </h3>
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-gray-500"
                          title={updated ? 'Updated' : 'Created'}
                        >
                          <Clock size={12} />
                          {fmtDate(updated ? lec.updatedAt || lec.createdAt : lec.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                        <Film size={12} />
                        <span>{lec.videoUrl ? 'Video available' : 'No video'}</span>
                        {updated && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Updated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => router.push(`/lectures/${lec.id}?tab=video`)}
                        disabled={!lec.videoUrl}
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50"
                        title={lec.videoUrl ? 'Play video' : 'No video available'}
                      >
                        <Play size={14} /> Video
                      </button>

                      {/* Presentation button intentionally not rendered per requirement */}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty state */}
          {!loading && filtered.length === 0 && !error && (
            <div className="text-center text-sm text-gray-500 py-10">
              No lectures found.
            </div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  disabled={loading}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1 ? 'bg-gray-200 font-semibold' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </Suspense>
  );
}
