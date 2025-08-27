'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import {
  Search,
  Eye,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

/* =========================
   API Types
========================= */
type SubmissionItem = {
  id: string;
  studentName: string;
  submissionFile: string; // may be empty string
  deadlineStatus: string; // e.g. "Active"
  status: string;         // e.g. "Pending"
  createdAt: string;      // ISO
};
type SubmissionsResponse = {
  status: number;
  success: boolean;
  message: string;
  data: SubmissionItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers
========================= */
function formatDate(d: string | undefined) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}
function badgeColor(v?: string) {
  const val = (v || '').toLowerCase();
  if (val.includes('active')) return 'bg-green-100 text-green-700';
  if (val.includes('pending')) return 'bg-amber-100 text-amber-800';
  if (val.includes('late')) return 'bg-red-100 text-red-700';
  if (val.includes('checked') || val.includes('graded')) return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-700';
}
function getFileKind(url: string) {
  const u = url.toLowerCase();
  if (u.endsWith('.pdf')) return 'pdf';
  if (u.match(/\.(png|jpg|jpeg|gif|webp)$/)) return 'image';
  if (u.match(/\.(mp4|webm|ogg|mov)$/)) return 'video';
  return 'other';
}

/* =========================
   Simple Modal (inline)
========================= */
function Modal({
  title,
  onClose,
  children,
  footer,
  widthClass = 'max-w-2xl',
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={`w-full ${widthClass} bg-white rounded-lg shadow-lg overflow-hidden`}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title || 'Details'}</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-red-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t">{footer}</div>}
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = typeof params?.id === 'string' ? params.id : '';

  // table state
  const [rows, setRows] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // modals
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number | ''>('');
  const [remarks, setRemarks] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'' | 'pending' | 'checked' | 'submitted'>('');

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // fetch list
  async function fetchSubmissions() {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await api.get<SubmissionsResponse>(
        `/assignments/get-assignments-submissions/${assignmentId}`,
        { page, limit, search: debouncedSearch, status: status || ''  }
      );
      setRows(res.data || []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, page, limit, debouncedSearch , status]);

  async function handleCheckSubmit() {
    if (!checkId) return;
    if (marks === '' || Number.isNaN(Number(marks))) return;

    setSaving(true);
    try {
      await api.put('/assignments/check-assignment', {
        id: checkId,
        obtainedMarks: Number(marks),
        remarks: remarks || '',
      });
      // refresh + close
      setCheckId(null);
      setMarks('');
      setRemarks('');
      fetchSubmissions();
    } catch {
      // optionally show toast
    } finally {
      setSaving(false);
    }
  }

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <main className="bg-[#F9FAFB] min-h-screen p-4">
      <PageHeader
        title="Assignment Submissions"
        description={`Manage submissions for assignment ID: ${assignmentId}`}
      />
<div className="flex items-center justify-between mb-4">
  <div className="flex gap-2">
    <input
      type="text"
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="px-2 py-1 border rounded-md"
    />
    <select
      value={status}
      onChange={(e) => setStatus(e.target.value as any)}
      className="px-2 py-1 border rounded-md"
    >
      <option value="">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="checked">Checked</option>
      <option value="submitted">Submitted</option>
    </select>
  </div>
</div>
      {/* Table */}
      <div className="bg-white border rounded-md shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {/* CHANGED: "Submission ID" -> "S.No" */}
              <th className="text-left font-medium px-4 py-3 text-gray-600">S.No</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">Student</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">Submitted At</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">Deadline</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">Status</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">File</th>
              <th className="text-left font-medium px-4 py-3 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading submissions…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No submissions found.
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((r, idx) => {
                const hasFile = Boolean(r.submissionFile);
                const sno = (page - 1) * limit + idx + 1; // <-- S.No computed per page
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50 text-black">
                    {/* CHANGED: show S.No, not the submission id */}
                    <td className="px-4 py-2">{sno}</td>
                    <td className="px-4 py-2">{r.studentName || '-'}</td>
                    <td className="px-4 py-2">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${badgeColor(r.deadlineStatus)}`}>
                        {r.deadlineStatus || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${badgeColor(r.status)}`}>
                        {r.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        disabled={!hasFile}
                        onClick={() => setViewUrl(r.submissionFile)}
                        className="inline-flex items-center gap-1 border rounded px-3 py-1 text-xs disabled:opacity-50"
                        title={hasFile ? 'View submission' : 'No file'}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        disabled={!hasFile}
                        onClick={() => {
                          setCheckId(r.id);
                          setMarks('');
                          setRemarks('');
                        }}
                        className="inline-flex items-center gap-1 border rounded px-3 py-1 text-xs disabled:opacity-50"
                        title="Check / grade"
                      >
                        <CheckSquare size={14} /> Check
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Footer / pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 text-sm text-gray-600">
          <span>
            Showing {total === 0 ? 0 : startIndex} - {endIndex} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="border rounded px-2 py-1 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                disabled={loading}
                className={`border rounded px-2 py-1 ${
                  page === i + 1 ? 'bg-gray-200 font-semibold' : ''
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="border rounded px-2 py-1 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* View Submission Modal */}
      {viewUrl && (
        <Modal title="Submission Preview" onClose={() => setViewUrl(null)} widthClass="max-w-4xl text-black">
          {(() => {
            const kind = getFileKind(viewUrl);
            if (kind === 'pdf') {
              return (
                <iframe
                  src={viewUrl}
                  className="w-full h-[70vh] border rounded"
                  title="PDF Preview"
                />
              );
            }
            if (kind === 'image') {
              return <img src={viewUrl} alt="Submission" className="max-h-[70vh] w-auto mx-auto rounded border" />;
            }
            if (kind === 'video') {
              return (
                <video controls className="w-full rounded border">
                  <source src={viewUrl} />
                  Your browser does not support HTML5 video.
                </video>
              );
            }
            return (
              <div className="text-sm">
                <p className="mb-3">Preview not available for this file type.</p>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  <Download size={16} /> Open / Download
                </a>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Check / Grade Modal */}
      {checkId && (
        <Modal title="Check Assignment" onClose={() => setCheckId(null)} widthClass="max-w-lg text-black">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Obtained Marks</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded px-3 py-2 text-sm text-black placeholder:text-grey-900"
                value={marks}
                onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 95"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Remarks</label>
              <textarea
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm text-black placeholder:text-grey-900"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Short feedback for the student"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-1 border rounded" onClick={() => setCheckId(null)}>
              Cancel
            </button>
            <button
              disabled={saving || marks === '' || Number.isNaN(Number(marks))}
              onClick={handleCheckSubmit}
              className="px-4 py-1 rounded text-white bg-indigo-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
