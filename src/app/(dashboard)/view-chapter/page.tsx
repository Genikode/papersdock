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
  sno: number;         // <-- NEW: serial number for table
  id: string;          // kept internally, not shown in table
  title: string;
  courseName?: string;
  chapterImageUrl?: string;
  courseId?: string;
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
    courseId?: string;
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function ViewChapter() {
  const router = useRouter();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [deleteRowTitle, setDeleteRowTitle] = useState<string | null>(null); // <-- NEW
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null); // filter by course
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  // Server-driven table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ChapterRow[]>([]);

  // helper to shorten title for delete dialog
  const shortTitle = (t?: string) =>
    (t ?? '').length > 30 ? (t ?? '').slice(0, 30) + '…' : (t ?? '');

  const columns: TableColumn[] = useMemo(
    () => [
      // REPLACED: Chapter ID -> S.No
      { header: 'S.No', accessor: 'sno' },
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
      {
        header: 'Add Lecture',
        accessor: 'addLecture',
        render: (_: any, row: ChapterRow) => (
          <button
            onClick={() => router.push(`/view-lectures/${row.id}`)}
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
                setDeleteRowTitle(row.title); // <-- capture title for dialog
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
        { page: currentPage, limit: itemsPerPage, search: searchTerm, courseId:courseId }
      );

      const list = res.data ?? [];
      const mapped: ChapterRow[] = list.map((c, idx) => ({
        sno: (currentPage - 1) * itemsPerPage + idx + 1, // <-- serial number
        id: c.id,
        title: c.title,
        courseName: c.courseName,
        chapterImageUrl: c.chapterImageUrl,
        courseId: (c as any).courseId,
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
async function fetchCourses() {
    try {
      const res: any = await api.get('/courses/get-all-courses', { page: 1, limit: 100 });
      const list = res.data ?? [];
      if (list.length > 0) {
        setCourses(list);
        // setCourseId(list[0].id); // default to first course
      }
    } catch {
      setCourseId(null);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);
  useEffect(() => {
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, courseId]);

  async function handleConfirmDelete() {
    if (!deleteRowId) return;
    try {
      await api.delete(`/chapters/delete-chapter/${deleteRowId}`);
      setShowDeleteModal(false);
      setDeleteRowId(null);
      setDeleteRowTitle(null);
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
          toolbarLeft={
            <select
              value={courseId ?? ''}
              onChange={(e) => setCourseId(e.target.value)}
              className="border px-3 py-1 rounded text-sm"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          }

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
          // Show short chapter name instead of ID
          description={`Are you sure you want to delete chapter: "${shortTitle(deleteRowTitle ?? '')}"?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
