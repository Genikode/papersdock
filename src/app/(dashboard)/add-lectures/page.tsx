'use client';

import { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

/* -------------------- Types matching your API -------------------- */
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

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl?: string;
  data?: { signedUrl?: string };
}

/* -------------------- Helpers -------------------- */
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

/** PUT upload with progress (XMLHttpRequest so we can monitor upload bytes). */
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

/* -------------------- Component -------------------- */
export default function AddLecture() {
  const router = useRouter();

  // Form state
  const [lectureTitle, setLectureTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [slides, setSlides] = useState<File | null>(null); // optional (UI currently hidden)

  // Data lists
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [chaptersAll, setChaptersAll] = useState<ChapterItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress UI
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [progressLabel, setProgressLabel] = useState('');

  /* load courses */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 100 });
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

  /* load chapters */
  useEffect(() => {
    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await api.get<ChaptersListResponse>('/chapters/get-all-chapters', { page: 1, limit: 500 });
        const list = Array.isArray(res?.data) ? res.data : [];
        console.log('Loaded chapters:', list);
        setChaptersAll(list);
      } catch {
        setChaptersAll([]);
      } finally {
        setLoadingChapters(false);
      }
    }
    loadChapters();
  }, []);

  const filteredChapters = useMemo(() => {
    if (!courseId) return chaptersAll;
    const anyHasCourseId = chaptersAll.some((c) => Boolean(c.courseId));
    if (!anyHasCourseId) return chaptersAll;
    return chaptersAll.filter((c) => c.courseId === courseId);
  }, [chaptersAll, courseId]);

  /* file handlers */
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setVideo(f);
  };
  const handleSlidesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSlides(f);
  };

  /* submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!lectureTitle.trim()) {
      setError('Please enter a lecture title.');
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
    if (!video) {
      setError('Please choose a video file.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setProgressLabel('Preparing…');

    try {
      /* Total bytes for combined progress (video + optional slides) */
      const totalBytes = (video?.size || 0) + (slides?.size || 0);
      let uploadedBytes = 0;

      const bumpProgress = (delta: number) => {
        uploadedBytes += delta;
        const pct = totalBytes > 0 ? Math.min(99, Math.round((uploadedBytes / totalBytes) * 100)) : 0;
        setUploadProgress(pct);
      };

      /* 1) Signed URL for video */
      const videoName = sanitizeKeyPart(video.name) || 'video.mp4';
      const videoExt = inferExtFromName(videoName) || 'mp4';
      const videoContentType = video.type || contentTypeFor(videoExt);
      const videoKey = `lectures/video/${Date.now()}-${videoName}`;

      setProgressLabel('Requesting upload URL (video)…');
      const videoSigned = await getSignedUrl(videoKey, videoContentType);
      if (!videoSigned) throw new Error('Failed to get signed URL for video.');

      /* 2) Upload video with progress */
      setProgressLabel('Uploading video…');
      await putWithProgress(videoSigned, video, videoContentType, bumpProgress);
      const videoUrl = extractObjectUrl(videoSigned);

      /* 3) Optional slides */
      let slidesUrl: string | undefined = undefined;
      if (slides) {
        const slidesName = sanitizeKeyPart(slides.name) || 'slides.pdf';
        const slidesExt = inferExtFromName(slidesName) || 'pdf';
        const slidesContentType = slides.type || contentTypeFor(slidesExt);
        const slidesKey = `lectures/slides/${Date.now()}-${slidesName}`;

        setProgressLabel('Requesting upload URL (slides)…');
        const slidesSigned = await getSignedUrl(slidesKey, slidesContentType);
        if (!slidesSigned) throw new Error('Failed to get signed URL for slides.');

        setProgressLabel('Uploading slides…');
        await putWithProgress(slidesSigned, slides, slidesContentType, bumpProgress);
        slidesUrl = extractObjectUrl(slidesSigned);
      }

      /* 4) Create lecture (finalize) */
      setProgressLabel('Saving lecture…');

      const payload: Record<string, unknown> = {
        title: lectureTitle,
        courseId,
        chapterId,
        videoUrl,
      };
      if (slidesUrl) {
        payload.presentationUrl = slidesUrl;
        (payload as any).presentationUr = slidesUrl; // in case backend expects the typo key
      }

      await api.post('/lectures/create-lecture', payload);

      setUploadProgress(100);
      setProgressLabel('Done');
      router.back(); // or router.push('/view-lectures')
    } catch (err: any) {
      setError(err?.message || 'Failed to create lecture');
      setProgressLabel('Failed');
    } finally {
      setSubmitting(false);
      // (Keep progress visible briefly if you want; otherwise you can reset here)
      // setUploadProgress(0);
      // setProgressLabel('');
    }
  }

  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6 text-black">
      <h1 className="text-2xl font-bold">Add New Lecture</h1>
      <p className="text-sm mb-6">Create and upload educational content</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow px-6 py-6 max-w-4xl w-full border border-black">
        <h2 className="text-lg font-semibold mb-4">Lecture Details</h2>

        {/* Lecture Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Lecture Title</label>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="Enter lecture title"
            className="w-full border border-black rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Course */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setChapterId('');
            }}
            className="w-full border border-black rounded px-3 py-2 text-sm"
          >
            <option value="">{loadingCourses ? 'Loading courses…' : 'Select a course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Select Chapter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Select Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full border border-black rounded px-3 py-2 text-sm"
          >
            <option value="">{loadingChapters ? 'Loading chapters…' : 'Choose chapter'}</option>
            {filteredChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Boxes */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Video Upload */}
          <div className="border border-black rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm mb-2">
              Upload video lecture <span className="text-red-500">*</span>
            </p>
            <label className="cursor-pointer text-sm font-medium">
              <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              {video ? 'Change Video' : 'Choose Video'}
            </label>
            {video && (
              <p className="mt-2 text-xs">
                Selected: <span className="font-medium">{video.name}</span>
              </p>
            )}
          </div>

          {/* (Optional) Slides Upload UI — uncomment if needed */}
          {/*
          <div className="border border-black rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm mb-2">Upload slides (optional)</p>
            <label className="cursor-pointer text-sm font-medium">
              <input type="file" accept=".pdf,.ppt,.pptx" onChange={handleSlidesChange} className="hidden" />
              {slides ? 'Change File' : 'Choose File'}
            </label>
            {slides && (
              <p className="mt-2 text-xs">
                Selected: <span className="font-medium">{slides.name}</span>
              </p>
            )}
          </div>
          */}
        </div>

        {/* Error */}
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {/* Progress Bar (visible while submitting) */}
        {submitting && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
              <span>{progressLabel || 'Uploading…'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                className="h-2 rounded bg-indigo-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? 'Saving…' : 'Save Lecture'}
        </button>
      </form>
    </main>
  );
}
