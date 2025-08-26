'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type NoteRow = {
  id: string;
  title: string;
  courseName?: string;
  paper?: string;
  backgroundImageUrl?: string;
  attachmentUrl?: string;
  attachmentType?: 'dark' | 'light' | string;
  attachmentExtension?: string;
  createdByName?: string;
};

type NoteRowWithSno = NoteRow & { sno: number };

interface GetAllNotesResponse {
  status: number;
  success: boolean;
  message: string;
  data: NoteRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function ViewNotesPage() {
  const router = useRouter();

  // table (server-side) controls
  const [rows, setRows] = useState<NoteRowWithSno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // modals
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string | null>(null);

  const shortText = (t?: string, max = 60) =>
    (t ?? '').length > max ? (t ?? '').slice(0, max) + '…' : (t ?? '');

  const columns: TableColumn[] = useMemo(
    () => [
      // Replaced "ID" with "S.No"
      { header: 'S.No', accessor: 'sno' },
      { header: 'Title', accessor: 'title' },
      {
        header: 'Course',
        accessor: 'courseName',
        render: (value?: string) => (
          <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{value || '-'}</span>
        ),
      },
      {
        header: 'Paper',
        accessor: 'paper',
        render: (value?: string) => (
          <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{value || '-'}</span>
        ),
      },
      {
        header: 'Mode',
        accessor: 'attachmentType',
        render: (value?: string) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              value === 'dark'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {value || '-'}
          </span>
        ),
      },
      {
        header: 'Format',
        accessor: 'attachmentExtension',
        render: (value?: string) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {value?.toUpperCase() || '-'}
          </span>
        ),
      },
      {
        header: 'Background',
        accessor: 'backgroundImageUrl',
        render: (_: any, row: NoteRowWithSno) => (
          <button
            className="border px-3 py-1 rounded text-sm disabled:opacity-50"
            onClick={() => row.backgroundImageUrl && setBgPreview(row.backgroundImageUrl)}
            disabled={!row.backgroundImageUrl}
          >
            View
          </button>
        ),
      },
      {
        header: 'Attachment',
        accessor: 'attachmentUrl',
        render: (value?: string) =>
          value ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 border px-3 py-1 rounded text-sm"
            >
              <Eye size={14} /> Open
            </a>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: any, row: NoteRowWithSno) => (
          <div className="flex items-center gap-3">
            <button
              className="hover:text-blue-600"
              onClick={() => router.push(`/update-notes/${row.id}`)}
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="hover:text-red-600"
              onClick={() => {
                setDeleteId(row.id);
                setDeleteTitle(row.title); // show name in delete modal
              }}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await api.get<GetAllNotesResponse>('/notes/get-all-notes', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || '',
      });

      const list = res.data || [];
      const mapped: NoteRowWithSno[] = list.map((n, idx) => ({
        ...n,
        sno: (currentPage - 1) * itemsPerPage + idx + 1, // serial number per page
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
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

  async function deleteNote(id: string) {
    try {
      await api.delete(`/notes/delete-note/${id}`);
      setDeleteId(null);
      setDeleteTitle(null);
      // if last row on page was deleted, step back a page
      if (rows.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
      else fetchNotes();
    } catch {
      setDeleteId(null);
      setDeleteTitle(null);
    }
  }

  return (
    <main className="bg-[#F9FAFB] text-gray-800 min-h-screen">
      <PageHeader
        title="View Notes"
        description="Manage your notes"
        buttonText="Add Notes"
        path="/add-notes"
      />

      <div className="px-4 py-6">
        {loading && <p className="text-sm text-gray-500 mb-2">Loading notes…</p>}
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

      {/* Background preview modal */}
      {bgPreview && (
        <Modal title="Background Preview" onClose={() => setBgPreview(null)}>
          <img
            src={bgPreview}
            alt="background"
            className="w-full h-auto rounded border"
          />
        </Modal>
      )}

      {/* Delete confirm modal with note title */}
      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => { setDeleteId(null); setDeleteTitle(null); }}>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <strong>“{shortText(deleteTitle || 'this note')}”</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setDeleteId(null); setDeleteTitle(null); }}
              className="px-4 py-1 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteNote(deleteId)}
              className="px-4 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
