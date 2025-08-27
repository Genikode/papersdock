'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import { Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';


interface LectureByChapterApiItem {
  id: string;
  title: string;          
  courseId: string;
  chapterId: string;
  videoUrl?: string;
  presentationUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string | null;
}

interface GetLecturesByChapterResponse {
  status: number;
  success: boolean;
  message: string;
  data: LectureByChapterApiItem[];
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

type LectureRow = {
  id: string;
  sno: number;
  lectureTitle: string;
  videoUrl?: string;
  createdAt?: string;
};



export default function ViewLecturePage() {
  const router = useRouter();
  const params = useParams<{ chapterId: string }>();
  const chapterId = typeof params?.chapterId === 'string' ? params.chapterId : '';

  const [rows, setRows] = useState<LectureRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* Video Modal */
  const [videoLoading, setVideoLoading] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedLectureTitle, setSelectedLectureTitle] = useState<string | null>(null);

  /* Delete Modal */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState<string | null>(null);

  const shortText = (t?: string, max = 40) =>
    (t ?? '').length > max ? (t ?? '').slice(0, max) + '…' : (t ?? '');

  /* Columns (no ID; S.No first) */
  const columns: TableColumn[] = useMemo(
    () => [
      { header: 'S.No', accessor: 'sno' },
      { header: 'Lecture Name', accessor: 'lectureTitle' },
      {
        header: 'Created',
        accessor: 'createdAt',
        render: (value?: string) =>
          value
            ? new Date(value).toLocaleDateString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : '—',
      },
      {
        header: 'Lecture Video',
        accessor: 'videoUrl',
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
                setPendingDeleteTitle(row.lectureTitle);
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

  /* Fetch lectures by chapterId (ADMIN endpoint) */
  async function fetchLecturesByChapter() {
    if (!chapterId) return;
    setLoading(true);
    try {
      const res = await api.get<GetLecturesByChapterResponse>(
        `/lectures/admin/get-lectures-by-chapter/${chapterId}`
      );
      const list = Array.isArray(res.data) ? res.data : [];

      const mapped: LectureRow[] = list.map((item, idx) => ({
        id: item.id,
        sno: idx + 1, // sequential across entire dataset (TableComponent paginates locally)
        lectureTitle: item.title || 'Untitled',
        videoUrl: item.videoUrl,
        createdAt: item.createdAt,
      }));

      setRows(mapped);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLecturesByChapter();
    
  }, [chapterId]);

  
  async function openLecture(id: string) {
    setVideoLoading(true);
    try {
      const res = await api.get<GetLectureByIdResponse>(`/lectures/admin/get-lecture/${id}`);
      const detail = res.data;
      if (detail?.videoUrl) {
        setSelectedLectureTitle(detail.title || 'Lecture Preview');
        setSelectedVideoUrl(detail.videoUrl);
      } else {
        setSelectedLectureTitle('Video not available');
        setSelectedVideoUrl(null);
      }
    } catch {
      setSelectedLectureTitle('Failed to load lecture');
      setSelectedVideoUrl(null);
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
      // Refresh list
      fetchLecturesByChapter();
    } catch {
      setPendingDeleteId(null);
      setPendingDeleteTitle(null);
    }
  }

  return (
    <Suspense fallback={<div>Loading lectures...</div>}>
      <main className="bg-[#F9FAFB] min-h-screen p-4">
        <PageHeader
          title="View Lectures"
          description={`Lectures for Chapter ID: ${chapterId}`}
          buttonText="Add Lecture"
          path="/add-lectures"
        />

        <div className="px-2 py-4">
          {loading && <p className="text-sm text-gray-500 mb-2">Loading lectures…</p>}

          {/* Local (client) search & pagination handled by TableComponent */}
          <TableComponent
            columns={columns}
            data={rows}
            /* serverMode omitted -> local mode:
               - built-in search box works
               - local pagination works
            */
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
          <Modal
            title="Confirm Delete"
            onClose={() => {
              setPendingDeleteId(null);
              setPendingDeleteTitle(null);
            }}
          >
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete{' '}
              <strong>“{shortText(pendingDeleteTitle || 'this lecture')}”</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteId(null);
                  setPendingDeleteTitle(null);
                }}
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
