'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Play, FileText } from 'lucide-react';

type LectureListItem = {
  id: string;
  lectureTitle: string;
  chapterTitle: string;
  courseTitle: string;
  videoUrl: string;
  presentationUrl: string;
  createdAt: string;
  createdByName?: string;
};

type ListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: LectureListItem[] | { data: LectureListItem[] };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

function normalizeListPayload(payload: ListResponse['data']): LectureListItem[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as any).data)) return (payload as any).data as LectureListItem[];
  return [];
}

export default function ViewLecturesPage() {
  const router = useRouter();
  const qs = useSearchParams();
  const chapterTitleFromQS = qs?.get('chapterTitle') ?? '';

  const [rows, setRows] = useState<LectureListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // server-driven controls
  const [searchTerm, setSearchTerm] = useState<string>(chapterTitleFromQS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [totalItems, setTotalItems] = useState<number>(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  async function fetchLectures() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ListResponse>('/lectures/get-all-lectures', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || '',
      });
      const list = normalizeListPayload(res.data);
      setRows(list);
      setTotalItems(res.pagination?.total ?? list.length);
    } catch (e: any) {
      setRows([]);
      setTotalItems(0);
      setError(e?.message || 'Failed to load lectures');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Lectures</h1>
            <p className="text-sm text-gray-500">Browse and open video or presentation.</p>
          </div>
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
              placeholder="Search lectures or chapters…"
              className="border rounded px-3 py-2 text-sm w-64"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading &&
            Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, i) => (
              <div key={i} className="bg-white border rounded shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-1.5" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            ))}

          {!loading &&
            rows.map((lec) => (
              <div key={lec.id} className="bg-white border rounded shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{lec.lectureTitle}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {lec.courseTitle || '—'}
                    </span>
                    <span className="text-gray-500">Chapter: {lec.chapterTitle || '—'}</span>
                    <span className="text-gray-400">
                      {lec.createdAt ? new Date(lec.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/lectures/${lec.id}?tab=video`)}
                    // disabled={!lec.videoUrl}
                    className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded border
                               hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Play size={14} /> Video
                  </button>
                  <button
                    onClick={() => router.push(`/lectures/${lec.id}?tab=presentation`)}
                    disabled={!lec.presentationUrl}
                    className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded border
                               hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FileText size={14} /> Presentation
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state */}
        {!loading && rows.length === 0 && !error && (
          <div className="text-center text-sm text-gray-500 py-10">No lectures found.</div>
        )}

        {/* Pagination */}
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
      </div>
    </main>
  );
}
