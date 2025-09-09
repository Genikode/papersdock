'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type CourseItem = { id: string; title: string };

interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string;
}

export default function AddNotes() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [attachmentType, setAttachmentType] = useState<'dark' | 'light' | ''>('dark'); // mode
  const [webNote, setWebNote] = useState<'Y' | 'N'>('Y');
  const [paper, setPaper] = useState<'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4'| ''>('Paper 1'); // mode
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentExtension, setAttachmentExtension] = useState('pdf');

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load courses */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', {
          page: 1,
          limit: 100,
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* Helpers */
  const docExtensions = useMemo(
    () => ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
    []
  );

  function sanitizeKeyPart(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function extractObjectUrl(url: string) {
    return url.split('?')[0];
  }
  function inferExtByNameOrType(file: File, fallback: string) {
    const byName = file.name.split('.').pop()?.toLowerCase();
    if (byName) return byName;
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/msword') return 'doc';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (file.type === 'application/vnd.ms-powerpoint') return 'ppt';
    if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'image/jpeg') return 'jpg';
    return fallback;
  }
  function contentTypeForExt(ext: string) {
    const m: Record<string,string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return m[ext] || 'application/octet-stream';
  }
  async function uploadViaPresign(file: File, keyPrefix: string) {
    const safe = sanitizeKeyPart(file.name);
    const ext = inferExtByNameOrType(file, 'bin');
    const key = `${keyPrefix}/${Date.now()}-${safe}`;
    const contentType = contentTypeForExt(ext);

    const signed = await api.post<SignedUrlResponse>('/get-signed-url', {
      key,
      contentType,
    });
    const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');

    await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });

    return { objectUrl: extractObjectUrl(signedUrl), ext };
  }

  /* Submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError('Please enter a title.');
    if (!courseId) return setError('Please select a course.');
    if (!bgFile) return setError('Please upload a background image.');
    if (!attachmentFile) return setError('Please upload an attachment (pdf/doc/ppt).');

    setSubmitting(true);
    try {
      const bg = await uploadViaPresign(bgFile, 'notes/backgrounds');
      const att = await uploadViaPresign(attachmentFile, 'notes/attachments');

      await api.post('/notes/create-note', {
        title,
        courseId,
        backgroundImageUrl: bg.objectUrl,
        attachmentUrl: att.objectUrl,
        attachmentType: attachmentType || 'dark', // mode
        attachmentExtension: att.ext,
        webNote,
        paper: paper
      });

      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to create note');
    } finally {
      setSubmitting(false);
    }
  }

  return (
  <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <button
    onClick={() => router.back()}
    className="inline-flex items-center gap-2 text-sm mb-4 text-slate-700 hover:underline dark:text-slate-300"
  >
    <ArrowLeft size={16} /> Back
  </button>

  <PageHeader title="Add Notes" description="Create comprehensive study notes and resources" />

  <form
    onSubmit={handleSubmit}
    className="bg-white dark:bg-slate-900 p-6 rounded-md shadow border max-w-4xl mx-auto
               border-slate-200 dark:border-slate-800"
  >
    <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Notes Details</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Title</label>
        <input
          className="w-full rounded px-3 py-2 text-sm
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Lecture 1 Notes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Paper</label>
        <select
          className="w-full rounded px-3 py-2 text-sm
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100"
          value={paper}
          onChange={(e) =>
            setPaper(e.target.value as 'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4' | '')
          }
        >
          <option value="Paper 1">Paper 1</option>
          <option value="Paper 2">Paper 2</option>
          <option value="Paper 3">Paper 3</option>
          <option value="Paper 4">Paper 4</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Course</label>
        <select
          className="w-full rounded px-3 py-2 text-sm
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">{loadingCourses ? 'Loading…' : 'Select course'}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Display Mode</label>
        <select
          className="w-full rounded px-3 py-2 text-sm
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100"
          value={attachmentType}
          onChange={(e) => setAttachmentType(e.target.value as 'dark' | 'light')}
        >
          <option value="dark">dark</option>
          <option value="light">light</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Web Note</label>
        <select
          className="w-full rounded px-3 py-2 text-sm
                     border border-slate-300 dark:border-slate-700
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100"
          value={webNote}
          onChange={(e) => setWebNote(e.target.value as 'Y' | 'N')}
        >
          <option value="Y">Y</option>
          <option value="N">N</option>
        </select>
      </div>
    </div>

    {/* Uploads */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Background */}
      <div
        className="text-center rounded-md p-6
                   border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900"
      >
        <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500" size={28} />
        <p className="text-sm mt-2 mb-3 text-slate-600 dark:text-slate-400">
          Upload background image
        </p>
        <label className="cursor-pointer inline-block font-medium text-indigo-600 dark:text-indigo-400">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => setBgFile(e.target.files?.[0] || null)}
          />
          {bgFile ? bgFile.name : 'Choose Image'}
        </label>
      </div>

      {/* Attachment */}
      <div
        className="text-center rounded-md p-6
                   border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900"
      >
        <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500" size={28} />
        <p className="text-sm mt-2 mb-3 text-slate-600 dark:text-slate-400">
          Upload note attachment
        </p>
        <label className="cursor-pointer inline-block font-medium text-indigo-600 dark:text-indigo-400">
          <input
            type="file"
            className="hidden"
            accept={docExtensions.map((e) => '.' + e).join(',')}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setAttachmentFile(f);
              if (f) setAttachmentExtension(inferExtByNameOrType(f, 'pdf'));
            }}
          />
          {attachmentFile ? attachmentFile.name : 'Choose File'}
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Detected format: {attachmentExtension.toUpperCase()}
        </p>
      </div>
    </div>

    {error && <p className="text-sm mb-3 text-red-700 dark:text-red-400">{error}</p>}

    <button
      type="submit"
      disabled={submitting}
      className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2
                 bg-gradient-to-r from-blue-600 to-purple-600
                 hover:from-blue-700 hover:to-purple-700
                 disabled:opacity-60"
    >
      <Save size={18} /> {submitting ? 'Saving…' : 'Save Notes'}
    </button>
  </form>
</main>

  );
}
