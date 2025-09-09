'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

type CourseItem = { id: string; title: string };

interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

type NoteEntity = {
  id: string;
  title: string;
  backgroundImageUrl?: string;
  attachmentUrl?: string;
  attachmentType?: 'dark' | 'light' | string;
  attachmentExtension?: string;
  webNote?: 'Y' | 'N';
  courseId?: string;
  paper?: 'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4' | string;
  courseName?: string;
};

interface NoteByIdResponse_Array {
  status: number;
  success: boolean;
  message: string;
  data: NoteEntity[]; // <— your API returns an ARRAY
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string;
}

export default function UpdateNotesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  // form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [attachmentType, setAttachmentType] = useState<'dark' | 'light' | ''>('dark');
  const [webNote, setWebNote] = useState<'Y' | 'N'>('Y');
  const [paper, setPaper] = useState<'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4' | ''>('Paper 1');

  const [currentBgUrl, setCurrentBgUrl] = useState<string | undefined>(undefined);
  const [currentAttachmentUrl, setCurrentAttachmentUrl] = useState<string | undefined>(undefined);
  const [attachmentExtension, setAttachmentExtension] = useState<string>('pdf');

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* load courses */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 100 });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* load existing note (normalize array/object) */
  useEffect(() => {
    if (!id) return;
    async function loadNote() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<NoteByIdResponse_Array>(`/notes/get-note/${id}`);
        const raw = res.data;
        const n: NoteEntity | undefined = Array.isArray(raw) ? raw[0] : (raw as any);

        if (!n) {
          setError('Note not found.');
          return;
        }

        setTitle(n.title || '');
        setCourseId(n.courseId || '');
        setAttachmentType((n.attachmentType as any) || 'dark');
        setWebNote((n.webNote as any) || 'Y');
        setPaper((n.paper as any) || 'Paper 1');
        setCurrentBgUrl(n.backgroundImageUrl);
        setCurrentAttachmentUrl(n.attachmentUrl);
        setAttachmentExtension(n.attachmentExtension || 'pdf');
      } catch (e: any) {
        setError(e?.message || 'Failed to load note');
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id]);

  /* helpers */
  const docExtensions = useMemo(() => ['pdf', 'doc', 'docx', 'ppt', 'pptx'], []);
  function sanitizeKeyPart(input: string): string {
    return input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function extractObjectUrl(url: string) { return url.split('?')[0]; }
  function inferExt(file: File, fallback: string) {
    const byName = file.name.split('.').pop()?.toLowerCase();
    if (byName) return byName;
    const t = file.type;
    if (t === 'application/pdf') return 'pdf';
    if (t === 'application/msword') return 'doc';
    if (t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (t === 'application/vnd.ms-powerpoint') return 'ppt';
    if (t === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
    if (t === 'image/png') return 'png';
    if (t === 'image/jpeg') return 'jpg';
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
    const ext = inferExt(file, 'bin');
    const key = `${keyPrefix}/${Date.now()}-${safe}`;
    const contentType = contentTypeForExt(ext);

    const signed = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
    const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');

    await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
    return { objectUrl: extractObjectUrl(signedUrl), ext };
  }

  /* submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setSaving(true);
    try {
      let bgUrl = currentBgUrl;
      let attUrl = currentAttachmentUrl;
      let attExt = attachmentExtension;

      if (bgFile) {
        const up = await uploadViaPresign(bgFile, 'notes/backgrounds');
        bgUrl = up.objectUrl;
      }
      if (attachmentFile) {
        const up = await uploadViaPresign(attachmentFile, 'notes/attachments');
        attUrl = up.objectUrl;
        attExt = up.ext;
      }

      await api.patch('/notes/update-note', {
        id,
        title,
        courseId,
        backgroundImageUrl: bgUrl,
        attachmentUrl: attUrl,
        attachmentType: attachmentType || 'dark',
        attachmentExtension: attExt,
        webNote,
        paper: paper
      });

      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to update note');
    } finally {
      setSaving(false);
    }
  }

  return (
   <main className="min-h-screen bg-[#F9FAFB] text-gray-800 dark:bg-slate-950 dark:text-slate-100">
  <button
    onClick={() => router.back()}
    className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline dark:text-slate-400 hover:dark:text-slate-100"
  >
    <ArrowLeft size={16} /> Back
  </button>

  <PageHeader title="Update Notes" description="Modify your note" />

  <form
    onSubmit={handleSubmit}
    className="bg-white p-6 rounded-md shadow border max-w-4xl mx-auto dark:bg-slate-900 dark:border-slate-700"
  >
    <h2 className="text-lg font-semibold mb-4 text-black dark:text-slate-100">Notes Details</h2>

    {loading && <p className="text-sm text-gray-500 mb-3 dark:text-slate-400">Loading…</p>}
    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-black dark:text-slate-200">Title</label>
        <input
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-400/40"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lecture 1 Notes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-black dark:text-slate-200">Paper</label>
        <select
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
          value={paper}
          onChange={(e) => setPaper(e.target.value as 'Paper 1' | 'Paper 2' | 'Paper 3' | 'Paper 4' | '')}
        >
          <option value="Paper 1" className="bg-white dark:bg-slate-900">Paper 1</option>
          <option value="Paper 2" className="bg-white dark:bg-slate-900">Paper 2</option>
          <option value="Paper 3" className="bg-white dark:bg-slate-900">Paper 3</option>
          <option value="Paper 4" className="bg-white dark:bg-slate-900">Paper 4</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-black dark:text-slate-200">Course</label>
        <select
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="" className="bg-white dark:bg-slate-900">
            {loadingCourses ? 'Loading…' : 'Select course'}
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-black dark:text-slate-200">Display Mode</label>
        <select
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
          value={attachmentType}
          onChange={(e) => setAttachmentType(e.target.value as 'dark' | 'light')}
        >
          <option value="dark" className="bg-white dark:bg-slate-900">dark</option>
          <option value="light" className="bg-white dark:bg-slate-900">light</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-black dark:text-slate-200">Web Note</label>
        <select
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
          value={webNote}
          onChange={(e) => setWebNote(e.target.value as 'Y' | 'N')}
        >
          <option value="Y" className="bg-white dark:bg-slate-900">Y</option>
          <option value="N" className="bg-white dark:bg-slate-900">N</option>
        </select>
      </div>
    </div>

    {/* Current previews + uploads */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Background image */}
      <div className="border rounded-md p-4 dark:border-slate-700">
        <p className="text-sm font-medium mb-2 text-black dark:text-slate-100">Background Image</p>
        {currentBgUrl ? (
          <img
            src={currentBgUrl}
            alt="background"
            className="w-full h-36 object-cover rounded mb-3 border border-gray-200 dark:border-slate-700"
          />
        ) : (
          <p className="text-xs text-gray-500 mb-3 dark:text-slate-400">No background uploaded.</p>
        )}
        <label className="block cursor-pointer">
          <span className="text-sm text-indigo-600 inline-flex items-center gap-2 hover:underline dark:text-indigo-400">
            <UploadCloud size={18} /> {bgFile ? 'Change Image' : 'Upload New Image'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setBgFile(e.target.files?.[0] || null)}
          />
        </label>
        {bgFile && <p className="text-xs text-gray-500 mt-2 dark:text-slate-400">{bgFile.name}</p>}
      </div>

      {/* Attachment */}
      <div className="border rounded-md p-4 dark:border-slate-700">
        <p className="text-sm font-medium mb-2 text-black dark:text-slate-100">Attachment</p>
        {currentAttachmentUrl ? (
          <a
            href={currentAttachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-indigo-600 text-sm mb-2 underline dark:text-indigo-400"
          >
            Open current attachment ({attachmentExtension.toUpperCase()})
          </a>
        ) : (
          <p className="text-xs text-gray-500 mb-2 dark:text-slate-400">No attachment uploaded.</p>
        )}

        <label className="block cursor-pointer">
          <span className="text-sm text-indigo-600 inline-flex items-center gap-2 hover:underline dark:text-indigo-400">
            <UploadCloud size={18} /> {attachmentFile ? 'Change File' : 'Upload New File'}
          </span>
          <input
            type="file"
            accept={docExtensions.map((e) => '.' + e).join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setAttachmentFile(f);
              if (f) setAttachmentExtension(inferExt(f, 'pdf'));
            }}
          />
        </label>
        {attachmentFile && (
          <p className="text-xs text-gray-500 mt-2 dark:text-slate-400">{attachmentFile.name}</p>
        )}
      </div>
    </div>

    <button
      type="submit"
      disabled={saving}
      className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      <Save size={18} /> {saving ? 'Saving…' : 'Save Changes'}
    </button>
  </form>
</main>

  );
}
