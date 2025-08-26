'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import { Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

/* =========================
   Types to match your API
========================= */

interface LectureListItem {
  id: string;
  lectureTitle: string;
  chapterTitle: string;
  courseTitle: string;
  videoUrl: string;
  createdAt: string;
  createdByName?: string;
}

interface GetAllLecturesResponse {
  status: number;
  success: boolean;
  message: string;
  data: LectureListItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface GetLectureByIdResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    courseId: string;
    chapterId: string;
    videoUrl: string;
    presentationUrl?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy?: string | null;
  };
}

/* Row used by the table: adds serial # without exposing ID column */
type LectureRow = LectureListItem & { sno: number };

/* =========================
          Page
========================= */

export default function ViewLecturePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Optional default filter by chapterTitle via route or query (?chapterTitle=)
  const routeParamChapter =
    typeof (params as any)?.chapterTitle === 'string'
      ? (params as any).chapterTitle
      : undefined;
  const qsChapter = searchParams?.get('chapterTitle') || undefined;

  /* Server-driven table state */
  const [rows, setRows] = useState<LectureRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>(
    routeParamChapter || qsChapter || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  /* Video Modal */
  const [videoLoading, setVideoLoading] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedLectureTitle, setSelectedLectureTitle] = useState<string | null>(null);

  /* Delete Modal */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState<string | null>(null);

  const shortText = (t?: string, max = 40) =>
    (t ?? '').length > max ? (t ?? '').slice(0, max) + '…' : (t ?? '');

  /* Columns for TableComponent */
  const columns: TableColumn[] = useMemo(
    () => [
      // Replaced Lecture ID with S.No
      { header: 'S.No', accessor: 'sno' },
      { header: 'Lecture Name', accessor: 'lectureTitle' },
      { header: 'Chapter Title', accessor: 'chapterTitle' },
      {
        header: 'Courses',
        accessor: 'courseTitle',
        render: (value: string) => (
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
            {value || '-'}
          </span>
        ),
      },
      {
        header: 'Created',
        accessor: 'createdAt',
        render: (value: string) =>
          new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
      },
      {
        header: 'Lecture Video',
        accessor: 'videoUrl',
        // Fetch by ID -> open modal with fetched video + title
        render: (_: string, row: LectureRow) => (
          <button
            type="button"
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => openLecture(row.id)}
          >
            View
          </button>
        ),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: any, row: LectureRow) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hover:text-blue-600"
              onClick={() => router.push(`/update-lectures/${row.id}`)}
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="hover:text-red-600"
              onClick={() => {
                setPendingDeleteId(row.id);
                setPendingDeleteTitle(row.lectureTitle); // show name in delete modal
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

  /* Fetch list */
  async function fetchLectures() {
    setLoading(true);
    try {
      const res = await api.get<GetAllLecturesResponse>(
        '/lectures/get-all-lectures',
        {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || '',
        }
      );
      const list = res.data || [];
      const mapped: LectureRow[] = list.map((item, idx) => ({
        ...item,
        sno: (currentPage - 1) * itemsPerPage + idx + 1,
      }));
      setRows(mapped);
      setTotalItems(res.pagination?.total ?? 0);
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

  /* Fetch detail by ID for video modal */
  async function openLecture(id: string) {
    setVideoLoading(true);
    try {
      const res = await api.get<GetLectureByIdResponse>(`/lectures/admin/get-lecture/${id}`);
      const detail = res.data;
      if (detail?.videoUrl) {
        setSelectedVideoUrl(detail.videoUrl);
        setSelectedLectureTitle(detail.title || 'Lecture Preview');
      } else {
        setSelectedVideoUrl(null);
        setSelectedLectureTitle('Video not available');
      }
    } catch {
      setSelectedVideoUrl(null);
      setSelectedLectureTitle('Failed to load lecture');
    } finally {
      setVideoLoading(false);
    }
  }

  /* Delete */
  async function deleteLecture(id: string) {
    try {
      await api.delete(`/lectures/delete-lecture/${id}`);
      setPendingDeleteId(null);
      setPendingDeleteTitle(null);
      // If last item on a page was deleted, go back one page
      if (rows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchLectures();
      }
    } catch {
      setPendingDeleteId(null);
      setPendingDeleteTitle(null);
    }
  }

  return (
    <Suspense fallback={<div>Loading lectures...</div>}>
      <main className="bg-[#F9FAFB] min-h-screen p-4 ">
        <PageHeader
          title="View Lectures"
          description="Manage your lectures"
          buttonText="Add Lecture"
          path="/add-lectures"
        />

        <div className="px-2 py-4">
          {loading && <p className="text-sm text-gray-500 mb-2">Loading lectures…</p>}

          <TableComponent
            columns={columns}
            data={rows}
            serverMode
            /* server-side search */
            searchTerm={searchTerm}
            onSearchTermChange={(v) => {
              setCurrentPage(1);
              setSearchTerm(v);
            }}
            /* server-side pagination */
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

        {/* Video preview modal (fetched by ID) */}
        {selectedLectureTitle && (
          <Modal
            onClose={() => {
              setSelectedVideoUrl(null);
              setSelectedLectureTitle(null);
            }}
            title={selectedLectureTitle}
            key={selectedLectureTitle + (selectedVideoUrl ?? '')}
          >
            {videoLoading ? (
              <div className="py-8 text-center text-sm text-gray-600">Loading video…</div>
            ) : selectedVideoUrl ? (
              <video className="w-full" controls>
                <source src={selectedVideoUrl} />
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <div className="py-8 text-center text-sm text-gray-600">No video available</div>
            )}
          </Modal>
        )}

        {/* Delete confirmation modal with lecture name */}
        {pendingDeleteId && (
          <Modal title="Confirm Delete" onClose={() => { setPendingDeleteId(null); setPendingDeleteTitle(null); }}>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete{' '}
              <strong>“{shortText(pendingDeleteTitle || 'this lecture')}”</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setPendingDeleteId(null); setPendingDeleteTitle(null); }}
                className="px-4 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteLecture(pendingDeleteId)}
                className="px-4 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </Modal>
        )}
      </main>
    </Suspense>
  );
}
