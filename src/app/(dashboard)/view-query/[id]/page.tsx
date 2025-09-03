'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  ArrowLeft,
  CalendarDays,
  Mic,
  Paperclip,
  Pause,
  Play,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getUserData } from '@/lib/auth';

/* ============================== Endpoints =============================== */
const ENDPOINTS = {
  SIGN: '/get-signed-url',
  QUERY_BY_ID: (id: string) => `/query/get-query-by-id/${id}`,
  REPLIES: (id: string) => `/query/get-query-replies/${id}`,
  REPLY_CREATE: '/query/student/reply', // NOTE: body uses "qureryId" per your spec
};

/* ============================ Backend Types ============================= */
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
  courseId?: string;
  chapterId?: string;
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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  voiceAttachment?: string | null;
  replierName: string; // "admin" or "Student: ..."
};

type RepliesResp = {
  status: number; success: boolean; message: string;
  data: ReplyApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type SignedUrlResponse = {
  status: number; success: boolean; message: string; signedUrl: string;
};

/* ============================== UI Types =============================== */
type Message = {
  id: string;
  name: string;
  text: string;
  createdAt: string;       // ISO
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  isMine: boolean;
};

/* ============================== Helpers ================================ */
function timeFull(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : '';
}
function sanitizeKeyPart(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function objUrlFromSigned(u: string) {
  return u.split('?')[0];
}

/* ============================ Voice Recorder ============================ */
/** Lightweight recorder with waveform & timer (like your admin page). */
function useVoiceRecorder() {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(!!(navigator.mediaDevices && (window as any).MediaRecorder));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d')!;
    const bufferLen = analyser.fftSize;
    const data = new Uint8Array(bufferLen);

    const render = () => {
      analyser.getByteTimeDomainData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      const slice = canvas.width / bufferLen;
      for (let i = 0; i < bufferLen; i++) {
        const x = i * slice;
        const v = data[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        setUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return URL.createObjectURL(b);
        });
      };
      rec.start(250);
      setDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);

      // waveform
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      draw();

      setBlob(null);
      setUrl(null);
      setRecording(true);
      setPaused(false);
    } catch (e: any) {
      setError(e?.message || 'Microphone permission denied.');
    }
  }, [draw]);

  const pause = useCallback(() => {
    const rec = mediaRecRef.current;
    if (!rec) return;
    if (!paused) {
      rec.pause();
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      rec.resume();
      setPaused(false);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    }
  }, [paused]);

  const stop = useCallback(() => {
    const rec = mediaRecRef.current;
    if (!rec) return;
    rec.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) sourceRef.current.mediaStream.getTracks().forEach((t) => t.stop());
  }, []);

  const reset = useCallback(() => {
    setBlob(null);
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setDuration(0);
    setRecording(false);
    setPaused(false);
    setError(null);
  }, [url]);

  return { supported, recording, paused, blob, url, duration, error, canvasRef, start, pause, stop, reset };
}

/* ================================ Page ================================= */
export default function ViewQueryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  const currentUser = getUserData(); // MUST provide { id: string, ... }

  // query header
  const [q, setQ] = useState<QueryById | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);

  // replies
  const [replies, setReplies] = useState<Message[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // banners
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // composer text
  const [draft, setDraft] = useState('');

  // file attach
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  // voice
  const rec = useVoiceRecorder();

  /* -------------------------- Fetch Query -------------------------- */
  async function fetchQuery() {
    if (!queryId) return;
    setLoadingQuery(true);
    setErrorMsg(null);
    try {
      const res = await api.get<QueryByIdResp>(ENDPOINTS.QUERY_BY_ID(queryId));
      setQ(res.data);
    } catch (e: any) {
      setQ(null);
      setErrorMsg(e?.message || 'Failed to fetch query.');
    } finally {
      setLoadingQuery(false);
    }
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
        voiceAttachment: r.voiceAttachment || '',
        isMine: String(r.createdBy) === String(currentUser?.id),
      }));
      setReplies(mapped);
    } catch (e) {
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }

  useEffect(() => {
    fetchQuery();
    fetchReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

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

    setErrorMsg(null);
    setOkMsg(null);

    try {
      let attachmentUrl = '';
      let voiceAttachment = '';

      if (file) {
        attachmentUrl = await uploadViaPresign(file, 'query/attachments');
      }
      if (rec.blob) {
        voiceAttachment = await uploadViaPresign(rec.blob, 'query/voices');
      }

      // Your API expects "qureryId" (spelling from your spec)
      await api.post(ENDPOINTS.REPLY_CREATE, { text: text || '', queryId: queryId, attachmentUrl: attachmentUrl || '', voiceAttachment: voiceAttachment || '' });

      setDraft('');
      setFile(null);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
      rec.reset();
      setOkMsg('Reply sent.');
      await fetchReplies();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to send reply.');
    }
  }

  /* ----------------------------- UI bits --------------------------- */
  const headerRight = useMemo(() => {
    if (!q) return null;
    return (
      <div className="text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-500" />
          <span>{timeFull(q.createdAt)}</span>
        </div>
        <div className="mt-1">
          <span
            className={clsx(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1',
              q.isClosed === 'Y'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-amber-200'
            )}
          >
            {q.isClosed === 'Y' ? 'resolved' : 'in progress'}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            {q.isPublic === 'Y' ? 'public' : 'private'}
          </span>
        </div>
      </div>
    );
  }, [q]);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-lg font-semibold text-slate-900">Query Details</h1>

      {(errorMsg || okMsg) && (
        <div
          className={clsx(
            'mt-3 rounded border px-3 py-2 text-sm',
            errorMsg
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}
        >
          {errorMsg || okMsg}
        </div>
      )}

      {/* Header card */}
      <section className="mt-4 rounded-lg border bg-white">
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {loadingQuery ? 'Loading…' : q?.title || '—'}
            </h2>
            {q && (
              <>
                <p className="mt-1 text-sm text-slate-700">{q.text}</p>
                <div className="mt-2 space-x-3 text-sm">
                  {q.attachmentUrl && (
                    <a
                      href={q.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline"
                    >
                      View original attachment
                    </a>
                  )}
                  {q.voiceAttachment && (
                    <audio controls className="align-middle">
                      <source src={q.voiceAttachment} />
                    </audio>
                  )}
                </div>
              </>
            )}
          </div>
          {headerRight}
        </div>

        {/* Replies */}
        <div className="p-3 sm:p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingReplies && <div className="text-sm text-slate-500">Loading replies…</div>}
          {!loadingReplies &&
            replies.map((m, idx) => {
              const mine = m.isMine;
              return (
                <div
                  key={`${m.id}-${idx}`} // avoid duplicate key warning
                  className={clsx('flex items-start gap-2', mine ? 'justify-end' : 'justify-start')}
                >
                  {!mine && (
                    <div className="grid h-7 w-7 select-none place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                      {m.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}

                  <div
                    className={clsx(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                      mine ? 'bg-slate-900 text-white rounded-br-md' : 'bg-white text-slate-900 border rounded-bl-md'
                    )}
                  >
                    <div className={clsx('mb-1 text-[11px]', mine ? 'text-slate-300' : 'text-slate-500')}>
                      <span className="font-medium">{mine ? 'You' : m.name}</span> &nbsp; {timeFull(m.createdAt)}
                    </div>
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {(m.attachmentUrl || m.voiceAttachment) && (
                      <div className={clsx('mt-2 space-y-1', mine ? 'text-slate-200' : 'text-slate-700')}>
                        {m.attachmentUrl && (
                          <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="underline text-xs">
                            View attachment
                          </a>
                        )}
                        {m.voiceAttachment && (
                          <audio controls className="w-full">
                            <source src={m.voiceAttachment} />
                          </audio>
                        )}
                      </div>
                    )}
                  </div>

                  {mine && (
                    <div className="grid h-7 w-7 select-none place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                      {currentUser?.name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'YOU'}
                    </div>
                  )}
                </div>
              );
            })}

          {!loadingReplies && replies.length === 0 && (
            <div className="text-sm text-slate-500">No replies yet.</div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-white px-3 py-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message…"
                  className="w-full border-none outline-none text-sm"
                />
              </div>

              {/* Attach file */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f) {
                    setFile(f);
                    setFileName(f.name);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
                title={fileName ? `Attached: ${fileName}` : 'Attach file'}
              >
                <Paperclip size={16} />
              </button>

              {/* Voice buttons */}
              {!rec.recording && !rec.blob && (
                <button
                  type="button"
                  onClick={() => rec.start()}
                  className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
                  title="Record voice"
                  disabled={!rec.supported}
                >
                  <Mic size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={handleSend}
                className="grid h-10 px-4 place-items-center rounded-md bg-slate-900 text-white hover:opacity-95 disabled:opacity-60"
                disabled={!draft.trim() && !file && !rec.blob}
                title="Send"
              >
                <div className="flex items-center gap-2">
                  <Send size={16} />
                  <span className="text-sm">Send</span>
                </div>
              </button>
            </div>

            {(file || rec.recording || rec.blob) && (
              <div className="flex flex-col gap-2 text-sm">
                {/* file chip */}
                {file && (
                  <div className="inline-flex items-center gap-2 rounded border bg-white px-2 py-1 w-fit">
                    <span className="text-slate-600">📎 {fileName}</span>
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => {
                        setFile(null);
                        setFileName('');
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* recording UI */}
                {rec.recording && (
                  <div className="flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
                    <span className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                      {String(Math.floor(rec.duration / 60)).padStart(1, '0')}:
                      {String(rec.duration % 60).padStart(2, '0')}
                    </span>
                    <canvas ref={rec.canvasRef} width={280} height={24} className="h-[24px] w-full max-w-[320px]" />
                    <button
                      type="button"
                      onClick={() => rec.pause()}
                      className="text-slate-700 hover:text-slate-900"
                      title={rec.paused ? 'Resume' : 'Pause'}
                    >
                      {rec.paused ? <Play size={18} /> : <Pause size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rec.stop(); // finalize blob
                      }}
                      className="text-slate-700 hover:text-slate-900"
                      title="Stop"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rec.stop();
                        rec.reset();
                      }}
                      className="text-slate-700 hover:text-slate-900"
                      title="Discard"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                )}

                {/* after stop: preview audio */}
                {!rec.recording && rec.blob && rec.url && (
                  <div className="flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
                    <button
                      type="button"
                      onClick={() => rec.reset()}
                      className="text-slate-600 hover:text-red-600"
                      title="Delete voice"
                    >
                      <Trash2 size={16} />
                    </button>
                    <audio controls src={rec.url} className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
