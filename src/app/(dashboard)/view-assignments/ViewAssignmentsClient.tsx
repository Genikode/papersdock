'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AssignmentListItem {
  id: string;
  assignmentTitle: string;
  description: string;
  firstDeadline?: string;
  lastDeadline?: string;
  assignmentFile?: string;
  status?: string;
  totalMarks?: number;
  courseTitle?: string;
  courseId?: string;
  createdByName?: string;
  createdAt?: string;
}
type AssignmentRow = AssignmentListItem & { sno: number };

interface GetAllAssignmentsResponse {
  status: number;
  success: boolean;
  message: string;
  data: AssignmentListItem[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

type InitialSearchParams = {
  q: string;
  page: number;
  limit: number;
  courseId: string | null;
};

function shortText(t?: string, max = 60) {
  return (t ?? '').length > max ? (t ?? '').slice(0, max) + '…' : (t ?? '');
}

function fmtDate(v?: string) {
  return v
    ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
    : '—';
}

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function fileKind(url: string) {
  const m = url.split('?')[0].toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(m)) return 'image';
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(m)) return 'video';
  if (/\.(pdf)$/.test(m)) return 'pdf';
  return 'other';
}

export default function ViewAssignments({
  basePath,
  initialSearchParams,
}: {
  basePath: string;
  initialSearchParams: InitialSearchParams;
}) {
  const router = useRouter();

  // table state
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // server-driven table state (initialized from server)
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchParams.q);
  const [currentPage, setCurrentPage] = useState<number>(initialSearchParams.page || 1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialSearchParams.limit || 10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [courseId, setCourseId] = useState<string | null>(initialSearchParams.courseId);

  // courses
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  // delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState<string | null>(null);

  // debounced inputs for fetching
  const debouncedSearch = useDebounced(searchTerm, 350);
  const debouncedCourseId = useDebounced(courseId, 350);
  const debouncedPage = useDebounced(currentPage, 0); // no delay when paging
  const debouncedLimit = useDebounced(itemsPerPage, 0);

  // prevent race conditions / duplicate fetches
  const fetchIdRef = useRef(0);
  const lastQueryRef = useRef<string>('');

  // keep URL in sync WITHOUT triggering Next.js navigation/remount
  useEffect(() => {
    const sp = new URLSearchParams();
    if (debouncedSearch) sp.set('q', debouncedSearch);
    if (debouncedCourseId) sp.set('courseId', debouncedCourseId);
    if (debouncedPage > 1) sp.set('page', String(debouncedPage));
    if (debouncedLimit !== 10) sp.set('limit', String(debouncedLimit));
    const qs = sp.toString();
    const next = qs ? `${basePath}?${qs}` : basePath;
    const current = window.location.pathname + window.location.search;
    if (next !== current) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [debouncedSearch, debouncedCourseId, debouncedPage, debouncedLimit, basePath]);

  const columns: TableColumn[] = useMemo(
    () => [
      { header: 'S.No', accessor: 'sno' },
      { header: 'Title', accessor: 'assignmentTitle' },
      {
        header: 'Description',
        accessor: 'description',
        render: (value: string) => <span title={value || ''}>{shortText(value, 30)}</span>,
      },
      {
        header: 'Course',
        accessor: 'courseTitle',
        render: (value: string) => (
          <span className="border rounded-full px-2 py-0.5 text-xs bg-white text-gray-700">
            {value || '—'}
          </span>
        ),
      },
      { header: 'Deadline', accessor: 'firstDeadline', render: (v: string) => <span>{fmtDate(v)}</span> },
      {
        header: 'Status',
        accessor: 'status',
        render: (value: string) => {
          const map: Record<string, string> = {
            Active: 'bg-green-100 text-green-800',
            Completed: 'bg-blue-100 text-blue-800',
            Pending: 'bg-yellow-100 text-yellow-800',
          };
          const color = map[value] ?? 'bg-gray-100 text-gray-600';
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
              {value || '—'}
            </span>
          );
        },
      },
      {
        header: 'File',
        accessor: 'assignmentFile',
        render: (_: string, row: AssignmentRow) => (
          <button
            className="border px-3 py-1 rounded text-sm disabled:opacity-50"
            onClick={() => row.assignmentFile && setFileUrl(row.assignmentFile)}
            disabled={!row.assignmentFile}
            aria-label={row.assignmentFile ? 'Preview assignment file' : 'No file'}
            title={row.assignmentFile ? 'Preview' : 'No file'}
          >
            View
          </button>
        ),
      },
      {
        header: 'Submissions',
        accessor: 'view',
        render: (_: unknown, row: AssignmentRow) => (
          <button
            className="border px-3 py-1 rounded text-sm"
            onClick={() => {
              const qs = row.courseId ? `?courseId=${encodeURIComponent(row.courseId)}` : '';
              router.push(`/submission/${encodeURIComponent(row.id)}${qs}`);
            }}
            title="View submissions"
            aria-label="View submissions"
          >
            View
          </button>
        ),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: unknown, row: AssignmentRow) => (
          <div className="flex gap-2">
            <button
              className="hover:text-blue-600"
              title="Edit"
              aria-label="Edit"
              onClick={() => router.push(`/update-assignment/${row.id}`)}
            >
              <Edit2 size={16} />
            </button>
            <button
              className="hover:text-red-600"
              title="Delete"
              aria-label="Delete"
              onClick={() => {
                setPendingDeleteId(row.id);
                setPendingDeleteTitle(row.assignmentTitle);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  const fetchAssignments = useCallback(async () => {
    const key = JSON.stringify({
      page: debouncedPage,
      limit: debouncedLimit,
      search: debouncedSearch || '',
      courseId: debouncedCourseId || '',
    });
    if (key === lastQueryRef.current) {
      return; // nothing changed; skip
    }
    lastQueryRef.current = key;

    setLoading(true);
    setErrorMsg(null);
    const reqId = ++fetchIdRef.current;

    try {
      const res = await api.get<GetAllAssignmentsResponse>('/assignments/get-all-assignments', {
        page: debouncedPage,
        limit: debouncedLimit,
        search: debouncedSearch || '',
        courseId: debouncedCourseId || '',
      });

      if (fetchIdRef.current !== reqId) return; // ignore stale

      const list = Array.isArray(res.data) ? res.data : [];
      const mapped: AssignmentRow[] = list.map((item, idx) => ({
        ...item,
        sno: (debouncedPage - 1) * debouncedLimit + idx + 1,
      }));

      setRows(mapped);
      setTotalItems(res.pagination?.total ?? list.length);
    } catch {
      if (fetchIdRef.current !== reqId) return;
      setRows([]);
      setTotalItems(0);
      setErrorMsg('Failed to load assignments. Please try again.');
    } finally {
      if (fetchIdRef.current === reqId) setLoading(false);
    }
  }, [debouncedCourseId, debouncedLimit, debouncedPage, debouncedSearch]);

  const fetchCourses = useCallback(async () => {
    try {
      const res: any = await api.get('/courses/get-all-courses', { page: 1, limit: 100 });
      const list = res.data ?? [];
      setCourses(list);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  async function handleDelete() {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/assignments/delete-assignment/${pendingDeleteId}`);
      setPendingDeleteId(null);
      setPendingDeleteTitle(null);
      if (rows.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
      else fetchAssignments();
    } catch {
      setPendingDeleteId(null);
      setPendingDeleteTitle(null);
    }
  }

  return (
    <main className="text-gray-800 min-h-[100dvh]">
      <PageHeader
        title="All Assignments"
        description="Track all assignment activities"
        buttonText="Add Assignment"
        path="/add-assignment"
      />

      <div className="px-4 py-6">
        {/* Reserve height so layout doesn't jump */}
        <div className="h-5 mb-2">
          {loading && <p className="text-sm text-gray-500">Loading assignments…</p>}
        </div>

        {errorMsg && (
          <div className="mb-3 text-sm px-3 py-2 rounded border bg-red-50 border-red-200 text-red-700">
            {errorMsg}
          </div>
        )}

        <TableComponent
          columns={columns}
          data={rows}
          serverMode
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setCurrentPage(1);
            setSearchTerm(v);
          }}
          toolbarLeft={
            courses.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={courseId || ''}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setCourseId(e.target.value || null);
                  }}
                  className="p-2 border rounded dark:bg-slate-900 dark:text-slate-50 dark:border-slate-600"
                  aria-label="Filter by course"
                >
                  <option value="">All Courses</option>
                  {courses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                {(courseId || searchTerm) && (
                  <button
                    type="button"
                    className="text-xs border rounded px-2 py-1"
                    onClick={() => {
                      setCourseId(null);
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    aria-label="Clear filters"
                    title="Clear filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : null
          }
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setCurrentPage(1);
            setItemsPerPage(n);
          }}
          totalItems={totalItems}
        />
      </div>

      {fileUrl && (
        <Modal title="Assignment File" onClose={() => setFileUrl(null)}>
          <div className="space-y-3">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-indigo-600 text-sm"
            >
              <Eye size={16} /> Open in new tab
            </a>

            {(() => {
              const kind = fileKind(fileUrl);
              if (kind === 'pdf') {
                return <iframe className="w-full aspect-video rounded border" src={fileUrl} title="PDF Preview" />;
              }
              if (kind === 'image') {
                // eslint-disable-next-line @next/next/no-img-element
                return (
                  <img
                    src={fileUrl}
                    alt="Attachment"
                    className="max-h-[70vh] mx-auto rounded border block w-auto h-auto"
                  />
                );
              }
              if (kind === 'video') {
                return (
                  <video className="w-full rounded border aspect-video" controls>
                    <source src={fileUrl} />
                  </video>
                );
              }
              return (
                <p className="text-sm text-gray-600">
                  Preview not available for this file type. Use the link above to open it.
                </p>
              );
            })()}
          </div>
        </Modal>
      )}

      {pendingDeleteId && (
        <ConfirmationModal
          title="Delete Assignment"
          description={`Are you sure you want to delete “${shortText(pendingDeleteTitle || 'this assignment')}”?`}
          onCancel={() => {
            setPendingDeleteId(null);
            setPendingDeleteTitle(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </main>
  );
}
