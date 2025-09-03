'use client';

import { useEffect, useState } from 'react';
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

  /** Teacher’s brief/original file to view */
  assignmentFile?: string;

  /** Student’s uploaded file (for “My Submission”) */
  submissionFile?: string;

  /** True status returned by list API */
  assignmentSubmissionStatus?: string;

  /** Legacy fallback if backend still returns it */
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
  data: { id: string; title: string; fees: number;  }[];
  pagination?: any;
};

type SignedUrlResponse = {
  status: number;
  success: boolean;
  message: string;
  signedUrl?: string;
  data?: { signedUrl?: string };
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
function pickStatus(item: AssignmentItem) {
  return (item.assignmentSubmissionStatus || item.status || '—').toString();
}
function statusBadgeClass(status: string) {
  const v = status.toLowerCase();
  if (v === 'checked') return 'bg-green-100 text-green-800';
  if (v === 'submitted') return 'bg-blue-100 text-blue-800';
  if (v === 'active') return 'bg-yellow-100 text-yellow-800';
  if (v === 'Time Exceeded') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

/* =========================
   Card
========================= */
function AssignmentCard({
  item,
  onSubmitClick,
  onViewAssignmentFile,
  onViewSubmissionFile,
}: {
  item: AssignmentItem;
  onSubmitClick: (item: AssignmentItem) => void;
  onViewAssignmentFile: (item: AssignmentItem) => void;
  onViewSubmissionFile: (item: AssignmentItem) => void;
}) {
  const statusText = pickStatus(item);
  const statusLower = statusText.toLowerCase();
  const cls = statusBadgeClass(statusText);

  return (
    <div className="bg-white rounded-md shadow border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-sm font-semibold text-gray-900 truncate">
            {item.assignmentTitle}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2">
            {item.description || '—'}
          </p>
        </div>
        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {item.courseTitle || '—'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs text-gray-600 mt-1">
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} /> Deadline: {fmtDate(item.firstDeadline)}
        </span>
      
        {typeof item.totalMarks === 'number' && (
          <span className="inline-flex items-center gap-1">
            <FileText size={14} /> {item.totalMarks} marks
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
        <span className={`inline-block w-max text-[11px] px-2 py-0.5 rounded-full ${cls}`}>
          {statusText}
        </span>

        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          {/* View assignment brief */}
          <button
            disabled={!item.assignmentFile}
            onClick={() => item.assignmentFile && onViewAssignmentFile(item)}
            className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
            title={item.assignmentFile ? 'View assignment file' : 'No file'}
          >
            <Eye size={14} /> <span className="hidden xs:inline">View</span> File
          </button>

          {/* View student's submission (only when submitted/checked) */}
          {(statusLower === 'submitted' || statusLower === 'checked') && (
            <button
              disabled={!item.submissionFile}
              onClick={() => item.submissionFile && onViewSubmissionFile(item)}
              className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
              title={item.submissionFile ? 'View your submission' : 'No submission file'}
            >
              <Eye size={14} /> My Submission
            </button>
          )}

          <button
            onClick={() => onSubmitClick(item)}
            className="inline-flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded bg-gray-900 text-white hover:opacity-90"
          >
            <UploadCloud size={14} />
            {statusLower === 'submitted' || statusLower === 'checked' ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Submit Modal (Professional Upload UI + Progress)
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [error, setError] = useState<string | null>(null);

  // drag & drop (optional highlight)
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Please choose a file to submit.');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // 1) Get signed URL
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

      // 2) Upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', contentType);

        xhr.upload.onprogress = (ev: ProgressEvent) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.send(file);
      });

      // 3) Finalize on server
      const finalUrl = extractObjectUrl(signedUrl);
      await api.patch(`/assignments/student/submit-assignment/${assignment.id}`, {
        submissionFile: finalUrl,
      });

      onSubmitted(); // refresh list
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md max-w-[95vw] sm:rounded-lg sm:shadow-lg sm:overflow-hidden rounded-t-xl">
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold pr-2 truncate">
            Submit Assignment — {assignment.assignmentTitle}
          </h3>
          <button
            className="text-gray-500 hover:text-red-500 text-lg leading-none disabled:opacity-50"
            onClick={onClose}
            disabled={uploading}
            title={uploading ? 'Uploading…' : 'Close'}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-5 py-4 space-y-4 max-h-[85vh] overflow-auto">
          {/* Label */}
          <label className="block text-sm font-medium">Upload Attachment</label>

          {/* Pretty upload box (matches your screenshot) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-lg border ${
              dragOver ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-300'
            } p-6 sm:p-8 text-center transition-all`}
          >
            <UploadCloud size={28} className="mx-auto text-gray-400 mb-2" />
            {!file ? (
              <>
                <p className="text-sm text-gray-600">Choose a file to upload</p>
                <label className="mt-1 inline-block text-sm text-indigo-600 hover:underline cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  Choose File
                </label>
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  Selected: <span className="font-medium break-all">{file.name}</span>
                </p>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <label className="text-indigo-600 hover:underline cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    Change File
                  </label>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-gray-500 hover:underline"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                <div
                  className="h-2 bg-indigo-600 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full rounded-md bg-gray-900 text-white text-sm py-2 disabled:opacity-60"
          >
            {uploading ? 'Submitting…' : 'Submit'}
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
  const canIframe = isPdfExt(ext);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[95vw] sm:max-w-3xl sm:rounded-lg sm:shadow-lg overflow-hidden rounded-t-xl">
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold pr-2 truncate">File — {title}</h3>
          <button
            className="text-gray-500 hover:text-red-500 text-lg leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-4 max-h-[85vh] overflow-auto">
          {isImageExt(ext) ? (
            <img src={url} alt={title} className="w-full max-h-[70vh] object-contain rounded border" />
          ) : canIframe ? (
            <iframe title="File" src={url} className="w-full h-[70vh] border rounded" />
          ) : (
            <p className="text-sm text-gray-700">
              Preview not available for .{ext}.{' '}
              <a href={url} target="_blank" rel="noreferrer" className="underline text-indigo-600">
                Open in new tab
              </a>
              .
            </p>
          )}

          <div className="mt-3 text-right">
            <a href={url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Page (responsive)
========================= */
export default function AssignmentsPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState(''); // filters on assignmentSubmissionStatus

  // Courses
  const [courses, setCourses] = useState<{ id: string; title: string; fees: number }[]>([]);
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
          // backend may accept "status"; we still normalize client-side below
          status: status || undefined,
        }
      );

      let data = res.data || [];

      // Client-side filters (accurate against assignmentSubmissionStatus)
      if (courseId) data = data.filter((d) => d.courseId === courseId);
      if (status) {
        const s = status.toLowerCase();
        data = data.filter(
          (d) =>
            (d.assignmentSubmissionStatus || d.status || '')
              .toString()
              .toLowerCase() === s
        );
      }

      // Client-side search (title)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter((d) =>
          (d.assignmentTitle || '').toLowerCase().includes(q)
        );
      }

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
    <main className="bg-[#F9FAFB] min-h-screen text-gray-800">
      <div className="px-3 sm:px-6 py-6 max-w-7xl mx-auto">
        <PageHeader title="Assignments" description="All current assignments" />

        {/* Filters Bar */}
        <div className="bg-white border rounded-md p-3 sm:p-4 mb-4">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:flex-wrap md:items-center">
            {/* Course */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <div className="inline-flex items-center gap-2">
                <Filter size={16} className="text-gray-500 shrink-0" />
                <span className="text-sm text-gray-600">Course</span>
              </div>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setPage(1);
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

            {/* Status (filters assignmentSubmissionStatus) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <span className="text-sm text-gray-600">Status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="border rounded px-2 py-2 sm:py-1.5 text-sm w-full sm:w-48"
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Submitted">Submitted</option>
                <option value="Checked">Checked</option>
                <option value="Pending">Pending</option>
                <option value="Time Exceeded">Time Exceeded</option>
              </select>
            </div>

            {/* Per Page */}
       

            {/* Search */}
            <div className="relative w-full md:ml-auto md:w-72">
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
                className="border rounded pl-8 pr-3 py-2 sm:py-1.5 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading && <p className="text-sm text-gray-500 mb-2">Loading assignments…</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((item) => (
            <AssignmentCard
              key={item.id}
              item={item}
              onSubmitClick={(assn) => setSelected(assn)}
              onViewAssignmentFile={(assn) => {
                if (assn.assignmentFile) {
                  setFileView({ url: assn.assignmentFile, title: assn.assignmentTitle });
                }
              }}
              onViewSubmissionFile={(assn) => {
                if (assn.submissionFile) {
                  setFileView({
                    url: assn.submissionFile,
                    title: `${assn.assignmentTitle} — My Submission`,
                  });
                }
              }}
            />
          ))}
        </div>

        {/* Empty */}
        {!loading && rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-10">No assignments found.</div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <span className="block">
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

            {/* Page numbers hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: Math.max(1, Math.ceil(total / limit)) }).map((_, i) => (
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
              disabled={page >= Math.max(1, Math.ceil(total / limit))}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
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
          <FileModal url={fileView.url} title={fileView.title} onClose={() => setFileView(null)} />
        )}
      </div>
    </main>
  );
}
