
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  ArrowLeft,
  CalendarDays,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Send,
  Trash2,
  FileText,
  Download,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  Clock,
  StopCircle,
  Paperclip, // using StopCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { getUserData } from '@/lib/auth';

/* ============================== Endpoints (UNCHANGED) =============================== */
const ENDPOINTS = {
  SIGN: '/get-signed-url',
  QUERY_BY_ID: (id: string) => `/query/get-query-by-id/${id}`,
  REPLIES: (id: string) => `/query/get-query-replies/${id}`,
  REPLY_CREATE: '/query/student/reply', // keep your existing route
  // NEW (read-only, for titles)
  CHAPTER: (id: string) => `/chapter/student/get-chapter/${id}`,
  COURSE: (id: string) => `/courses/get-course/${id}`,
};

/* ============================ Backend Types (UNCHANGED) ============================= */
type Yn = 'Y' | 'N';

type QueryById = {
  id: string;
  studentId: string;
  title: string;
  text: string;
  attachmentUrl?: string | null;
  isPublic: Yn;
  isClosed: Yn;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  courseId?: string | null;
  chapterId?: string | null;
  voiceAttachment?: string | null;
};

type QueryByIdResp = {
  status: number; success: boolean; message: string; data: QueryById;
};

type ReplyApiItem = {
  id: string;
  queryId: string | number;
  userId: number;
  text: string;
  attachmentUrl?: string | null;
  attachmentExtension?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  voiceAttachment?: string | null;
  replierName: string;
};

type RepliesResp = {
  status: number; success: boolean; message: string;
  data: ReplyApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type SignedUrlResponse = {
  status: number; success: boolean; message: string; signedUrl: string;
};

/* Extra response shapes for titles */
type ChapterResp = { status: number; success: boolean; message: string; data: Array<{ id: string; title: string }> };
type CourseResp  = { status: number; success: boolean; message: string; title: string };

type Message = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentExtension?: string | null;
  voiceAttachment?: string | null;
  isMine: boolean;
};

/* ============================== Helpers ================================ */
const timeFull  = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');
const timeShort = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
const sanitizeKeyPart = (input: string) => input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const objUrlFromSigned = (u: string) => u.split('?')[0];
function extFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://local');
    const pathname = u.pathname || '';
    const qName = (u.searchParams.get('filename') || '').toLowerCase();
    const name = (qName || pathname.split('/').pop() || '').toLowerCase();
    const dot = name.lastIndexOf('.');
    return dot > -1 ? name.slice(dot + 1) : null;
  } catch {
    const dot = url.lastIndexOf('.');
    return dot > -1 ? url.slice(dot + 1).toLowerCase() : null;
  }
}

/* ============================ Voice Recorder (Composer) ============================ */
function useVoiceRecorder() {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { setSupported(!!(navigator.mediaDevices && (window as any).MediaRecorder)); }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const b = new Blob(chunksRef.current, { type: 'audio/webm' });
      setBlob(b);
      setUrl((u) => { if (u) URL.revokeObjectURL(u); return URL.createObjectURL(b); });
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start(200);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    setRecording(true); setPaused(false); setBlob(null); setUrl(null);
  }, []);

  const pause = useCallback(() => {
    const r = mediaRecRef.current; if (!r) return;
    if (!paused) { r.pause(); setPaused(true); if (timerRef.current) clearInterval(timerRef.current); }
    else { r.resume(); setPaused(false); timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000); }
  }, [paused]);

  const stop = useCallback(() => {
    const r = mediaRecRef.current; if (!r) return;
    r.stop(); setRecording(false); setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null); setBlob(null); setDuration(0); setRecording(false); setPaused(false);
  }, [url]);

  return { supported, recording, paused, duration, blob, url, start, pause, stop, reset };
}

/* ============================ Attachment Bubbles ============================ */
function PdfCard({ url, filename }: { url: string; filename?: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-lg bg-[#f0fff4] p-2 sm:p-3 ring-1 ring-emerald-100">
      <div className="flex h-[56px] w-[72px] sm:h-[70px] sm:w-[88px] items-center justify-center rounded-md bg-white ring-1 ring-emerald-100">
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs sm:text-sm font-medium text-emerald-900">
          {filename || url.split('/').pop() || 'Document.pdf'}
        </div>
        <div className="mt-0.5 text-[11px] sm:text-xs text-emerald-700">PDF • Tap to view</div>
        <a href={url} target="_blank" rel="noreferrer" className="mt-1 sm:mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-emerald-700 hover:underline">
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Open
        </a>
      </div>
    </div>
  );
}

function ImageBubble({ url }: { url: string }) {
  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
      <img
        src={url}
        alt="attachment"
        className="block max-h-[180px] sm:max-h-[260px] w-full max-w-[240px] sm:max-w-[360px] object-cover"
      />
    </div>
  );
}

function VoiceBubble({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setProgress(a.currentTime / Math.max(1, a.duration));
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime); a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-[#e7f7ff] p-2 sm:p-3 ring-1 ring-sky-200">
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white ring-1 ring-sky-200">
        <FileAudio className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
      </div>
      <button
        onClick={() => { const a = audioRef.current; if (!a) return; if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); } }}
        className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-sky-600 text-white"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="relative mx-1 h-7 sm:h-8 flex-1 min-w-[120px] sm:min-w-[140px] max-w-[220px] sm:max-w-[320px] overflow-hidden">
        <div className="absolute inset-0 flex items-end gap-[2px] sm:gap-[3px]">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="w-[3px] sm:w-[4px] rounded-t bg-sky-400" style={{ height: `${(Math.sin(i / 2) * 0.5 + 0.5) * 14 + 3}px` }} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 bg-sky-100" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
}

/* ================================= Page ================================= */
export default function ViewQueryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const currentUser = getUserData();

  const [q, setQ] = useState<QueryById | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [replies, setReplies] = useState<Message[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const rec = useVoiceRecorder();

  // NEW: course/chapter titles for the info card
  const [courseTitle, setCourseTitle] = useState<string>('—');
  const [chapterTitle, setChapterTitle] = useState<string>('—');

  /* -------------------------- Fetch Query -------------------------- */
  async function fetchQuery() {
    if (!queryId) return;
    setLoadingQuery(true); setErrorMsg(null);
    try { const res = await api.get<QueryByIdResp>(ENDPOINTS.QUERY_BY_ID(queryId)); setQ(res.data); }
    catch (e: any) { setQ(null); setErrorMsg(e?.message || 'Failed to fetch query.'); }
    finally { setLoadingQuery(false); }
  }

  /* -------------------------- Fetch Replies ------------------------ */
  async function fetchReplies() {
    if (!queryId) return;
    setLoadingReplies(true);
    try {
      const res = await api.get<RepliesResp>(ENDPOINTS.REPLIES(queryId), { page: 1, limit: 1000 });
      const list = res.data || [];
      const mapped: Message[] = list.map((r) => ({
        id: String(r.id),
        name: r.replierName || 'User',
        text: r.text || '',
        createdAt: r.createdAt,
        attachmentUrl: r.attachmentUrl || '',
        attachmentExtension: r.attachmentExtension || null,
        voiceAttachment: r.voiceAttachment || '',
        isMine: String(r.createdBy) === String(currentUser?.id),
      }));
      setReplies(mapped);
    } catch {
      setReplies([]);
    } finally { setLoadingReplies(false); }
  }

  // NEW: fetch titles when courseId/chapterId are present
  useEffect(() => {
    (async () => {
      if (q?.courseId) {
        try {
          const r = await api.get<CourseResp>(ENDPOINTS.COURSE(q.courseId));
          setCourseTitle(r?.title || '—');
        } catch { setCourseTitle('—'); }
      } else setCourseTitle('—');

      if (q?.chapterId) {
        try {
          const r = await api.get<ChapterResp>(ENDPOINTS.CHAPTER(q.chapterId));
          setChapterTitle(r?.data?.[0]?.title || '—');
        } catch { setChapterTitle('—'); }
      } else setChapterTitle('—');
    })();
  }, [q?.courseId, q?.chapterId]);

  useEffect(() => { fetchQuery(); fetchReplies(); /* eslint-disable-next-line */ }, [queryId]);

  /* ------------------------ Signed upload -------------------------- */
  async function uploadViaPresign(fileOrBlob: Blob, folder: string) {
    const name = (fileOrBlob as File).name || `file-${Date.now()}.bin`;
    const safe = sanitizeKeyPart(name);
    const key = `${folder}/${Date.now()}-${safe}`;
    const contentType = (fileOrBlob as any).type || 'application/octet-stream';
    const signed = await api.post<SignedUrlResponse>(ENDPOINTS.SIGN, { key, contentType });
    const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');
    await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: fileOrBlob });
    return objUrlFromSigned(signedUrl);
  }

  /* ---------------------------- Send Reply ------------------------- */
  async function handleSend() {
    if (!queryId) return;
    const text = draft.trim();
    if (!text && !file && !rec.blob) return;
    setErrorMsg(null); setOkMsg(null);
    try {
      let attachmentUrl = '';
      let voiceAttachment = '';
      if (file) attachmentUrl = await uploadViaPresign(file, 'query/attachments');
      if (rec.blob) voiceAttachment = await uploadViaPresign(rec.blob, 'query/voices');
      await api.post(ENDPOINTS.REPLY_CREATE, { text: text || '', queryId, attachmentUrl, voiceAttachment });
      setDraft(''); setFile(null); setFileName(''); if (fileRef.current) fileRef.current.value = ''; rec.reset();
      setOkMsg('Reply sent.'); await fetchReplies();
    } catch (e: any) { setErrorMsg(e?.message || 'Failed to send reply.'); }
  }

  /* ================================ UI ================================ */
  const infoCard = (
    <aside className="sticky top-0 h-full rounded-lg border bg-white p-4 shadow-[0_1px_0_#eceef1]">
      <h2 className="text-base font-semibold text-slate-900">Query Information</h2>
      <div className="mt-4 rounded-md border p-3">
        <div className="text-[15px] font-semibold text-slate-900">{loadingQuery ? 'Loading…' : q?.title || '—'}</div>
        {q?.text && <p className="mt-2 text-sm text-slate-700">{q.text}</p>}
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 text-slate-500" />
          <div><dt className="text-slate-500">Paper</dt><dd className="font-medium text-slate-900">{courseTitle}</dd></div>
        </div>
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 text-slate-500" />
          <div><dt className="text-slate-500">Chapter</dt><dd className="font-medium text-slate-900">{chapterTitle}</dd></div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          <div><dt className="text-slate-500">Status</dt><dd>
            <span className={clsx(
              'inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1',
              q?.isClosed === 'Y' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
            )}>
              {q?.isClosed === 'Y' ? 'Resolved' : 'In-progress'}
            </span>
          </dd></div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 text-slate-500" />
          <div><dt className="text-slate-500">Created</dt><dd className="font-medium text-slate-900">{q?.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}</dd></div>
        </div>
      </dl>
    </aside>
  );

  const headerBar = (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="rounded-md border px-2.5 py-2 text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">Query Details</h1>
        </div>
        {q && (
          <div className="hidden sm:block text-sm text-slate-600">
            <div className="flex items-center gap-2"><CalendarDays size={16} className="text-slate-500" /><span>{timeFull(q.createdAt)}</span></div>
          </div>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen min-w-s bg-slate-50">
      {headerBar}

      {(errorMsg || okMsg) && (
        <div className={clsx(
          'mx-auto mt-3 max-w-7xl rounded border px-3 py-2 text-xs sm:text-sm sm:px-6 lg:px-8',
          errorMsg ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        )}>
          {errorMsg || okMsg}
        </div>
      )}

      {/* Responsive grid: 1 column on mobile, 2 columns on lg+; conversation first */}
      <main className="mx-auto grid max-w-7xl gap-3 sm:gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[1fr_340px] lg:gap-5 lg:px-8">
        {/* Conversation (left on desktop, first on mobile) */}
        <section className="order-1 relative flex min-h-[60vh] flex-col rounded-lg border bg-white p-2.5 sm:p-4 shadow-[0_1px_0_#eceef1]">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">Conversation</h2>

          {/* scroll area: no horizontal overflow, extra bottom pad so last message isn't hidden by sticky composer */}
          <div className="mt-2 sm:mt-3 flex-1 space-y-3 sm:space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 pb-28 sm:pb-24">
            {loadingReplies && <div className="text-xs sm:text-sm text-slate-500">Loading replies…</div>}
            {!loadingReplies && replies.length === 0 && <div className="text-xs sm:text-sm text-slate-500">No replies yet.</div>}

            {!loadingReplies && replies.map((m, idx) => {
              const mine = m.isMine;
              const ext = (m.attachmentExtension || extFromUrl(m.attachmentUrl) || '').toLowerCase();
              const isPdf = ext === 'pdf';
              const isImg = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
              return (
                <div
                  key={`${m.id}-${idx}`}
                  className={clsx('flex w-full items-start gap-2', mine ? 'justify-end' : 'justify-start')}
                >
                  {!mine && (
                    <div className="mt-5 sm:mt-6 hidden h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full bg-slate-200 ring-1 ring-slate-300 sm:block" />
                  )}

                  {/* bubble: smaller on mobile, grows on sm/md */}
                  <div
                    className={clsx(
                      'min-w-0 max-w-[82%] sm:max-w-[85%] md:max-w-[70%] rounded-xl p-2.5 sm:p-3 shadow-sm ring-1',
                      mine ? 'bg-white ring-slate-200' : 'bg-slate-900 text-white ring-slate-800'
                    )}
                  >
                    <div className={clsx('mb-1 text-[10px] sm:text-[11px] break-words', mine ? 'text-slate-400' : 'text-slate-300')}>
                      <span className="font-medium">{mine ? 'You' : m.name}</span> • {timeShort(m.createdAt)}
                    </div>

                    {m.text && (
                      <p className={clsx('text-[13px] sm:text-sm break-words whitespace-pre-wrap', mine ? 'text-slate-800' : 'text-white')}>
                        {m.text}
                      </p>
                    )}

                    {/* attachments: fully fluid on tiny screens */}
                    {m.attachmentUrl && isPdf && (
                      <div className="mt-2"><PdfCard url={m.attachmentUrl} /></div>
                    )}

                    {m.attachmentUrl && isImg && (
                      <div className="mt-2">
                        <div className="max-w-full">
                          <ImageBubble url={m.attachmentUrl} />
                        </div>
                      </div>
                    )}

                    {m.voiceAttachment && (
                      <div className="mt-2">
                        <VoiceBubble url={m.voiceAttachment} />
                      </div>
                    )}
                  </div>

                  {mine && (
                    <div className="mt-5 sm:mt-6 hidden h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full bg-emerald-100 ring-1 ring-emerald-200 sm:block" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="sticky bottom-0 w-full bg-white pt-2 pb-[env(safe-area-inset-bottom)]">
            {(rec.recording || rec.blob) && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm">
                <div className="flex min-w-0 items-center gap-2 text-rose-600">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-600" />
                  <span className="text-xs sm:text-sm font-medium tabular-nums">
                    {String(Math.floor(rec.duration / 60)).padStart(1, '0')}:{String(rec.duration % 60).padStart(2, '0')}
                  </span>
                  <div className="ml-2 hidden items-end gap-[2px] sm:gap-[3px] sm:flex">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[2px] sm:w-[3px] rounded-t bg-rose-300"
                        style={{ height: `${(Math.sin(i) * 0.5 + 0.5) * 14 + 2}px` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {rec.recording && (
                    <button
                      type="button"
                      onClick={() => rec.pause()}
                      className="rounded-md border border-slate-200 p-1.5 sm:p-2 text-slate-700 hover:bg-slate-50"
                      title={rec.paused ? 'Resume' : 'Pause'}
                    >
                      {rec.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                  )}
                  {rec.recording && (
                    <button
                      type="button"
                      onClick={() => rec.stop()}
                      className="rounded-md border border-slate-200 p-1.5 sm:p-2 text-slate-700 hover:bg-slate-50"
                      title="Stop"
                    >
                      <StopCircle className="h-4 w-4" />
                    </button>
                  )}
                  {rec.blob && (
                    <button
                      type="button"
                      onClick={() => rec.reset()}
                      className="rounded-md border border-slate-200 p-1.5 sm:p-2 text-slate-700 hover:bg-slate-50"
                      title="Delete"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 shadow-sm">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f) { setFile(f); setFileName(f.name); }
                }}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 p-1.5 sm:p-2 text-slate-700 hover:bg-slate-50"
                title={fileName ? `Attached: ${fileName}` : 'Attach file'}
              >
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* input expands but never forces overflow */}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message"
                className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1.5 sm:py-2 text-[13px] sm:text-sm outline-none placeholder:text-slate-400"
              />

              {!rec.recording && !rec.blob && (
                <button
                  type="button"
                  onClick={() => rec.start()}
                  className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 p-1.5 sm:p-2 text-slate-700 hover:bg-slate-50"
                  title="Record voice"
                >
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleSend}
                className="inline-flex shrink-0 items-center justify-center rounded-md bg-slate-900 p-1.5 sm:p-2 text-white hover:opacity-95 disabled:opacity-60"
                disabled={!draft.trim() && !file && !rec.blob}
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {file && (
              <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded border bg-white px-2 py-1 text-[11px] sm:text-xs text-slate-600">
                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                {/* long filenames won't break layout */}
                <span className="truncate max-w-[70vw] sm:max-w-[280px]">{fileName}</span>
                <button
                  type="button"
                  className="text-slate-500 hover:text-red-600"
                  onClick={() => { setFile(null); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                  title="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Info panel (right on desktop, second on mobile) */}
        <section className="order-2 h-max lg:sticky lg:top-[92px]">{infoCard}</section>
      </main>
    </div>
  );
}