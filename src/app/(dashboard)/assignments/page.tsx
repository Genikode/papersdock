'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import {
  Calendar,
  FileText,
  UploadCloud,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

/* =========================
   Types (aligned to your API)
========================= */
type AssignmentItem = {
  id: string;
  assignmentTitle: string;
  description?: string;
  firstDeadline?: string;
  lastDeadline?: string;
  assignmentFile?: string;    // <— used by “View File”
  status?: string;
  totalMarks?: number;
  courseTitle?: string;
  courseId?: string;
  createdAt?: string;
};

type AssignmentListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: AssignmentItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: { id: string; title: string }[];
  pagination?: any;
};

type SignedUrlResponse = {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string; // presigned PUT url
};

/* =========================
   Helpers
========================= */
function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

function sanitizeKeyPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
function inferExt(file: File): string {
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  if (nameExt) return nameExt;
  if (file.type === 'application/pdf') return 'pdf';
  return 'bin';
}
function contentTypeForExt(ext: string) {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return map[ext] || 'application/octet-stream';
}
function extractObjectUrl(presignedUrl: string) {
  return presignedUrl.split('?')[0];
}

function extFromUrl(url: string) {
  const clean = url.split('?')[0];
  const ext = clean.split('.').pop();
  return (ext || '').toLowerCase();
}
function isImageExt(ext: string) {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);
}
function isPdfExt(ext: string) {
  return ext === 'pdf';
}

/* =========================
   Card
========================= */
function AssignmentCard({
  item,
  onSubmitClick,
  onViewFile,
}: {
  item: AssignmentItem;
  onSubmitClick: (item: AssignmentItem) => void;
  onViewFile: (item: AssignmentItem) => void;
}) {
  const statusClass =
    (item.status || '').toLowerCase() === 'submitted'
      ? 'bg-blue-100 text-blue-800'
      : (item.status || '').toLowerCase() === 'checked'
      ? 'bg-green-100 text-green-800'
      : (item.status || '').toLowerCase() === 'active'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-md shadow border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {item.assignmentTitle}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2">
            {item.description || '—'}
          </p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {item.courseTitle || '—'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} />
          First: {fmtDate(item.firstDeadline)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} />
          Last: {fmtDate(item.lastDeadline)}
        </span>
        {typeof item.totalMarks === 'number' && (
          <span className="inline-flex items-center gap-1">
            <FileText size={14} />
            {item.totalMarks} marks
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass}`}>
          {item.status || '—'}
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={!item.assignmentFile}
            onClick={() => item.assignmentFile && onViewFile(item)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
            title={item.assignmentFile ? 'View assignment file' : 'No file'}
          >
            <Eye size={14} /> View File
          </button>

          <button
            onClick={() => onSubmitClick(item)}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-gray-900 text-white hover:opacity-90"
          >
            <UploadCloud size={14} />
            {((item.status || '').toLowerCase() === 'submitted' ||
              (item.status || '').toLowerCase() === 'checked')
              ? 'Update Submission'
              : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Submit Modal
========================= */
function SubmitModal({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: AssignmentItem;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Please choose a file to submit.');
      return;
    }
    try {
      setSaving(true);
      const safe = sanitizeKeyPart(file.name) || 'file.bin';
      const ext = inferExt(file);
      const key = `assignments/submissions/${Date.now()}-${safe}`;
      const contentType = contentTypeForExt(ext);

      const signed = await api.post<SignedUrlResponse>('/get-signed-url', {
        key,
        contentType,
      });
      const signedUrl =
        (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
      if (!signedUrl) throw new Error('Failed to get signed URL');

      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });

      const finalUrl = extractObjectUrl(signedUrl);
      await api.patch(
        `/assignments/student/submit-assignment/${assignment.id}`,
        { submissionFile: finalUrl }
      );

      onSubmitted();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit assignment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Submit Assignment — {assignment.assignmentTitle}
          </h3>
          <button
            className="text-gray-500 hover:text-red-500 text-lg leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Choose file</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-gray-900 text-white text-sm py-2 disabled:opacity-60"
          >
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   File Preview Modal
========================= */
function FileModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const ext = extFromUrl(url);
  const canIframe = isPdfExt(ext); // PDFs are best in iframe; images we’ll show <img/>

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Assignment File — {title}</h3>
          <button
            className="text-gray-500 hover:text-red-500 text-lg leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          {isImageExt(ext) ? (
            <img src={url} alt={title} className="w-full max-h-[70vh] object-contain rounded border" />
          ) : canIframe ? (
            <iframe
              title="Assignment File"
              src={url}
              className="w-full h-[70vh] border rounded"
            />
          ) : (
            <p className="text-sm text-gray-700">
              Preview not available for .{ext}.{' '}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="underline text-indigo-600"
              >
                Open in new tab
              </a>
              .
            </p>
          )}

          <div className="mt-3 text-right">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Page
========================= */
export default function AssignmentsPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');

  // Courses
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Data
  const [rows, setRows] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // Modals
  const [selected, setSelected] = useState<AssignmentItem | null>(null);
  const [fileView, setFileView] = useState<{ url: string; title: string } | null>(null);

  // Load courses
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', {
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

  // Fetch assignments
  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await api.get<AssignmentListResponse>(
        '/assignments/student/get-all-assignments',
        {
          page,
          limit,
          search: search || '',
          courseId: courseId || undefined,
          status: status || undefined,
        }
      );

      let data = res.data || [];

      // Client-side fallback filters
      if (courseId) data = data.filter((d) => d.courseId === courseId);
      if (status) data = data.filter((d) => (d.status || '').toLowerCase() === status.toLowerCase());

      setRows(data);
      setTotal(res.pagination?.total ?? data.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, courseId, status]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="bg-[#F9FAFB] p-6 min-h-screen text-gray-800">
      <PageHeader title="Assignments" description="All current assignments" />

      {/* Filters Bar */}
      <div className="bg-white border rounded-md p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Course */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
      
       
     
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm min-w-[150px]"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Submitted">Submitted</option>
              <option value="Checked">Checked</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Per Page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Per page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="ml-auto relative">
            <Search
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search assignment…"
              className="border rounded pl-7 pr-3 py-1 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && (
        <p className="text-sm text-gray-500 mb-2">Loading assignments…</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((item) => (
          <AssignmentCard
            key={item.id}
            item={item}
            onSubmitClick={(assn) => setSelected(assn)}
            onViewFile={(assn) => {
              if (assn.assignmentFile) {
                setFileView({ url: assn.assignmentFile, title: assn.assignmentTitle });
              }
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-gray-600">
        <span>
          Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-gray-200 font-semibold' : ''}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      {selected && (
        <SubmitModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onSubmitted={() => fetchAssignments()}
        />
      )}

      {/* File View Modal */}
      {fileView && (
        <FileModal
          url={fileView.url}
          title={fileView.title}
          onClose={() => setFileView(null)}
        />
      )}
    </main>
  );
}
