'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { BookOpen as BookIcon, Code2, Cog, DatabaseZap, ExternalLink } from 'lucide-react';

import FilteredResourceBox from '@/components/FilterNotes';
import CategoryTabs from '@/components/categories';
import AiLogicChecker from '../../sections/AiLogicChecker';
import { api } from '@/lib/api';

/* =========================
   API Types
========================= */
type NoteItem = {
  id: string;
  title: string;
  paper?: string;                // "Paper 1", "Paper 2", ...
  courseName?: string;
  backgroundImageUrl?: string;   // card image
  attachmentUrl?: string;        // open this in a new tab
  attachmentType?: 'dark' | 'light' | '' | string;
  attachmentExtension?: string;
  createdAt?: string;
};

type NotesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: NoteItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Category -> paper mapping
========================= */
const categories = [
  { id: 'Paper 1', title: 'Theory Fundamentals', count: 0, icon: <BookIcon size={18} /> },
  { id: 'Paper 2', title: 'Problem Solving Skills', count: 0, icon: <Code2 size={18} /> },
  { id: 'Paper 3', title: 'Advanced Theory', count: 0, icon: <Cog size={18} /> },
  { id: 'Paper 4', title: 'Practical Applications', count: 0, icon: <DatabaseZap size={18} /> },
];

/* A pleasant fallback image if a note has no background image */
const FALLBACK_IMG = '/background-trial.jpeg';

export default function ResourcesPage() {
  // Filters / state
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [mode, setMode] = useState<''|'dark' | 'light'>('');

  // Server pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  // Data
  const [rows, setRows] = useState<NoteItem[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // UX
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Fetch notes from backend with paper filter */
  async function fetchNotes() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<NotesResponse>('/notes/public/get-all-notes', {
        page,
        limit,
        paper: selectedPaper || undefined, // omit when "All"
        attachmentType: mode, // dark or light
      });

      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
      setTotal(res.pagination?.total ?? list.length);
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      setError(e?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, selectedPaper, mode]);

  const headingRight = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'dark' | 'light')}
          className="border border-gray-300 rounded-md text-sm px-3 py-2"
        >
          <option value="">All</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>

     
    </div>
  );

  return (
    <div className={mode === 'dark' ? 'bg-white' : 'bg-white'}>
      <div className="px-4 py-12 sm:py-16 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mb-4">
            🚀 <span>Complete Learning Resources</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Master Every Topic
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive resources for all A-Level Computer Science papers. From theory fundamentals
            to practical applications.
          </p>
        </div>

        {/* Category tabs (controls the `paper` query) */}
        <div className="flex flex-wrap justify-center mb-8">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedPaper}
            onSelect={(id: string | null) => {
              setSelectedPaper(id);
              setPage(1);
            }}
          />
        </div>

        {/* Heading + controls */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedPaper
                ? `Resources for ${categories.find((c) => c.id === selectedPaper)?.title ?? selectedPaper}`
                : 'All Resources'}
            </h2>
        
          </div>

          {headingRight}
        </div>

        {/* Error / loading states */}
        {error && (
          <div className="mb-4 text-sm text-red-600 border border-red-200 rounded p-3 bg-red-50">
            {error}
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div key={i} className="bg-white border rounded shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-1.5" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Cards grid */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {rows.map((note) => {
              const clickable = Boolean(note.attachmentUrl);
              const Wrapper: React.ElementType = clickable ? 'a' : 'div';
              const wrapperProps = clickable
                ? { href: note.attachmentUrl, target: '_blank', rel: 'noopener noreferrer' }
                : {};

              return (
                <Wrapper
                  key={note.id}
                  {...wrapperProps}
                  className={clsx('block text-left', !clickable && 'opacity-90')}
                  title={clickable ? 'Open note' : 'No attachment'}
                  aria-label={clickable ? `Open ${note.title}` : `${note.title} (no file)`}
                >
                  <FilteredResourceBox
                    tag={note.paper || ''}
                    title={note.title}
                    category={note.courseName || ''}
                    type={(note.attachmentExtension || 'Notes').toUpperCase()}
                    imageUrl={note.backgroundImageUrl || FALLBACK_IMG}
                  />
                  {/* Small footer row for accessibility cue */}
                 
                </Wrapper>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-10">No notes found.</div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <span className="text-sm text-gray-600">
            Showing {(page - 1) * limit + (rows.length ? 1 : 0)} – {Math.min(page * limit, total)} of {total}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={clsx(
                'px-3 py-1.5 rounded-md border text-sm',
                page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'
              )}
            >
              &lt; Previous
            </button>

            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md border text-sm',
                    page === i + 1 ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'
                  )}
                  aria-current={page === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={clsx(
                'px-3 py-1.5 rounded-md border text-sm',
                page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'
              )}
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      <AiLogicChecker />
    </div>
  );
}
