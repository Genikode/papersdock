'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, UploadCloud, ImageOff, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

type CourseItem = { id: string; title: string; fees?: string };

interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: Array<CourseItem>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ChapterByIdResponse {
  status: number;
  success: boolean;
  message: string;
  data: [
    {
      id: string;
      title: string;
      chapterImageUrl?: string;
      attachmentExtension?: string;
      courseId?: string;
    }
  ];
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string; // presigned PUT url
}

export default function UpdateChapterById() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();

  const id = typeof params?.id === 'string' ? params.id : undefined;

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // from server
  const [newFile, setNewFile] = useState<File | null>(null); // picked by user
  const [attachmentExtension, setAttachmentExtension] = useState('png');

  const [courses, setCourses] = useState<Array<CourseItem>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- helpers --------------------------- */
  const imageExts = useMemo(() => ['png', 'jpg', 'jpeg', 'gif', 'webp'], []);
  const isImageExt = (ext?: string) => !!ext && imageExts.includes(ext.toLowerCase());

  function inferExtFromFilename(name: string): string | null {
    const part = name.split('.').pop();
    return part ? part.toLowerCase() : null;
  }
  function inferExtFromMime(mime: string): string | null {
    if (!mime) return null;
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    };
    return map[mime] || null;
  }
  function sanitizeKeyPart(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function deriveContentType(file: File, fallbackExt: string): string {
    if (file.type) return file.type;
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    return map[fallbackExt] || 'application/octet-stream';
  }
  const extractObjectUrl = (presignedUrl: string) => presignedUrl.split('?')[0];

  /* --------------------------- load courses --------------------------- */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 50 });
        const body: any = res as any;
        const list: CourseItem[] =
          Array.isArray(body?.data) ? body.data :
          Array.isArray(body?.data?.data) ? body.data.data : [];
        setCourses(list);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* --------------------------- load chapter --------------------------- */
  useEffect(() => {
    async function loadChapter() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get<ChapterByIdResponse>(`/chapters/get-chapter/${id}`);
        const d = Array.isArray(res?.data) ? res.data[0] : (res as any)?.data?.[0];
        if (!d) throw new Error('Chapter not found');

        setTitle(d.title || '');
        setCourseId(d.courseId || '');
        setCurrentImageUrl(d.chapterImageUrl || '');
        setAttachmentExtension(d.attachmentExtension || 'png');
      } catch (e: any) {
        setError(e?.message || 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    }
    loadChapter();
  }, [id]);

  /* --------------------------- image selection --------------------------- */
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setNewFile(f);
    if (f) {
      const ext = inferExtFromFilename(f.name) || inferExtFromMime(f.type) || 'png';
      setAttachmentExtension(ext);
    }
  };

  const previewUrl = newFile ? URL.createObjectURL(newFile) : currentImageUrl;
  useEffect(() => {
    return () => {
      if (newFile) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newFile]);

  /* --------------------------- submit --------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id) {
      setError('Missing chapter id');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a chapter title.');
      return;
    }
    if (!courseId) {
      setError('Please select a course.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrlToSend = currentImageUrl;

      // If user picked a new file, upload via signed URL first
      if (newFile) {
        const cleaned = sanitizeKeyPart(newFile.name) || `image.${attachmentExtension}`;
        const ts = Date.now();
        const key = `chapters/${ts}-${cleaned}`;
        const contentType = deriveContentType(newFile, attachmentExtension);

        // 1) get signed URL
        const signed = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
        const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
        if (!signedUrl) throw new Error('Failed to get signed URL');

        // 2) upload the image
        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: newFile,
        });
        if (!putRes.ok) {
          const txt = await putRes.text().catch(() => '');
          throw new Error(`Upload failed: ${putRes.status} ${txt}`);
        }

        // 3) final object URL
        imageUrlToSend = extractObjectUrl(signedUrl);
      }

      // 4) patch the chapter
      await api.patch('/chapters/update-chapter', {
        id,
        title,
        chapterImageUrl: imageUrlToSend || undefined,
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

  /* --------------------------- UI --------------------------- */
  return (
  <main className="min-h-screen bg-[#F9FAFB] px-6 py-6 text-gray-900 dark:bg-slate-950 dark:text-slate-100">
  <button
    onClick={() => router.back()}
    className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline dark:text-slate-400 hover:dark:text-slate-100"
  >
    <ArrowLeft size={16} /> Back
  </button>

  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Update Chapter</h1>
  <p className="text-sm text-gray-600 mb-6 dark:text-slate-400">Modify chapter details</p>

  <form className="bg-white rounded-lg shadow px-6 py-6 max-w-3xl w-full border border-gray-200 dark:bg-slate-900 dark:border-slate-700">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Chapter Details</h2>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter chapter title"
        className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-400/40"
      />
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Course</label>
      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
      >
        <option value="">{loadingCourses ? 'Loading courses…' : 'Select Course'}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
            {c.title}
          </option>
        ))}
      </select>
    </div>

    {/* Current image + change control */}
    <div className="mb-6">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Chapter Image</label>

      <div className="border border-gray-200 rounded-md p-4 flex gap-4 items-start dark:border-slate-700">
        <div className="w-40 h-28 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          {previewUrl && isImageExt(attachmentExtension) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Chapter preview" className="w-full h-full object-cover" />
          ) : currentImageUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 underline flex items-center gap-1 dark:text-indigo-400"
            >
              <ImageOff size={14} />
              Open current file
            </a>
          ) : (
            <div className="text-xs text-gray-400 flex flex-col items-center dark:text-slate-500">
              <ImageOff className="mb-1" size={16} />
              No image
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-2 dark:text-slate-400">
            {newFile ? (
              <>
                Selected: <span className="font-medium text-gray-800 dark:text-slate-100">{newFile.name}</span>
              </>
            ) : currentImageUrl ? (
              <>Current file will be kept unless you upload a new one.</>
            ) : (
              <>Upload a new image for this chapter.</>
            )}
          </p>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 cursor-pointer hover:underline dark:text-indigo-400">
            <UploadCloud size={16} />
            <span>{newFile ? 'Change Image' : 'Upload Image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>

          {newFile && (
            <button
              type="button"
              className="ml-3 text-sm text-gray-600 underline dark:text-slate-400 hover:dark:text-slate-200"
              onClick={() => setNewFile(null)}
            >
              Remove selection
            </button>
          )}
        </div>
      </div>

      {/* Extension picker */}
      <div className="mt-3">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">
          Attachment Extension
        </label>
        <select
          value={attachmentExtension}
          onChange={(e) => setAttachmentExtension(e.target.value)}
          className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/40"
        >
          {['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf', 'doc', 'docx', 'ppt', 'pptx'].map((ext) => (
            <option key={ext} value={ext} className="bg-white dark:bg-slate-900">
              {ext}
            </option>
          ))}
        </select>
      </div>
    </div>

    {loading && <p className="text-sm text-gray-600 mb-2 dark:text-slate-400">Loading…</p>}
    {error && <p className="text-red-600 text-sm mb-3 dark:text-rose-400">{error}</p>}

    <button
      type="submit"
      disabled={submitting}
      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      <Save size={16} />
      {submitting ? 'Saving…' : 'Save Changes'}
    </button>
  </form>
</main>

  );
}
