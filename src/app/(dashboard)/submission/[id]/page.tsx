'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import {
  Eye,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  UserRound
} from 'lucide-react';
import { BiArrowBack } from 'react-icons/bi';

/* =========================
   API Types
========================= */
type Assignment = {
  id: string;
  assignmentTitle: string;
  description?: string;
  firstDeadline?: string; // "YYYY-MM-DD HH:mm:ss"
  courseTitle?: string;
  createdByName?: string;
  createdAt?: string;
};

type SubmissionItem = {
  id: string;                // submission id
  studentId?: string;        // <-- optional, if backend returns it (used for per-student update)
  studentName: string;
  submissionFile: string;    // may be empty string
  deadlineStatus: string; 
  contact: string;          
 assignmentDeadline: string;   // e.g. "Active" / "Late" / "Missed"
  status: string;            // e.g. "Pending" / "Checked" / "Submitted"
  createdAt: string;         // ISO
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
function toDateInputValue(dateLike?: string) {
  if (!dateLike) return '';
  try {
    const d = new Date(dateLike);
    // date input wants YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}
function badgeColor(v?: string) {
  const val = (v || '').toLowerCase();
  if (val.includes('active') || val.includes('on-time')) return 'bg-green-100 text-green-700';
  if (val.includes('pending')) return 'bg-amber-100 text-amber-800';
  if (val.includes('late') || val.includes('missed')) return 'bg-red-100 text-red-700';
  if (val.includes('checked') || val.includes('graded')) return 'bg-indigo-100 text-indigo-700';
  if (val.includes('submitted')) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}
function getFileKind(url: string) {
  const u = (url || '').toLowerCase();
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
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-3">
  <div
    className={`w-full ${widthClass} bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden`}
  >
    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
        {title || 'Details'}
      </h3>
      <button
        onClick={onClose}
        className="p-1 rounded text-gray-500 hover:text-red-500 dark:text-slate-400 hover:dark:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>

    <div className="p-4">{children}</div>

    {footer && (
      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
        {footer}
      </div>
    )}
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

  // assignment meta
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  // table state
  const [rows, setRows] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'' | 'pending' | 'checked' | 'submitted' | 'missed'>('');
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // modals
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  // check/grade modal
  const [checkId, setCheckId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number | ''>('');
  const [remarks, setRemarks] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // deadlines modals
  const [showAllDeadlineModal, setShowAllDeadlineModal] = useState(false);
  const [showStudentDeadlineModal, setShowStudentDeadlineModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState(''); // YYYY-MM-DD
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState<string | undefined>(undefined);
  const [savingDeadline, setSavingDeadline] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // fetch assignment details
  async function fetchAssignmentMeta() {
    if (!assignmentId) return;
    setMetaLoading(true);
    try {
      // API returns { data: [ { ...assignment } ] }
      const res = await api.get<{ status: number; success: boolean; data: Assignment[] }>(
        `/assignments/get-assignment/${assignmentId}`
      );
      const a = Array.isArray(res.data) ? res.data[0] : (res.data as any)?.[0];
      setAssignment(a || null);
      // Pre-fill "all" deadline modal with current deadline if available
      if (a?.firstDeadline && !newDeadline) {
        setNewDeadline(toDateInputValue(a.firstDeadline));
      }
    } catch {
      setAssignment(null);
    } finally {
      setMetaLoading(false);
    }
  }

  // fetch submissions
  async function fetchSubmissions() {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await api.get<SubmissionsResponse>(
        `/assignments/get-assignments-submissions/${assignmentId}`,
        { page, limit, search: debouncedSearch, status: status || '' }
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
    fetchAssignmentMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, page, limit, debouncedSearch, status]);

  /* ---------- Check / Grade ---------- */
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

  /* ---------- Deadlines: All ---------- */
  async function updateDeadlineForAll() {
    if (!assignmentId || !newDeadline) return;
    setSavingDeadline(true);
    try {
      await api.patch('/assignments/update-deadline-for-all', {
        assignmentId,
        newDeadline, // YYYY-MM-DD
      });
      setShowAllDeadlineModal(false);
      fetchAssignmentMeta();
      fetchSubmissions();
    } catch {
      // optionally toast
    } finally {
      setSavingDeadline(false);
    }
  }

  /* ---------- Deadlines: Per Student ---------- */
  function openStudentDeadlineModal(prefill?: { studentId?: string; studentName?: string }) {
    setShowStudentDeadlineModal(true);
    setStudentId(prefill?.studentId || '');
    setStudentName(prefill?.studentName);
    // default date = assignment's firstDeadline (if exists)
    if (assignment?.firstDeadline) {
      setNewDeadline(toDateInputValue(assignment.firstDeadline));
    }
  }

  async function updateDeadlineForStudent() {
    if (!assignmentId || !studentId || !newDeadline) return;
    setSavingDeadline(true);
    try {
      await api.patch('/assignments/update-deadline-for-student', {
        assignmentId,
        studentId,
        newDeadline, // YYYY-MM-DD
      });
      setShowStudentDeadlineModal(false);
      fetchSubmissions();
    } catch {
      // optionally toast
    } finally {
      setSavingDeadline(false);
    }
  }

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
   <main className="min-h-screen p-4 bg-[#F9FAFB] text-gray-900 dark:bg-slate-950 dark:text-slate-100">
  {/* Header */}
  <div className="mb-4" />

  <button
    onClick={() => window.history.back()}
    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 hover:dark:text-slate-100 mb-2"
  >
    <BiArrowBack size={18} />
  </button>

  <PageHeader
    title="Assignment Submissions"
    description={
      metaLoading
        ? 'Loading assignment…'
        : assignment?.assignmentTitle
          ? 'Managing submissions for ' + assignment.assignmentTitle
          : `Assignment: ${assignmentId}`
    }
  />

  {/* Actions row */}
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
    {/* Left: search + status */}
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-2 py-1 border rounded-md placeholder:text-gray-400 bg-white text-gray-900
                   border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                   dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:border-slate-700 dark:focus:ring-indigo-400"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as any)}
        className="px-2 py-1 border rounded-md bg-white text-gray-900
                   border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                   dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="checked">Checked</option>
        <option value="submitted">Submitted</option>
        <option value="missed">Missed</option>
      </select>
    </div>

    {/* Right: deadline actions */}
    <div className="flex gap-2">
      <button
        onClick={() => {
          if (assignment?.firstDeadline) {
            setNewDeadline(toDateInputValue(assignment.firstDeadline));
          }
          setShowAllDeadlineModal(true);
        }}
        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1 text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      >
        <Calendar size={16} /> Update Deadline (All)
      </button>
    </div>
  </div>

  {/* Table */}
  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-sm overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">S.No</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Student</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Contact</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Created At</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Deadline</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Status</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">File</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Actions</th>
          <th className="text-left font-medium px-4 py-3 text-gray-600 dark:text-slate-300">Deadline Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td colSpan={8} className="px-4 py-6 text-center text-gray-500 dark:text-slate-400">
              Loading submissions…
            </td>
          </tr>
        )}

        {!loading && rows.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-6 text-center text-gray-500 dark:text-slate-400">
              No submissions found.
            </td>
          </tr>
        )}

        {!loading &&
          rows.map((r, idx) => {
            const hasFile = Boolean(r.submissionFile);
            const sno = (page - 1) * limit + idx + 1;
            return (
              <tr
                key={r.id}
                className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800
                           text-gray-900 dark:text-slate-100"
              >
                <td className="px-4 py-2">{sno}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-gray-500 dark:text-slate-400" />
                    <div className="flex flex-col">
                      <span>{r.studentName || '-'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">{r.contact || '-'}</td>
                <td className="px-4 py-2">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200">
                    {r.assignmentDeadline ? new Date(r.assignmentDeadline).toLocaleDateString('en-GB') : '-'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${badgeColor(r.status)}`}>{r.status || '-'}</span>
                </td>
                <td className="px-4 py-2">
                  <button
                    disabled={!hasFile}
                    onClick={() => setViewUrl(r.submissionFile)}
                    className="inline-flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded px-3 py-1 text-xs
                               hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
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
                    className="inline-flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded px-3 py-1 text-xs
                               hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    title="Check / grade"
                  >
                    <CheckSquare size={14} /> Check
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      openStudentDeadlineModal({
                        studentId: r.studentId,
                        studentName: r.studentName,
                      })
                    }
                    className="inline-flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded px-3 py-1 text-xs
                               hover:bg-gray-50 dark:hover:bg-slate-800"
                    title="Update deadline for this student"
                  >
                    <Clock size={14} /> Update Deadline
                  </button>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>

    {/* Footer / pagination */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
      <span>
        Showing {total === 0 ? 0 : startIndex} - {endIndex} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="border border-gray-300 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            disabled={loading}
            className={`border border-gray-300 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900
                        ${page === i + 1 ? 'bg-gray-200 dark:bg-slate-800 font-semibold' : ''}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
          className="border border-gray-300 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  </div>

  {/* View Submission Modal */}
  {viewUrl && (
    <Modal title="Submission Preview" onClose={() => setViewUrl(null)} widthClass="max-w-4xl text-gray-900 dark:text-slate-100">
      {(() => {
        const kind = getFileKind(viewUrl);
        if (kind === 'pdf') {
          return (
            <iframe
              src={viewUrl}
              className="w-full h-[70vh] border border-gray-200 dark:border-slate-700 rounded"
              title="PDF Preview"
            />
          );
        }
        if (kind === 'image') {
          return (
            <img
              src={viewUrl}
              alt="Submission"
              className="max-h-[70vh] w-auto mx-auto rounded border border-gray-200 dark:border-slate-700"
            />
          );
        }
        if (kind === 'video') {
          return (
            <video controls className="w-full rounded border border-gray-200 dark:border-slate-700 bg-black">
              <source src={viewUrl} />
              Your browser does not support HTML5 video.
            </video>
          );
        }
        return (
          <div className="text-sm">
            <p className="mb-3 text-gray-700 dark:text-slate-300">Preview not available for this file type.</p>
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
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
    <Modal title="Check Assignment" onClose={() => setCheckId(null)} widthClass="max-w-lg text-gray-900 dark:text-slate-100">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-slate-200">Obtained Marks</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-gray-900
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
            value={marks}
            onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 95"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-slate-200">Remarks</label>
          <textarea
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-gray-900
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Short feedback for the student"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button className="px-4 py-1 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800" onClick={() => setCheckId(null)}>
          Cancel
        </button>
        <button
          disabled={saving || marks === '' || Number.isNaN(Number(marks))}
          onClick={handleCheckSubmit}
          className="px-4 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )}

  {/* Update Deadline for ALL Modal */}
  {showAllDeadlineModal && (
    <Modal
      title="Update Deadline for All Students"
      onClose={() => setShowAllDeadlineModal(false)}
      widthClass="max-w-md text-gray-900 dark:text-slate-100"
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-1 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800" onClick={() => setShowAllDeadlineModal(false)}>
            Cancel
          </button>
          <button
            disabled={savingDeadline || !newDeadline}
            onClick={updateDeadlineForAll}
            className="px-4 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingDeadline ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-slate-400">
          {assignment?.assignmentTitle && <div className="font-medium text-gray-900 dark:text-slate-200">{assignment.assignmentTitle}</div>}
          {assignment?.firstDeadline && (
            <div className="font-medium">
              Current deadline: <strong className="text-gray-900 dark:text-slate-100">{formatDate(assignment.firstDeadline)}</strong>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-slate-200">New Deadline</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 text-sm bg-white text-gray-900
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )}

  {/* Update Deadline for ONE Student Modal */}
  {showStudentDeadlineModal && (
    <Modal
      title="Update Deadline for a Student"
      onClose={() => setShowStudentDeadlineModal(false)}
      widthClass="max-w-md text-gray-900 dark:text-slate-100"
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-1 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800" onClick={() => setShowStudentDeadlineModal(false)}>
            Cancel
          </button>
          <button
            disabled={savingDeadline || !studentId || !newDeadline}
            onClick={updateDeadlineForStudent}
            className="px-4 py-1 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
          >
            {savingDeadline ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {studentName && (
          <div className="text-sm">
            <span className="text-gray-600 dark:text-slate-400">Student:</span>{' '}
            <strong className="text-gray-900 dark:text-slate-100">{studentName}</strong>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-slate-200">New Deadline</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 text-sm bg-white text-gray-900
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )}
</main>

  );
}
