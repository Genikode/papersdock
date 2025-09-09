'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import { ArrowLeft, Edit2, Link, Trash2 } from 'lucide-react';
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
interface ChapterDetail {
  staus: number;
  success: boolean;
  message: string;
  data: [
  {
    id: string;
    title: string;
    chapterImageUrl?: string;
    atachmentExtension?: string;
    courseId: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    createdBy: string;
    updatedBy?: string | null;
  }
  ]

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
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
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
      render: (value?: string) => (
        <span className="text-slate-700 dark:text-slate-300">
          {value
            ? new Date(value).toLocaleDateString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Lecture Video',
      accessor: 'videoUrl',
      render: (_: string, row: LectureRow) => (
        <button
          type="button"
          className="px-3 py-1 rounded text-sm disabled:opacity-50
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     hover:bg-slate-50 dark:hover:bg-slate-800
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60"
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
            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => router.push(`/update-lectures/${row.id}`)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
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
async function fetchChapterByChapterId() {
    if (!chapterId) return;
    setLoading(true);
    try {
      const res = await api.get<ChapterDetail>(
        `/chapters/get-chapter/${chapterId}`
      );
      const list = res.data;
      console.log('Chapter details:', list);
      if (list && list.length > 0) {
        setChapterTitle(list[0].title);
      }
    } catch {
      console.error('Failed to fetch chapter details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChapterByChapterId();
  }, [chapterId]);
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
  <Suspense
  fallback={
    <div className="p-4 text-sm text-slate-600 dark:text-slate-400">Loading lectures...</div>
  }
>
  <main className="min-h-screen p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    {/* Back button */}
    <div className="mb-4">
      <ArrowLeft
        size={20}
        className="cursor-pointer text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        onClick={() => router.back()}
      />
    </div>

    <PageHeader
      title="View Lectures"
      description={`Lectures for ${chapterTitle || 'the selected chapter'}`}
      buttonText="Add Lecture"
      path="/add-lectures"
    />

    <div className="px-2 py-4">
      {loading && (
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Loading lectures…</p>
      )}

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
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Loading video…
          </div>
        ) : selectedVideoUrl ? (
          <video
            className="w-full rounded-md ring-1 ring-slate-200 dark:ring-slate-800 bg-black/5 dark:bg-black"
            controls
          >
            <source src={selectedVideoUrl} />
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            No video available
          </div>
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
        <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
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
            className="px-4 py-1 rounded border
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       border-slate-300 dark:border-slate-700
                       hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteLecture(pendingDeleteId)}
            className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
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
