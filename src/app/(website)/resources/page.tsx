'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { BookOpen as BookIcon, Code2, Cog, DatabaseZap } from 'lucide-react';

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
  paper?: string;
  courseName?: string;
  backgroundImageUrl?: string;
  attachmentUrl?: string;
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
  const [mode, setMode] = useState<'' | 'dark' | 'light'>('');

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
        paper: selectedPaper || undefined,
        attachmentType: mode, // dark or light assets filter
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
    <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-3 justify-center">
      <div className="w-full sm:w-auto flex items-center gap-2 justify-center">
        <label className="text-sm text-slate-600 dark:text-slate-400">Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'dark' | 'light' | '')}
          className="w-full sm:w-44 border border-slate-300 dark:border-slate-700 rounded-md text-sm px-3 py-2
                     bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
      </select>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="px-3 sm:px-4 py-10 sm:py-16 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium
                       bg-slate-100 text-slate-600
                       dark:bg-slate-800/70 dark:text-slate-300 mb-4"
          >
            🚀 <span>Complete Learning Resources</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4">
            Master Every Topic
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
           Comprehensive resources for all A-Level Computer Science papers, from theory fundamentals to practical applications. Each set of notes is paired with topical past papers and their corresponding marking schemes for complete preparation. 
          </p>
        </div>

        {/* Category tabs (centered) */}
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 text-center sm:text-left">
          <div className="w-full sm:w-auto">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {selectedPaper
                ? `Resources for ${categories.find((c) => c.id === selectedPaper)?.title ?? selectedPaper}`
                : 'All Resources'}
            </h2>
          </div>

          {headingRight}
        </div>

        {/* Error / loading states */}
        {error && (
          <div
            className="mx-auto max-w-xl mb-6 text-sm text-red-700 dark:text-red-400
                        border border-red-200 dark:border-red-800
                        rounded p-3 bg-red-50 dark:bg-red-950/40 text-center"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div
                key={i}
                className="w-full max-w-[20rem] mx-auto border rounded shadow-sm p-4 animate-pulse
                           bg-white border-slate-200
                           dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="h-4 rounded w-2/3 mb-3 bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 rounded w-1/3 mb-1.5 bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 rounded w-1/4 mb-4 bg-slate-200 dark:bg-slate-700" />
                <div className="h-8 rounded w-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {/* Cards grid (mobile centered) */}
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
                  className={clsx(
                    'block text-left transition mx-auto w-full max-w-[20rem]',
                    !clickable && 'opacity-90'
                  )}
                  title={clickable ? 'Open note' : 'No attachment'}
                  aria-label={clickable ? `Open ${note.title}` : `${note.title} (no file)`}
                  tabIndex={0}
                >
                  <FilteredResourceBox
                    tag={note.paper || ''}
                    title={note.title}
                    category={note.courseName || ''}
                    type={(note.attachmentExtension || 'Notes').toUpperCase()}
                    imageUrl={note.backgroundImageUrl || FALLBACK_IMG}
                  />
                </Wrapper>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
            No notes found.
          </div>
        )}

        {/* Pagination (centered; buttons full-width on mobile) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <span className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Showing {(page - 1) * limit + (rows.length ? 1 : 0)} – {Math.min(page * limit, total)} of {total}
          </span>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={clsx(
                'w-full sm:w-auto px-3 py-2 rounded-md border text-sm transition',
                page === 1
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              &lt; Previous
            </button>

            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const active = page === i + 1;
                return (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    aria-current={active ? 'page' : undefined}
                    className={clsx(
                      'px-3 py-1.5 rounded-md border text-sm transition',
                      active
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={clsx(
                'w-full sm:w-auto px-3 py-2 rounded-md border text-sm transition',
                page === totalPages
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Keep it full width; it already adapts to theme */}
      <AiLogicChecker />
    </div>
  );
}
