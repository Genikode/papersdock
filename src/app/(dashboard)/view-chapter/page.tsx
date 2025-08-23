'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import ImageModal from '@/components/ImageModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ChapterRow {
  id: string;
  title: string;
  courseName?: string;
  chapterImageUrl?: string;
  courseId?: string; // <- optional (useful if your API returns it)
}

interface GetAllChaptersResponse {
  status: number;
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    chapterImageUrl?: string;
    courseName?: string;
    courseId?: string; // <- optional if available
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function ViewChapter() {
  const router = useRouter();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Server-driven table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ChapterRow[]>([]);

  const columns: TableColumn[] = useMemo(
    () => [
      { header: 'Chapter ID', accessor: 'id' },
      { header: 'Chapter Name', accessor: 'title' },
      { header: 'Course', accessor: 'courseName' },
      {
        header: 'Chapter Image',
        accessor: 'chapterImageUrl',
        render: (_: string, row: ChapterRow) => (
          <button
            onClick={() => {
              if (!row.chapterImageUrl) return;
              setImageSrc(row.chapterImageUrl);
              setShowImageModal(true);
            }}
            className="border px-3 py-1 rounded text-sm disabled:opacity-40"
            disabled={!row.chapterImageUrl}
          >
            View
          </button>
        ),
      },
      // NEW COLUMN — Add Lecture
      {
        header: 'Add Lecture',
        accessor: 'addLecture',
        render: (_: any, row: ChapterRow) => (
          <button
            onClick={() =>
              router.push(
                `/view-lectures/${encodeURIComponent(row.id)
                }`
              )
            }
            className="inline-flex items-center gap-2 text-sm border px-3 py-1 rounded hover:bg-gray-50"
            title="Add a lecture to this chapter"
          >
            <PlusCircle size={16} />
            Add
          </button>
        ),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: any, row: ChapterRow) => (
          <div className="flex gap-3">
            <button
              className="text-blue-600 hover:text-blue-800"
              onClick={() => router.push(`/update-chapter/${row.id}`)}
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => {
                setDeleteRowId(row.id);
                setShowDeleteModal(true);
              }}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  async function fetchChapters() {
    setLoading(true);
    try {
      const res = await api.get<GetAllChaptersResponse>(
        '/chapters/get-all-chapters',
        { page: currentPage, limit: itemsPerPage, search: searchTerm }
      );

      const mapped: ChapterRow[] = res.data.map((c) => ({
        id: c.id,
        title: c.title,
        courseName: c.courseName,
        chapterImageUrl: c.chapterImageUrl,
        courseId: (c as any).courseId, // keep if backend returns it
      }));

      setRows(mapped);
      setTotalItems(res.pagination?.total ?? mapped.length);
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

  async function handleConfirmDelete() {
    if (!deleteRowId) return;
    try {
      await api.delete(`/chapters/delete-chapter/${deleteRowId}`);
      setShowDeleteModal(false);
      setDeleteRowId(null);
      fetchChapters(); // refresh
    } catch {
      setShowDeleteModal(false);
    }
  }

  return (
    <main className="bg-[#F9FAFB] text-gray-800">
      <PageHeader
        title="View Chapter"
        description="Manage your chapters"
        buttonText="Add Chapter"
        path="/add-chapter"
      />

      <div className="px-4 py-6">
        <div className="mb-3 text-sm text-gray-600">{loading ? 'Loading chapters…' : null}</div>
        <TableComponent
          columns={columns}
          data={rows}
          serverMode
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />
      </div>

      {showImageModal && imageSrc && (
        <ImageModal
          src={imageSrc}
          onClose={() => {
            setImageSrc(null);
            setShowImageModal(false);
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Confirm Deletion"
          description={`Are you sure you want to delete chapter ID: ${deleteRowId}?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
