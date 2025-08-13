'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: Array<{ id: string; title: string; fees?: string }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ChapterByIdResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    chapterImageUrl?: string;
    attachmentExtension?: string;
    courseId?: string;
  };
}

export default function UpdateChapterById() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : undefined;

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [chapterImageUrl, setChapterImageUrl] = useState('');
  const [attachmentExtension, setAttachmentExtension] = useState('pdf');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 50 });
        setCourses(res.data);
      } catch {
        setCourses([]);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    async function loadChapter() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get<ChapterByIdResponse>(`/chapters/get-chapter/${id}`);
        const d = res.data;
        setTitle(d.title || '');
        setCourseId(d.courseId || '');
        setChapterImageUrl(d.chapterImageUrl || '');
        setAttachmentExtension(d.attachmentExtension || 'pdf');
      } catch (e: any) {
        setError(e?.message || 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    }
    loadChapter();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!id) {
      setError('Missing chapter id');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch('/chapters/update-chapter', {
        id,
        title,
        chapterImageUrl: chapterImageUrl || undefined,
        attachmentExtension,
        courseId,
      });
      router.replace('/view-chapter');
    } catch (e: any) {
      setError(e?.message || 'Failed to update chapter');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Update Chapter</h1>
      <p className="text-sm text-gray-600 mb-6">Modify chapter details</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow px-6 py-6 max-w-3xl w-full">
        <h2 className="text-lg font-semibold mb-4">Chapter Details</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Attachment Extension</label>
          <select
            value={attachmentExtension}
            onChange={(e) => setAttachmentExtension(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {['pdf', 'doc', 'docx', 'ppt', 'pptx'].map((ext) => (
              <option value={ext} key={ext}>{ext}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Chapter Image URL</label>
          <input
            type="url"
            value={chapterImageUrl}
            onChange={(e) => setChapterImageUrl(e.target.value)}
            placeholder="https://bucket.s3.amazonaws.com/path/to/image.jpg"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {loading && <p className="text-sm text-gray-600 mb-2">Loading…</p>}
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </main>
  );
}
