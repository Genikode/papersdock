'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

/* ========= Types from your API ========= */
type NoteApiItem = {
  id: string;
  title: string;
  backgroundImageUrl?: string;
  attachmentUrl?: string;
  attachmentType?: 'dark' | 'light' | string;
  attachmentExtension?: string; // 'pdf', 'png', ...
  courseId?: string;
  webNote?: 'Y' | 'N';
  courseName?: string;
  createdByName?: string;
  paper?: string;
};

type NotesListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: NoteApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* ========= Helpers ========= */
const isImageExt = (ext?: string) =>
  !!ext && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext.toLowerCase());

const isPdfExt = (ext?: string) => (ext || '').toLowerCase() === 'pdf';

/* ========= Lightweight inline Modal ========= */
function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
<div className="fixed inset-0 z-[9999] bg-black/50 dark:bg-black/60 flex items-center justify-center p-4">
  <div className="w-full max-w-4xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title || 'Preview'}
      </h3>
      <button
        onClick={onClose}
        className="p-1 rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950">
      {children}
    </div>
  </div>
</div>

  );
}

/* ========= Page ========= */
export default function StudyNotesPage() {
  // server-driven pagination + search
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [paper, setPaper] = useState<'' | 'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4'>('');

  // Light/Dark filter (client-side)
  const [modeFilter, setModeFilter] = useState<'' | 'light' | 'dark'>('');

  // data
  const [items, setItems] = useState<NoteApiItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // modal state
  const [previewKind, setPreviewKind] = useState<'image' | 'attachment' | null>(null);
  const [previewNote, setPreviewNote] = useState<NoteApiItem | null>(null);

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await api.get<NotesListResponse>('/notes/get-all-notes', {
        page,
        limit,
        paper: paper || '',
        search: search || '',
      });
      setItems(res.data || []);
      setTotal(res.pagination?.total ?? (res.data?.length ?? 0));
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search , paper]);

  // apply client-only mode filter (light/dark) on the current page
  const filteredItems = useMemo(() => {
    if (!modeFilter) return items;
    return items.filter((n) => (n.attachmentType || '').toLowerCase() === modeFilter);
  }, [items, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function openImage(note: NoteApiItem) {
    setPreviewNote(note);
    setPreviewKind('image');
  }
  function openAttachment(note: NoteApiItem) {
    setPreviewNote(note);
    setPreviewKind('attachment');
  }
  function closeModal() {
    setPreviewNote(null);
    setPreviewKind(null);
  }

  return (
   <main className="min-h-screen px-6 py-8 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <PageHeader title="Study Notes" description="Browse and view your notes" />

  {/* Filters row */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
    <div className="flex gap-3">
      {/* mode filter */}
      <select
        className="border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 py-2"
        value={modeFilter}
        onChange={(e) => {
          setModeFilter(e.target.value as '' | 'light' | 'dark');
        }}
      >
        <option value="" className="bg-white dark:bg-slate-900">All (Light/Dark)</option>
        <option value="light" className="bg-white dark:bg-slate-900">Light only</option>
        <option value="dark" className="bg-white dark:bg-slate-900">Dark only</option>
      </select>

      <select
        className="border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 py-2"
        value={paper}
        onChange={(e) => {
          setPaper(e.target.value as '' | 'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4');
        }}
      >
        <option value="" className="bg-white dark:bg-slate-900">All Papers</option>
        <option value="Paper 1" className="bg-white dark:bg-slate-900">Paper 1</option>
        <option value="Paper 2" className="bg-white dark:bg-slate-900">Paper 2</option>
        <option value="Paper 3" className="bg-white dark:bg-slate-900">Paper 3</option>
        <option value="Paper 4" className="bg-white dark:bg-slate-900">Paper 4</option>
      </select>
    </div>

    {/* search */}
    <input
      type="text"
      placeholder="Search notes..."
      className="border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 w-full sm:w-64"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
    />
  </div>

  {/* Loading */}
  {loading && (
    <div className="mb-3 text-sm text-slate-500 dark:text-slate-400">Loading notes…</div>
  )}

  {/* Grid */}
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
    {filteredItems.map((note) => (
      <div key={note.id} className="bg-white dark:bg-slate-900 rounded shadow border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Image header */}
        <div className="w-full h-36 bg-gray-100 dark:bg-slate-800">
          {note.backgroundImageUrl ? (
            <img
              src={note.backgroundImageUrl}
              alt={note.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
              No image
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</h3>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Course: <span className="font-medium text-slate-700 dark:text-slate-200">{note.courseName || '—'}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mode: <span className="font-medium text-slate-700 dark:text-slate-200">{note.attachmentType || '—'}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="text-xs border border-slate-300 dark:border-slate-700 px-3 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              onClick={() => openAttachment(note)}
              disabled={!note.attachmentUrl}
              title={note.attachmentUrl ? 'View Attachment' : 'No attachment available'}
            >
              View Attachment
            </button>
          </div>
        </div>
      </div>
    ))}

    {!loading && filteredItems.length === 0 && (
      <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">
        No notes found on this page.
      </div>
    )}
  </div>

  {/* Pagination */}
  <div className="flex justify-between items-center mt-6 text-sm text-slate-600 dark:text-slate-300">
    <span>
      Page {page} of {totalPages} • Total {total}
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }).map((_, idx) => (
        <button
          key={idx}
          onClick={() => setPage(idx + 1)}
          className={`px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 ${page === idx + 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 font-semibold' : ''}`}
        >
          {idx + 1}
        </button>
      ))}
      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>

  {/* Image Modal */}
  {previewKind === 'image' && previewNote && (
    <Modal title={previewNote.title || 'Note Image'} onClose={closeModal}>
      <div className="p-4">
        {previewNote.backgroundImageUrl ? (
          <>
            <img
              src={previewNote.backgroundImageUrl}
              alt={previewNote.title}
              className="max-h-[70vh] mx-auto rounded border border-slate-200 dark:border-slate-700"
            />
            <div className="mt-3 text-right px-1">
              <a
                href={previewNote.backgroundImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 dark:text-indigo-400 underline"
              >
                Open image in new tab
              </a>
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-slate-600 dark:text-slate-400">No image available.</div>
        )}
      </div>
    </Modal>
  )}

  {/* Attachment Modal (PDF/Image support) */}
  {previewKind === 'attachment' && previewNote && (
    <Modal title={previewNote.title || 'Attachment'} onClose={closeModal}>
      <div className="p-3">
        {!previewNote.attachmentUrl ? (
          <div className="p-6 text-sm text-slate-600 dark:text-slate-400">No attachment available.</div>
        ) : isPdfExt(previewNote.attachmentExtension) ? (
          <div className="h-[70vh]">
            <object
              data={previewNote.attachmentUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={previewNote.attachmentUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </object>
          </div>
        ) : isImageExt(previewNote.attachmentExtension) ? (
          <div className="p-1">
            <img
              src={previewNote.attachmentUrl}
              alt={previewNote.title}
              className="max-h-[70vh] mx-auto rounded border border-slate-200 dark:border-slate-700"
            />
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-700 dark:text-slate-300">
            Preview not supported for this file type. Use the link below.
          </div>
        )}

        {/* Always offer a direct link */}
        <div className="mt-3 text-right px-1">
          <a
            href={previewNote.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 dark:text-indigo-400 underline"
          >
            Open attachment in new tab
          </a>
        </div>
      </div>
    </Modal>
  )}
</main>

  );
}
