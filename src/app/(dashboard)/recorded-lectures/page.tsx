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
  data: { id: string; title: string; fees: number;  }[];
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

  // server-driven table/grid state
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

  // fetch chapters
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
        // fallback if pagination not returned
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Chapters</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
        <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
               
                }}
                className="border rounded px-2 py-2 sm:py-1.5 text-sm w-full sm:w-60 md:w-56"
              >
                <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
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
          className="border px-3 py-2 rounded text-sm w-64"
        />
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, i) => (
          <div key={i} className="bg-white shadow rounded overflow-hidden animate-pulse">
            <div className="w-full h-32 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}

        {!loading && chapters.map((c) => (
          <div key={c.id} className="bg-white shadow rounded overflow-hidden">
            <img
              src={c.chapterImageUrl || '/placeholder.png'}
              alt={c.title}
              className="w-full h-32 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
            />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-800">{c.title}</h2>
              <p className="text-xs text-gray-500">{c.courseName || '—'}</p>
              {c.createdAt && (
                <p className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400">Chapter</span>
                <button
                  onClick={() =>
                    router.push(`/lectures-view/${c.id}`)
                  }
                  className="bg-gray-800 text-white px-3 py-1 text-xs rounded flex items-center gap-1 cursor-pointer "
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
        <div className="text-center text-sm text-gray-500 py-10">
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
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            disabled={loading}
            className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? 'bg-gray-200 font-semibold' : ''}`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages || loading}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
