'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import { Edit, Trash2, PlusCircle, Copy } from 'lucide-react';
import ImageModal from '@/components/ImageModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import Modal from '@/components/Modal';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ChapterRow {
  sno: number;         // serial number for table
  id: string;          // internal id
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

type CourseItem = { id: string; title: string };

const COPY_ENDPOINT = '/chapters/copy-chapter'; // <-- change if your backend path differs

export default function ViewChapter() {
  const router = useRouter();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [deleteRowTitle, setDeleteRowTitle] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Filter by course
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);

  // Server-driven table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ChapterRow[]>([]);

  // Copy modal state
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySource, setCopySource] = useState<{ id: string; title: string; courseId?: string } | null>(null);
  const [copyTargetCourseId, setCopyTargetCourseId] = useState<string>('');
  const [copying, setCopying] = useState(false);

  // messages
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // helper to shorten title for delete dialog
  const shortTitle = (t?: string) =>
    (t ?? '').length > 30 ? (t ?? '').slice(0, 30) + '…' : (t ?? '');

  const columns: TableColumn[] = useMemo(
    () => [
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
            className="inline-flex items-center gap-2 text-sm border px-3 py-1 rounded hover:bg-green-50 hover:text-black"
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

            {/* NEW: Copy Chapter */}
            <button
              className="text-gray-700 hover:text-gray-900"
              onClick={() => openCopyModal(row)}
              title="Copy chapter to another course"
            >
              <Copy size={18} />
            </button>

            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => {
                setDeleteRowId(row.id);
                setDeleteRowTitle(row.title);
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
        { page: currentPage, limit: itemsPerPage, search: searchTerm, courseId: courseId || undefined }
      );

      const list = res.data ?? [];
      const mapped: ChapterRow[] = list.map((c, idx) => ({
        sno: (currentPage - 1) * itemsPerPage + idx + 1,
        id: c.id,
        title: c.title,
        courseName: c.courseName,
        chapterImageUrl: c.chapterImageUrl,
        courseId: c.courseId,
      }));

      setRows(mapped);
      setTotalItems(res.pagination?.total ?? mapped.length);
    } catch (e: any) {
      setRows([]);
      setTotalItems(0);
      setErrorMsg(e?.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      const res: any = await api.get('/courses/get-all-courses', { page: 1, limit: 100 });
      const list: CourseItem[] = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      setCourses(list);
    } catch {
      setCourses([]);
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
      setInfoMsg('Chapter deleted.');
      fetchChapters();
    } catch (e: any) {
      setShowDeleteModal(false);
      setErrorMsg(e?.message || 'Failed to delete');
    }
  }

  /* ---------------- Copy chapter ---------------- */
  function openCopyModal(row: ChapterRow) {
    setCopySource({ id: row.id, title: row.title, courseId: row.courseId });
    // default target: first course that isn't the source's course
    const defaultTarget =
      courses.find((c) => c.id !== row.courseId)?.id || (courses[0]?.id ?? '');
    setCopyTargetCourseId(defaultTarget);
    setCopyOpen(true);
    setInfoMsg(null);
    setErrorMsg(null);
  }

  async function handleCopySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!copySource?.id || !copyTargetCourseId) return;
    if (copyTargetCourseId === copySource.courseId) {
      setErrorMsg('Please choose a different course as the target.');
      return;
    }
    setCopying(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await api.post(COPY_ENDPOINT, {
        chapterId: copySource.id,
        courseId: copyTargetCourseId,
      });
      setCopyOpen(false);
      setCopySource(null);
      setInfoMsg('Chapter copied successfully.');
      // refresh if your list should reflect the new chapter
      fetchChapters();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to copy chapter');
    } finally {
      setCopying(false);
    }
  }

  return (
<main className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <PageHeader
    title="View Chapter"
    description="Manage your chapters"
    buttonText="Add Chapter"
    path="/add-chapter"
  />

  <div className="px-4 py-6">
    {(infoMsg || errorMsg) && (
      <div
        className={`mb-3 text-sm px-3 py-2 rounded border ${
          errorMsg
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400'
            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-900 dark:text-green-400'
        }`}
      >
        {errorMsg || infoMsg}
      </div>
    )}

    <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">
      {loading ? 'Loading chapters…' : null}
    </div>

    <TableComponent
      columns={columns}
      data={rows}
      serverMode
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
      toolbarLeft={
        <select
          value={courseId ?? ''}
          onChange={(e) => {
            setCourseId(e.target.value || null);
            setCurrentPage(1);
          }}
          className="border rounded text-sm px-3 py-1
                     border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      }
    />
  </div>

  {/* Image viewer */}
  {showImageModal && imageSrc && (
    <ImageModal
      src={imageSrc}
      onClose={() => {
        setImageSrc(null);
        setShowImageModal(false);
      }}
    />
  )}

  {/* Delete confirmation */}
  {showDeleteModal && (
    <ConfirmationModal
      title="Confirm Deletion"
      description={`Are you sure you want to delete chapter: "${shortTitle(deleteRowTitle ?? '')}"?`}
      onCancel={() => setShowDeleteModal(false)}
      onConfirm={handleConfirmDelete}
    />
  )}

  {/* Copy chapter modal */}
  {copyOpen && copySource && (
    <Modal title="Copy Chapter" onClose={() => setCopyOpen(false)} >
      <form onSubmit={handleCopySubmit} className="space-y-4" >
        <div className="text-sm">
          <p className="text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">Chapter:</span> {copySource.title}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            Copy to Course
          </label>
          <select
            value={copyTargetCourseId}
            onChange={(e) => setCopyTargetCourseId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm
                       border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === copySource.courseId}>
                {c.title}{c.id === copySource.courseId ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCopyOpen(false)}
            className="px-4 py-1.5 rounded border
                       border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded text-white bg-[#0B1537] dark:bg-[#0B1537] disabled:opacity-50"
          >
            {copying ? 'Copying…' : 'Copy Chapter'}
          </button>
        </div>
      </form>
    </Modal>
  )}
</main>

  );
}
