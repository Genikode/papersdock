'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import {
  Calendar,
  ExternalLink as ExternalLinkIcon,
  Link as LinkIcon,
  Video,
  Search,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

/* =========================
   Types (as per your API)
========================= */
type ExternalLinkItem = {
  id: string;
  title: string;
  url: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ExternalLinksResponse = {
  status: number;
  success: boolean;
  message: string;
  data: ExternalLinkItem[];
};

/* =========================
   Helpers
========================= */
function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
}

function isZoomLike(title?: string, url?: string) {
  const t = (title || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return t.includes('zoom') || u.includes('zoom.us') || u.includes('meet.google') || u.includes('teams.microsoft');
}

/* =========================
   Main Page
========================= */
export default function StudentZoomLinksPage() {
  // Data
  const [links, setLinks] = useState<ExternalLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [onlyZoom, setOnlyZoom] = useState(true); // default to just Zoom-like links
  const [courseId, setCourseId] = useState('');

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // UI
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch links (student view)
  async function fetchLinks() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ExternalLinksResponse>('/external-links/student/get-all-links');
      const list = Array.isArray(res?.data) ? res.data : [];
      setLinks(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load links');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  // Build course list from data (for filter dropdown)
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    links.forEach((l) => {
      if (l.courseId) {
        map.set(l.courseId, l.courseName || l.courseId);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [links]);

  // Apply filters + pagination
  const filtered = useMemo(() => {
    let arr = [...links];

    if (onlyZoom) {
      arr = arr.filter((l) => isZoomLike(l.title, l.url));
    }

    if (courseId) {
      arr = arr.filter((l) => l.courseId === courseId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (l) =>
          (l.title || '').toLowerCase().includes(q) ||
          (l.description || '').toLowerCase().includes(q) ||
          (l.courseName || '').toLowerCase().includes(q)
      );
    }

    // Sort newest first (optional, looks nice for students)
    arr.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });

    return arr;
  }, [links, onlyZoom, courseId, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageData = filtered.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    // reset to page 1 whenever filters change
    setPage(1);
  }, [search, onlyZoom, courseId, limit]);

  // Actions
  async function copyLink(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // no-op
    }
  }

  return (
    <main className="bg-[#F9FAFB] min-h-screen text-gray-800">
      <div className="px-3 sm:px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          title="Live Class Links"
          description="Join your live sessions quickly. Filter by course, search, and tap to join."
        />

        {/* Filters Bar */}
        <div className="bg-white border rounded-md p-3 sm:p-4 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            {/* Only Zoom toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-indigo-600"
                checked={onlyZoom}
                onChange={(e) => setOnlyZoom(e.target.checked)}
              />
              Show Zoom/Meet links only
            </label>

            {/* Course filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Course</span>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="border rounded px-2 py-2 sm:py-1.5 text-sm min-w-[12rem]"
              >
                <option value="">All courses</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded px-2 py-2 sm:py-1.5 text-sm"
              >
                {[6, 12, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Search box (push to end on md+) */}
            <div className="relative w-full md:ml-auto md:w-72">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search links…"
                className="border rounded pl-8 pr-3 py-2 sm:py-1.5 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-md shadow border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-5" />
                <div className="h-9 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageData.map((l) => {
                const zoomLike = isZoomLike(l.title, l.url);
                return (
                  <div
                    key={l.id}
                    className="bg-white rounded-md shadow border p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-sm font-semibold text-gray-900 truncate">
                            {l.title || 'Link'}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {l.description || '—'}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {l.courseName || '—'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
                        {zoomLike ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            <Video size={14} /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-0.5 rounded-full">
                            <LinkIcon size={14} /> Link
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} /> {fmtDate(l.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded border hover:bg-gray-50"
                      >
                        <ExternalLinkIcon size={14} />
                        {zoomLike ? 'Join' : 'Open'}
                      </a>
                      <button
                        onClick={() => copyLink(l.id, l.url)}
                        className="inline-flex items-center justify-center gap-2 text-xs px-3 py-2 rounded border hover:bg-gray-50"
                      >
                        {copiedId === l.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === l.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty */}
            {pageData.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-10">
                No links found. Try changing filters or search.
              </div>
            )}

            {/* Pagination */}
            {total > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <span>
                  Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1.5 border rounded ${
                          page === i + 1 ? 'bg-gray-200 font-semibold' : ''
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
