'use client';

import { useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  Mic,
  StopCircle,
  X,
  ArrowLeft,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

/* ========================== API endpoints ========================== */
const ENDPOINTS = {
  SIGNED: '/get-signed-url',
  COURSES: '/courses/get-allowed-courses',
  CHAPTERS: '/chapters/student/get-all-chapters?page=1&limit=10',
  CREATE: '/query/student/create-query',
};

/* ============================= Types =============================== */
type CourseItem = { id: string; title: string };
type ChapterItem = { id: string; title: string; courseId?: string };

type ListResp<T> = {
  status: number;
  success: boolean;
  message: string;
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

type SignedUrlResp = {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string;
};

/* ============================ Helpers ============================== */
function sanitizeKeyPart(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function objUrlFromSigned(signedUrl: string) {
  return signedUrl.split('?')[0];
}
function contentTypeFromFile(f: File | Blob, fallback = 'application/octet-stream') {
  const t = (f as File).type || (f as any).type;
  return t || fallback;
}

/* ============================= Page ================================ */
export default function AddQueryPage() {
  const router = useRouter();

  // form
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [details, setDetails] = useState('');

  // lists
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // attachments
  const [file, setFile] = useState<File | null>(null); // image/pdf
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // voice
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attachmentExtension, setAttachmentExtension] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // UX
  const canSubmit = title.trim() && courseId && chapterId && details.trim();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  /* ------------------------ Load courses ------------------------ */
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get<ListResp<CourseItem>>(ENDPOINTS.COURSES, {
          page: 1,
          limit: 100,
          search: '',
        });
        setCourses(res.data || []);
      } catch (e: any) {
        setCourses([]);
        setErrorMsg(e?.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  /* ------------------------ Load chapters ----------------------- */
  async function fetchChapters(courseIdForReq?: string) {
    setLoadingChapters(true);
    try {
      const params: any = { page: 1, limit: 200, search: '' };
      if (courseIdForReq) params.courseId = courseIdForReq; // if backend supports it
      const res = await api.get<ListResp<ChapterItem>>(ENDPOINTS.CHAPTERS, params);
      const list = res.data || [];
      // If your backend ignored courseId, filter on client
      const filtered = courseIdForReq ? list.filter((c) => c.courseId === courseIdForReq || !c.courseId) : list;
      setChapters(filtered);
    } catch (e: any) {
      setChapters([]);
      setErrorMsg(e?.message || 'Failed to load chapters');
    } finally {
      setLoadingChapters(false);
    }
  }

  useEffect(() => {
    setChapterId('');
    if (!courseId) {
      // either fetch all or clear
      fetchChapters(undefined);
    } else {
      fetchChapters(courseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* --------------------- File pick/remove ----------------------- */
  function onPickFile(selected?: File) {
    const f = selected ?? fileInputRef.current?.files?.[0];
    if (!f) return;
    const ok =
      f.type.startsWith('image/') ||
      f.type === 'application/pdf';
    if (!ok) {
      alert('Please choose an image or PDF.');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(url);
      const extension = f.name.split('.').pop()?.toLowerCase() || null;
  setAttachmentExtension(extension);
  }
  function removeFile() {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAttachmentExtension(null);
  }

  /* --------------------- Audio choose/record -------------------- */
  function onPickAudio(selected?: File) {
    const f = selected ?? null;
    if (!f) return;
    if (!f.type.startsWith('audio/')) {
      alert('Please choose an audio file');
      return;
    }
    setAudioFile(f);
    const url = URL.createObjectURL(f);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(url);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && recordedChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const f = new File([blob], `query-${Date.now()}.webm`, { type: blob.type });
        setAudioFile(f);
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      alert('Microphone permission denied or unavailable.');
      setRecording(false);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  function removeAudio() {
    setAudioFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  /* ------------------- Signed upload helper --------------------- */
  async function uploadViaSigned(fileOrBlob: File | Blob, folder: string) {
    const name = (fileOrBlob as File).name || `file-${Date.now()}`;
    const safe = sanitizeKeyPart(name);
    const key = `${folder}/${Date.now()}-${safe}`;
    const contentType = contentTypeFromFile(fileOrBlob);

    const signed = await api.post<SignedUrlResp>(ENDPOINTS.SIGNED, { key, contentType });
    const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');

    await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: fileOrBlob,
    });

    return objUrlFromSigned(signedUrl);
  }

  /* --------------------------- Submit ---------------------------- */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    setOkMsg(null);

    try {
      let attachmentUrl = '';
      let voiceAttachment = '';

      if (file) {
        attachmentUrl = await uploadViaSigned(file, 'query/attachments');
      }
      if (audioFile) {
        voiceAttachment = await uploadViaSigned(audioFile, 'query/voices');
      }

      // POST create query
      await api.post(ENDPOINTS.CREATE, {
        title: title.trim(),
        text: details.trim(),
        attachmentUrl,
        voiceAttachment,
        courseId,
        attachmentExtension,
        chapterId,
      });

      setOkMsg('Query submitted.');
      router.back();
      // reset form
      setTitle('');
      setDetails('');
      setCourseId('');
      setChapterId('');
     
      removeFile();
      removeAudio();

      // optionally redirect to list
      // router.push('/my-queries');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------- Cleanup URLs ------------------------ */
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
  <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-4 hover:underline"
    >
      <ArrowLeft size={16} /> Back
    </button>

    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Add Query</h1>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Create a new query with optional attachments.
    </p>

    {(errorMsg || okMsg) && (
      <div
        className={`mt-4 rounded border px-3 py-2 text-sm ${
          errorMsg
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
        }`}
      >
        {errorMsg || okMsg}
      </div>
    )}

    <form
      onSubmit={onSubmit}
      className="mt-5 rounded-lg border bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm
                 border-slate-200 dark:border-slate-800"
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Query Details</h2>

      {/* Title */}
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Query Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter query title"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     border-slate-300 dark:border-slate-700
                     focus:ring-2 ring-indigo-300 dark:ring-indigo-500/60"
        />
      </div>

      {/* Course + Chapter */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Select Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full appearance-none rounded-md border px-3 py-2 text-sm outline-none
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       border-slate-300 dark:border-slate-700
                       focus:ring-2 ring-indigo-300 dark:ring-indigo-500/60"
          >
            <option value="">{loadingCourses ? 'Loading…' : 'Choose course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Select Chapter
          </label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            disabled={!courseId}
            className="w-full appearance-none rounded-md border px-3 py-2 text-sm outline-none
                       bg-white dark:bg-slate-900
                       text-slate-900 dark:text-slate-100
                       border-slate-300 dark:border-slate-700
                       focus:ring-2 ring-indigo-300 dark:ring-indigo-500/60
                       disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
          >
            <option value="">
              {!courseId ? 'Choose course first' : loadingChapters ? 'Loading…' : 'Choose chapter'}
            </option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Write Details
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Enter details of your question"
          rows={4}
          className="w-full resize-y rounded-md border px-3 py-2 text-sm outline-none
                     bg-white dark:bg-slate-900
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     border-slate-300 dark:border-slate-700
                     focus:ring-2 ring-indigo-300 dark:ring-indigo-500/60"
        />
      </div>

      {/* Uploads */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* File (image/pdf) */}
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center
                        bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {filePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={filePreview}
                alt="preview"
                className="h-28 w-40 rounded object-cover ring-1 ring-slate-200 dark:ring-slate-800"
              />
              <button
                type="button"
                onClick={removeFile}
                className="absolute -right-2 -top-2 rounded-full bg-white dark:bg-slate-900 p-1 shadow ring-1 ring-slate-200 dark:ring-slate-700"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attach image or PDF
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG, or PDF (max ~10MB)
              </div>
            </>
          )}
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={() => onPickFile()}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium
                         bg-white hover:bg-slate-100 border-slate-300 text-slate-900
                         dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            >
              <UploadCloud size={16} />
              Choose File
            </button>
            {file && (
              <button
                type="button"
                onClick={removeFile}
                className="ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-2 text-xs
                           bg-white hover:bg-slate-100 border-slate-300 text-slate-900
                           dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Audio (choose/record) */}
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center
                        bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {audioUrl ? (
            <div className="flex items-center gap-2">
              <audio src={audioUrl} controls className="max-w-[240px]" />
              <button
                type="button"
                onClick={removeAudio}
                className="rounded-full bg-white dark:bg-slate-900 p-1 shadow ring-1 ring-slate-200 dark:ring-slate-700"
                aria-label="Remove audio"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attach / Record audio
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Upload a file or record a quick note
              </div>
            </>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium
                         bg-white hover:bg-slate-100 border-slate-300 text-slate-900
                         dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            >
              <UploadCloud size={16} />
              <span>Choose Audio</span>
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickAudio(f);
                }}
              />
            </label>

            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium
                           bg-white hover:bg-slate-100 border-slate-300 text-slate-900
                           dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <Mic size={16} />
                Record
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium
                           border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100
                           dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                <StopCircle size={16} />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-white shadow-sm
                     bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-purple-600
                     hover:from-indigo-700 hover:via-fuchsia-700 hover:to-purple-700
                     disabled:cursor-not-allowed disabled:opacity-60
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                     focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <PlayCircle size={16} />
          {submitting ? 'Submitting…' : 'Upload Query'}
        </button>
      </div>
    </form>
  </main>
</div>

  );
}
