'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { api } from '@/lib/api';

type Chapter = {
  id: string;
  title: string;
  chapterImageUrl?: string;
  courseName?: string;
  createdAt?: string;
};
type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: { id: string; title: string; fees: number }[];
  pagination?: any;
};
type GetAllChaptersResponse = {
  status: number;
  success: boolean;
  message: string;
  data: Chapter[] | { data: Chapter[] };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

function normalizeListPayload(payload: GetAllChaptersResponse['data']) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as any).data)) return (payload as any).data as Chapter[];
  return [];
}

export default function StudentChaptersPage() {
  const router = useRouter();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<{ id: string; title: string; fees: number }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  async function fetchChapters() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<GetAllChaptersResponse>(
        '/chapters/student/get-all-chapters?',
        { page: currentPage, limit: itemsPerPage, search: searchTerm, courseId: courseId || '' }
      );

      const list = normalizeListPayload(res.data);
      setChapters(list);

      const total =
        res.pagination?.total ??
        (Array.isArray(list) ? list.length : 0);

      setTotalItems(total);
    } catch (e: any) {
      setChapters([]);
      setTotalItems(0);
      setError(e?.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, courseId]);

  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-allowed-courses', {
          page: 1,
          limit: 100,
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  return (
<div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-950">
  <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-slate-100">Chapters</h1>

  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div className="flex items-center gap-2 text-sm">
      <select
        value={courseId}
        onChange={(e) => {
          setCourseId(e.target.value);
        }}
        className="border rounded px-2 py-2 sm:py-1.5 text-sm w-full sm:w-60 md:w-56
                   bg-white text-gray-900 border-gray-300
                   dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
      >
        <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id} className="text-inherit">
            {c.title}
          </option>
        ))}
      </select>
    </div>

    <input
      type="text"
      placeholder="Search Chapters..."
      value={searchTerm}
      onChange={(e) => {
        setCurrentPage(1);
        setSearchTerm(e.target.value);
      }}
      className="border px-3 py-2 rounded text-sm w-64
                 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300
                 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:border-slate-700"
    />
  </div>

  {/* grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {loading && Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow rounded overflow-hidden animate-pulse">
        <div className="w-full h-40 bg-gray-200 dark:bg-slate-800/60" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-800/60 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-slate-800/60 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-slate-800/60 rounded w-2/3" />
        </div>
      </div>
    ))}

    {!loading && chapters.map((c) => (
      <div key={c.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow rounded overflow-hidden">
        {/* ✅ Full image visible (no crop) */}
        <div className="w-full h-48 sm:h-56 bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          <img
            src={c.chapterImageUrl || '/placeholder.png'}
            alt={c.title}
            className="max-h-full max-w-full object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
          />
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{c.title}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">{c.courseName || '—'}</p>
          {c.createdAt && (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400 dark:text-slate-500">Chapter</span>
            <button
              onClick={() => router.push(`/lectures-view/${c.id}`)}
              className="bg-gray-900 text-white px-3 py-1 text-xs rounded flex items-center gap-1 cursor-pointer
                         hover:opacity-90
                         dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Play size={14} />
              Show Lectures
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* empty state */}
  {!loading && chapters.length === 0 && !error && (
    <div className="text-center text-sm text-gray-500 dark:text-slate-400 py-10">
      No chapters found.
    </div>
  )}

  {/* error */}
  {error && (
    <div className="text-center text-sm text-red-600 py-6">
      {error}
    </div>
  )}

  {/* Pagination */}
  <div className="mt-6 flex flex-wrap justify-center gap-2">
    <button
      disabled={currentPage === 1 || loading}
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      className="px-3 py-1 border rounded disabled:opacity-50
                 bg-white border-gray-300 text-gray-800
                 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
    >
      Previous
    </button>
    {Array.from({ length: totalPages }).map((_, idx) => (
      <button
        key={idx}
        onClick={() => setCurrentPage(idx + 1)}
        disabled={loading}
        className={`px-3 py-1 border rounded
                    bg-white border-gray-300 text-gray-800
                    dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
                    ${currentPage === idx + 1 ? 'bg-gray-200 dark:bg-slate-800 font-semibold' : ''}`}
      >
        {idx + 1}
      </button>
    ))}
    <button
      disabled={currentPage === totalPages || loading}
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      className="px-3 py-1 border rounded disabled:opacity-50
                 bg-white border-gray-300 text-gray-800
                 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
    >
      Next
    </button>
  </div>
</div>

  );
}
