'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { Edit2, Trash2, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';

/* =========================
   Types
========================= */
type ExternalLinkItem = {
  id: string;
  title: string;
  url: string;
  description?: string;
  courseId: string;
  courseName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type GetAllLinksResponse = {
  status: number;
  success: boolean;
  message: string;
  data: ExternalLinkItem[];
};

type CreateLinkBody = {
  title: string;
  url: string;
  description?: string;
  courseId: string;
};

type UpdateLinkBody = CreateLinkBody;

type CourseItem = { id: string; title: string };
type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers
========================= */
function isValidHttpUrl(str: string) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
function fmtDate(d?: string) {
  if (!d) return '-';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleString();
}

/* =========================
   Page
========================= */
export default function SendZoomLinkPage() {
  // Create form state
  const [title, setTitle] = useState('Zoom');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Data: courses and links
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [allLinks, setAllLinks] = useState<ExternalLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Table state (serverMode controlled locally: filter & paginate client-side)
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Edit modal
  const [editItem, setEditItem] = useState<ExternalLinkItem | null>(null);
  const [editTitle, setEditTitle] = useState('Zoom');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  /* Load all courses (iterate pages with page=1&limit=2) */
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const LIMIT = 2;
        const first = await api.get<CoursesResponse>('/courses/get-all-courses', {
          page: 1,
          limit: LIMIT,
        });
        const list = Array.isArray(first?.data) ? first.data : [];
        const totalPages = first?.pagination?.totalPages ?? 1;

        const all = [...list];
        for (let p = 2; p <= totalPages; p++) {
          const resp = await api.get<CoursesResponse>('/courses/get-all-courses', {
            page: p,
            limit: LIMIT,
          });
          if (Array.isArray(resp?.data)) all.push(...resp.data);
        }
        setCourses(all);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  /* Load all links (no pagination on API -> we paginate client-side) */
  async function fetchLinks() {
    setLoadingLinks(true);
    try {
      const res = await api.get<GetAllLinksResponse>('/external-links/get-all-links');
      setAllLinks(res?.data ?? []);
    } catch {
      setAllLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  }
  useEffect(() => {
    fetchLinks();
  }, []);

  /* Derived: filter + paginate (client-side) */
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allLinks;
    return allLinks.filter((l) => {
      const hay = [
        l.title,
        l.url,
        l.description,
        l.courseName,
      ]
        .map((x) => (x || '').toString().toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }, [allLinks, searchTerm]);

  const totalItems = filtered.length;
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const tableRows = useMemo(
    () =>
      pageSlice.map((item, idx) => ({
        ...item,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [pageSlice, currentPage, itemsPerPage]
  );

  /* Column definitions */
const columns: TableColumn[] = useMemo<TableColumn[]>(
  () => [
    { header: 'S.No', accessor: 'sNo' },
    { header: 'Title', accessor: 'title' },
    {
      header: 'URL',
      accessor: 'url',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded text-xs px-2 py-0.5
                       border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       hover:bg-slate-50 dark:hover:bg-slate-800"
            title={value}
          >
            <ExternalLink size={14} /> Open
          </a>
          <button
            className="inline-flex items-center gap-1 rounded text-xs px-2 py-0.5
                       border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => navigator.clipboard.writeText(value)}
            title="Copy URL"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (v?: string) => (
        <span
          title={v || ''}
          className="block max-w-[320px] line-clamp-2 text-slate-700 dark:text-slate-300"
        >
          {v || '—'}
        </span>
      ),
    },
    {
      header: 'Course',
      accessor: 'courseName',
      render: (v?: string) => (
        <span
          className="text-xs rounded-full px-2 py-0.5
                     bg-slate-100 text-slate-700
                     dark:bg-slate-800 dark:text-slate-300
                     ring-1 ring-slate-200 dark:ring-slate-700"
        >
          {v || '—'}
        </span>
      ),
    },
    {
      header: 'Sent At',
      accessor: 'createdAt',
      render: (v?: string) => fmtDate(v),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_: any, row: ExternalLinkItem) => (
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded text-xs px-2 py-1
                       border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            onClick={() => {
              setEditItem(row);
              setEditTitle(row.title || 'Zoom');
              setEditUrl(row.url || '');
              setEditDescription(row.description || '');
              setEditCourseId(row.courseId || '');
            }}
            title="Edit"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            className="inline-flex items-center gap-1 rounded text-xs px-2 py-1
                       border border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick={() => setPendingDeleteId(row.id)}
            title="Delete"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ],
  []
);

  /* Create link */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!courseId) return setFormError('Please select a course.');
    if (!title.trim()) return setFormError('Please enter a title.');
    if (!url.trim() || !isValidHttpUrl(url)) return setFormError('Please enter a valid URL (http/https).');

    setSubmitting(true);
    try {
      const body: CreateLinkBody = { title: title.trim(), url: url.trim(), description: description.trim() || undefined, courseId };
      await api.post('/external-links/create-link', body);

      // reset & refresh
      setUrl('');
      setDescription('');
      setTitle('Zoom');
      fetchLinks();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to send link.');
    } finally {
      setSubmitting(false);
    }
  }

  /* Update link */
  async function saveEdit() {
    if (!editItem) return;
    if (!editCourseId) return;
    if (!editTitle.trim()) return;
    if (!editUrl.trim() || !isValidHttpUrl(editUrl)) return;

    setSavingEdit(true);
    try {
      const body: UpdateLinkBody = {
        title: editTitle.trim(),
        url: editUrl.trim(),
        description: editDescription.trim() || undefined,
        courseId: editCourseId,
      };
      await api.patch(`/external-links/update-link/${editItem.id}`, body);
      setEditItem(null);
      fetchLinks();
    } catch {
      // keep open on error
    } finally {
      setSavingEdit(false);
    }
  }

  /* Delete link */
  async function deleteLink() {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/external-links/delete-link/${pendingDeleteId}`);
      setPendingDeleteId(null);
      // handle if page becomes empty
      if (tableRows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchLinks();
      }
    } catch {
      setPendingDeleteId(null);
    }
  }

  /* Toolbar: (nothing fancy here; search sits on the right from TableComponent) */
  const toolbarLeft = (
    <div className="text-sm text-gray-600">
      Showing Zoom / external links sent to courses
    </div>
  );

  return (
<main className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <PageHeader
    title="Send Zoom Link"
    description="Create, manage, and share external meeting links with courses"
  />

  {/* Create card */}
  <section className="mb-6 rounded-lg shadow-sm p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
      <LinkIcon size={18} /> Send a Link
    </h2>

    <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Course */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
          Course <span className="text-red-500">*</span>
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     border-slate-300 dark:border-slate-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        >
          <option value="">{loadingCourses ? 'Loading courses…' : 'Select course'}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Zoom"
          className="w-full rounded border px-3 py-2 text-sm
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     border-slate-300 dark:border-slate-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        />
      </div>

      {/* URL */}
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
          URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-zoom-link.com/meeting-id"
          className="w-full rounded border px-3 py-2 text-sm
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     border-slate-300 dark:border-slate-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note for students"
          className="w-full rounded border px-3 py-2 text-sm resize-y
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     border-slate-300 dark:border-slate-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        />
      </div>

      {formError && (
        <div className="md:col-span-2 text-sm text-red-700 dark:text-red-400">{formError}</div>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          className="w-full md:w-auto rounded px-5 py-2 text-sm font-medium text-white
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     hover:from-indigo-700 hover:to-purple-700
                     disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send Link'}
        </button>
      </div>
    </form>
  </section>

  {/* Table */}
  <section className="rounded-lg shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
    {loadingLinks && (
      <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Loading links…</p>
    )}
    <TableComponent
      columns={columns}
      data={tableRows}
      serverMode
      toolbarLeft={toolbarLeft}
      searchTerm={searchTerm}
      onSearchTermChange={(v) => {
        setSearchTerm(v);
        setCurrentPage(1);
      }}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      itemsPerPage={itemsPerPage}
      onItemsPerPageChange={(n) => {
        setItemsPerPage(n);
        setCurrentPage(1);
      }}
      totalItems={totalItems}
    />
  </section>

  {/* Delete confirm */}
  {pendingDeleteId && (
    <ConfirmationModal
      title="Delete Link"
      description="Are you sure you want to delete this link?"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={deleteLink}
    />
  )}

  {/* Edit Modal */}
  {editItem && (
    <Modal title={`Edit Link — ${editItem.title}`} onClose={() => setEditItem(null)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-slate-900 dark:text-slate-100">
        {/* Course */}
        <div>
          <label className="mb-1 block text-sm font-medium">Course</label>
          <select
            value={editCourseId}
            onChange={(e) => setEditCourseId(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       border-slate-300 dark:border-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            <option value="">{loadingCourses ? 'Loading courses…' : 'Select course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       border-slate-300 dark:border-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            placeholder="Zoom"
          />
        </div>

        {/* URL */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">URL</label>
          <input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       border-slate-300 dark:border-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            placeholder="https://your-zoom-link.com/meeting-id"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm resize-y
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       border-slate-300 dark:border-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            placeholder="Optional note for students"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          className="px-3 py-1 rounded border
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     border-slate-300 dark:border-slate-700
                     hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => setEditItem(null)}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          onClick={saveEdit}
          disabled={savingEdit}
        >
          {savingEdit ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  )}
</main>

  );
}
