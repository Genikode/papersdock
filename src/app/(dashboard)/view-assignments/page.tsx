'use client';

import { useEffect, useMemo, useState } from 'react';
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

// Row type with serial number
type AssignmentRow = AssignmentListItem & { sno: number };

interface GetAllAssignmentsResponse {
  status: number;
  success: boolean;
  message: string;
  data: AssignmentListItem[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export default function ViewAssignments() {
  const router = useRouter();

  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // server-driven table state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState<string | null>(null);

  const shortText = (t?: string, max = 60) =>
    (t ?? '').length > max ? (t ?? '').slice(0, max) + '…' : (t ?? '');

  const columns: TableColumn[] = useMemo(
    () => [
      // Replaced "Assignment ID" with "S.No"
      { header: 'S.No', accessor: 'sno' },
      { header: 'Title', accessor: 'assignmentTitle' },
      { header: 'Description', accessor: 'description' },
      {
        header: 'Course',
        accessor: 'courseTitle',
        render: (value: string) => (
          <span className="border rounded-full px-2 py-0.5 text-xs bg-white text-gray-700">
            {value || '-'}
          </span>
        ),
      },
      {
        header: 'Deadline',
        accessor: 'firstDeadline',
        render: (value: string) => (value ? new Date(value).toLocaleDateString() : '-'),
      },

      {
        header: 'Status',
        accessor: 'status',
        render: (value: string) => {
          const color =
            value === 'Active'
              ? 'bg-green-100 text-green-800'
              : value === 'Completed'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-600';
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
              onClick={() => router.push(`/update-assignment/${row.id}`)}
            >
              <Edit2 size={16} />
            </button>
            <button
              className="hover:text-red-600"
              title="Delete"
              onClick={() => {
                setPendingDeleteId(row.id);
                setPendingDeleteTitle(row.assignmentTitle); // show assignment name in dialog
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

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await api.get<GetAllAssignmentsResponse>('/assignments/get-all-assignments', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || '',
      });

      const list = Array.isArray(res.data) ? res.data : [];
      const mapped: AssignmentRow[] = list.map((item, idx) => ({
        ...item,
        sno: (currentPage - 1) * itemsPerPage + idx + 1, // serial number
      }));

      setRows(mapped);
      setTotalItems(res.pagination?.total ?? list.length);
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

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
    <main className="bg-[#F9FAFB] text-gray-800 min-h-screen">
      <PageHeader
        title="All Assignments"
        description="Track all assignment activities"
        buttonText="Add Assignment"
        path="/add-assignment"
      />

      <div className="px-4 py-6">
        {loading && <p className="text-sm text-gray-500 mb-2">Loading assignments…</p>}
        <TableComponent
          columns={columns}
          data={rows}
          serverMode
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setCurrentPage(1);
            setSearchTerm(v);
          }}
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

      {/* Assignment file preview (simple) */}
      {fileUrl && (
        <Modal title="Assignment File" onClose={() => setFileUrl(null)}>
          <div className="space-y-3">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 text-sm"
            >
              <Eye size={16} /> Open in new tab
            </a>
            {/\.(pdf)$/i.test(fileUrl) && (
              <iframe className="w-full aspect-video rounded border" src={fileUrl} />
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirmation shows assignment name */}
      {pendingDeleteId && (
        <ConfirmationModal
          title="Delete Assignment"
          description={
            `Are you sure you want to delete “${shortText(pendingDeleteTitle || 'this assignment')}”?`
          }
          onCancel={() => { setPendingDeleteId(null); setPendingDeleteTitle(null); }}
          onConfirm={handleDelete}
        />
      )}
    </main>
  );
}
