'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, UploadCloud, Link as LinkIcon } from 'lucide-react';

/* ========= Types (match your API) ========= */

interface CourseItem {
  id: string;
  title: string;
  fees?: string;
}
interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ChapterItem {
  id: string;
  title: string;
  courseId?: string;
}
interface ChaptersListResponse {
  status: number;
  success: boolean;
  message: string;
  data: ChapterItem[];
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
  };
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl?: string;
  data?: { signedUrl?: string };
}

/* ========= Helpers ========= */

function sanitizeKeyPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferExtFromName(name: string): string | null {
  const part = name.split('.').pop();
  return part ? part.toLowerCase() : null;
}

function contentTypeFor(ext: string, fallback = 'application/octet-stream') {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mkv: 'video/x-matroska',
    m4v: 'video/x-m4v',
  };
  return map[ext] || fallback;
}

function extractObjectUrl(presignedUrl: string): string {
  return presignedUrl.split('?')[0];
}

async function getSignedUrl(key: string, contentType: string) {
  const res = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
  return (res as any)?.signedUrl ?? (res as any)?.data?.signedUrl;
}

/** PUT with progress (uses XHR so we can track upload bytes) */
function putWithProgress(
  url: string,
  file: File | Blob,
  contentType: string,
  onDelta: (deltaBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const delta = e.loaded - lastLoaded;
        lastLoaded = e.loaded;
        onDelta(Math.max(0, delta));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/* ========= Page ========= */

export default function UpdateLecturePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  // form fields
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');

  // current urls from server
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [currentSlidesUrl, setCurrentSlidesUrl] = useState<string>('');

  // new uploads (optional)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);

  // lists
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [chaptersAll, setChaptersAll] = useState<ChapterItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // UX
  const [loadingLecture, setLoadingLecture] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress UI
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [progressLabel, setProgressLabel] = useState('');

  /* ===== Load courses ===== */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 200 });
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* ===== Load chapters ===== */
  useEffect(() => {
    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await api.get<ChaptersListResponse>('/chapters/get-all-chapters', { page: 1, limit: 1000 });
        const list = Array.isArray(res?.data) ? res.data : [];
        setChaptersAll(list);
      } catch {
        setChaptersAll([]);
      } finally {
        setLoadingChapters(false);
      }
    }
    loadChapters();
  }, []);

  /* ===== Load lecture to edit ===== */
  useEffect(() => {
    if (!id) return;
    async function loadLecture() {
      setLoadingLecture(true);
      setError(null);
      try {
        // Note: adjust to /lectures/admin/get-lecture/${id} if that's your admin route
        const res = await api.get<GetLectureByIdResponse>(`/lectures/get-lecture/${id}`);
        const d = (res as any)?.data ?? (res as any);
        const item = d?.data ?? d;
        setTitle(item?.title || '');
        setCourseId(item?.courseId || '');
        setChapterId(item?.chapterId || '');
        setCurrentVideoUrl(item?.videoUrl || '');
        setCurrentSlidesUrl(item?.presentationUrl || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to load lecture');
      } finally {
        setLoadingLecture(false);
      }
    }
    loadLecture();
  }, [id]);

  /* ===== Filter chapters by course ===== */
  const filteredChapters = useMemo(() => {
    if (!courseId) return chaptersAll;
    const anyHasCourseId = chaptersAll.some((c) => Boolean(c.courseId));
    if (!anyHasCourseId) return chaptersAll;
    return chaptersAll.filter((c) => c.courseId === courseId);
  }, [chaptersAll, courseId]);

  /* ===== Handlers ===== */
  const onVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setVideoFile(f);
  };
  const onSlidesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSlidesFile(f);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id) {
      setError('Missing lecture id.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!courseId) {
      setError('Please select a course.');
      return;
    }
    if (!chapterId) {
      setError('Please select a chapter.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setProgressLabel('Preparing…');

    try {
      let videoUrl = currentVideoUrl || '';
      let presentationUrl = currentSlidesUrl || '';

      const totalBytes = (videoFile?.size || 0) + (slidesFile?.size || 0);
      let uploadedBytes = 0;

      const bump = (delta: number) => {
        uploadedBytes += delta;
        const pct = totalBytes > 0 ? Math.min(99, Math.round((uploadedBytes / totalBytes) * 100)) : uploadProgress;
        setUploadProgress(pct);
      };

      // 1) Upload new video if provided
      if (videoFile) {
        setProgressLabel('Requesting upload URL (video)…');
        const clean = sanitizeKeyPart(videoFile.name) || 'video.mp4';
        const ext = inferExtFromName(clean) || 'mp4';
        const ctype = videoFile.type || contentTypeFor(ext);
        const key = `lectures/video/${Date.now()}-${clean}`;
        const signed = await getSignedUrl(key, ctype);
        if (!signed) throw new Error('Failed to get signed URL for video.');

        setProgressLabel('Uploading video…');
        await putWithProgress(signed, videoFile, ctype, bump);
        videoUrl = extractObjectUrl(signed);
      }

      // 2) Upload new slides if provided
      if (slidesFile) {
        setProgressLabel('Requesting upload URL (slides)…');
        const clean = sanitizeKeyPart(slidesFile.name) || 'slides.pdf';
        const ext = inferExtFromName(clean) || 'pdf';
        const ctype = slidesFile.type || contentTypeFor(ext);
        const key = `lectures/slides/${Date.now()}-${clean}`;
        const signed = await getSignedUrl(key, ctype);
        if (!signed) throw new Error('Failed to get signed URL for slides.');

        setProgressLabel('Uploading slides…');
        await putWithProgress(signed, slidesFile, ctype, bump);
        presentationUrl = extractObjectUrl(signed);
      }

      // If no files were uploaded, still show a quick progress transition
      if (!videoFile && !slidesFile) {
        setProgressLabel('Saving changes…');
        setUploadProgress(60);
      } else {
        setProgressLabel('Saving changes…');
      }

      // 3) Patch lecture
      const payload: Record<string, unknown> = {
        title,
        courseId,
        chapterId,
        videoUrl,
        presentationUrl,         // correct key
      };
      (payload as any).presentationUr = presentationUrl; // in case backend expects typo variant

      await api.patch(`/lectures/update-lecture/${id}`, payload);

      setUploadProgress(100);
      setProgressLabel('Done');
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to update lecture');
      setProgressLabel('Failed');
    } finally {
      setSubmitting(false);
    }
  }

  /* ===== UI ===== */
  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Update Lecture</h1>
      <p className="text-sm text-gray-600 mb-6">Modify lecture details and assets</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow px-6 py-6 max-w-4xl w-full">
        <h2 className="text-lg font-semibold mb-4 text-black">Lecture Details</h2>

        {loadingLecture && (
          <p className="text-sm text-gray-500 mb-4">Loading lecture…</p>
        )}

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-black">Lecture Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter lecture title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Course */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-black">Course</label>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setChapterId('');
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">{loadingCourses ? 'Loading courses…' : 'Select a course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-black">Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">{loadingChapters ? 'Loading chapters…' : 'Select chapter'}</option>
            {filteredChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>
   <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          {/* New Video */}
          <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Re-upload video (optional)
            </p>
            <label className="cursor-pointer text-sm font-medium text-indigo-600">
              <input type="file" accept="video/*" onChange={onVideoChange} className="hidden" />
              {videoFile ? 'Change Video' : 'Choose Video'}
            </label>
            {videoFile && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: <span className="font-medium">{videoFile.name}</span>
              </p>
            )}
          </div>

          {/* New Slides */}
       
        </div>
        {/* Current assets */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          {/* Current Video */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-black">Current Video</h3>
              {currentVideoUrl ? (
                <a
                  href={currentVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600"
                >
                  <LinkIcon size={14} /> Open
                </a>
              ) : (
                <span className="text-xs text-gray-400">None</span>
              )}
            </div>
            {currentVideoUrl ? (
              <video className="w-full rounded" controls src={currentVideoUrl} />
            ) : (
              <p className="text-xs text-gray-500">No video uploaded.</p>
            )}
          </div>

          {/* Current Slides */}
       
        </div>

        {/* Re-upload boxes */}
     

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {/* Progress Bar — border and text in gray-900 */}
        {submitting && (
          <div className="mb-4 border border-gray-900 rounded p-3">
            <div className="flex items-center justify-between text-xs text-black mb-1">
              <span>{progressLabel || 'Uploading…'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                className="h-2 rounded bg-gray-900 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

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
