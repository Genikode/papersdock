'use client';

import { useEffect, useMemo, useState } from 'react';
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
  lectureTitle: string;      // list response uses lectureTitle
  chapterTitle: string;
  courseTitle: string;
  videoUrl: string;          // direct video url (mp4/webm/etc.)
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
  const [rows, setRows] = useState<LectureListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>(
    routeParamChapter || qsChapter || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  /* Modals */
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /* Columns for TableComponent */
  const columns: TableColumn[] = useMemo(
    () => [
      { header: 'Lecture ID', accessor: 'id' },
      { header: 'Lecture Name', accessor: 'lectureTitle' },
      { header: 'Chapter Name', accessor: 'chapterTitle' },
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
        // IMPORTANT: read the url from the row to avoid undefined "value"
        render: (_: string, row: LectureListItem) => (
          <button
            type="button"
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => row.videoUrl && setSelectedVideo(row.videoUrl)}
            disabled={!row.videoUrl}
          >
            View
          </button>
        ),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: any, row: LectureListItem) => (
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
              onClick={() => setPendingDeleteId(row.id)}
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
          // API has a single "search" param; we use whatever is typed
          search: searchTerm || '',
        }
      );
      setRows(res.data || []);
      console.log('Fetched lectures:', res.data);
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

  /* Delete */
  async function deleteLecture(id: string) {
    try {
      await api.delete(`/lectures/delete-lecture/${id}`);
      setPendingDeleteId(null);
      // If last item on a page was deleted, go back one page
      if (rows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchLectures();
      }
    } catch {
      setPendingDeleteId(null);
    }
  }

  return (
    <main className="bg-[#F9FAFB] min-h-screen p-4">
      <PageHeader
        title="View Lectures"
        description="Manage your lectures"
        buttonText="Add Lecture"
        path="/add-lecture"
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

      {/* Video preview modal (plain HTML5 video) */}
      {selectedVideo && (
        <Modal onClose={() => setSelectedVideo(null)} title="Lecture Preview" key={selectedVideo}>
          <video className="w-full" controls>
            <source src={selectedVideo} />
            Your browser does not support HTML5 video.
          </video>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <Modal title="Confirm Delete" onClose={() => setPendingDeleteId(null)}>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete this lecture?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingDeleteId(null)}
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
  );
}
