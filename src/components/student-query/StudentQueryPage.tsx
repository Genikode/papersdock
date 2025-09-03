'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock4,
  FileText,
  Filter,
  Globe,
  Lock,
  MessageSquareText,
  Mic,
  Paperclip,
  Pause,
  Play,
  RotateCcw,
  Search,
  Send,
  Tag,
  Trash2,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getUserData } from '@/lib/auth';

/* ============================== Endpoints =============================== */

const ENDPOINTS = {
  SIGN: '/get-signed-url',
  LIST: '/query/admin/get-all-queries',
  REPLIES: (id: string) => `/query/get-query-replies/${id}`,
  REPLY_CREATE: '/query/admin/reply',
  REPLY_UPDATE: '/query/admin/update-reply',
  TOGGLE_CLOSED: (id: string) => `/query/admin/toggle-query-closed-status/${id}`,
  TOGGLE_PUBLIC: (id: string) => `/query/admin/toggle-query-public-status/${id}`,
};

/* ============================ Types (Backend) =========================== */

type Yn = 'Y' | 'N';

type QueryApiItem = {
  id: string;
  title: string;
  text: string;
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  isPublic: Yn;
  isClosed: Yn;
  studentName: string;
  replyCount: number;
};

type QueryListResponse = {
  status: number;
  success: boolean;
  message: string;
  data: QueryApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type ReplyApiItem = {
  id: string;
  queryId: string | number;
  userId: number;
  text: string;
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  replierName: string;
};

type RepliesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: ReplyApiItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type SignedUrlResponse = {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string;
};

/* ============================ UI Types & Helpers ======================== */

type Status = 'pending' | 'answered' | 'resolved';

type Message = {
  id: string;
  key: string; // unique React key
  author: 'student' | 'instructor';
  name: string;
  text: string;
  createdAt: string;
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  editable?: boolean;
};

type QueryUI = {
  id: string;
  title: string;
  student: string;
  category: 'General';
  askedAt?: string;
  status: Status;
  text: string;
  attachmentUrl?: string | null;
  voiceAttachment?: string | null;
  isPublic: Yn;
  isClosed: Yn;
  replyCount: number;
};

const timeFull = (iso: string) => new Date(iso).toLocaleString();

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function sanitizeKeyPart(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function objUrlFromSigned(signedUrl: string) {
  return signedUrl.split('?')[0];
}

/* ============================== Badges & Bits =========================== */

function StatusBadge({ status, dense = false }: { status: Status; dense?: boolean }) {
  const map = {
    pending: {
      label: 'pending',
      Icon: Clock4,
      classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    answered: {
      label: 'answered',
      Icon: MessageSquareText,
      classes: 'bg-blue-50 text-blue-700 ring-blue-200',
    },
    resolved: {
      label: 'resolved',
      Icon: CheckCircle2,
      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
  }[status];
  const Icon = map.Icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full ring-1',
        dense ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        map.classes
      )}
    >
      <Icon size={dense ? 12 : 14} />
      <span className="capitalize">{map.label}</span>
    </span>
  );
}

function CategoryBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] ring-1 ring-slate-200">
      <Tag size={12} />
      General
    </span>
  );
}

function AvatarInitials({ name }: { name: string }) {
  return (
    <div className="grid h-7 w-7 select-none place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {initials(name)}
    </div>
  );
}

/* =============================== List (Left) ============================ */

function QueryListItem({
  q,
  active,
  onClick,
}: {
  q: QueryUI;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-lg border p-3 hover:bg-slate-50',
        active && 'ring-2 ring-indigo-300 bg-white'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold text-slate-900 line-clamp-1">{q.title}</h3>
        <StatusBadge status={q.status} dense />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <CategoryBadge />
        {q.isPublic === 'Y' ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full">
            <Globe size={12} /> public
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-50 ring-1 ring-slate-200 px-2 py-0.5 rounded-full">
            <Lock size={12} /> private
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <UserRound size={14} /> {q.student}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> {q.replyCount} replies
        </span>
      </div>
      <p className="mt-2 text-[12.5px] text-slate-700 line-clamp-1">{q.text}</p>
    </button>
  );
}

function QueryList({
  items,
  activeId,
  onSelect,
  total,
  page,
  limit,
  onPageChange,
  search,
  onSearchChange,
  closedFilter,
  onClosedFilterChange,
  publicFilter,
  onPublicFilterChange,
  loading,
}: {
  items: QueryUI[];
  activeId?: string;
  onSelect: (id: string) => void;
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  closedFilter: 'all' | 'open' | 'closed';
  onClosedFilterChange: (v: 'all' | 'open' | 'closed') => void;
  publicFilter: 'all' | 'public' | 'private';
  onPublicFilterChange: (v: 'all' | 'public' | 'private') => void;
  loading: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <aside className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="text-[15px] font-semibold text-slate-900">Student Queries</h2>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search queries..."
              className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white"
            title="Filter"
          >
            <Filter size={16} />
          </button>
        </div>

        <div className="mt-2 flex gap-2 text-xs">
          {(['all', 'open', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onClosedFilterChange(s)}
              className={clsx(
                'rounded-full px-3 py-1 ring-1 capitalize',
                closedFilter === s
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {(['all', 'public', 'private'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onPublicFilterChange(s)}
                className={clsx(
                  'rounded-full px-3 py-1 ring-1 capitalize',
                  publicFilter === s
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-3 px-4 pb-3">
        {loading && <div className="py-4 text-sm text-slate-500">Loading…</div>}
        {!loading &&
          items.map((item, index) => (
            <QueryListItem
              key={`${item.id}-${index}`} // keep list keys unique
              q={item}
              active={activeId === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
        {!loading && items.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">No queries found.</div>
        )}
      </div>

      {/* pagination */}
      <div className="mt-auto border-t p-2 flex items-center justify-between text-xs">
        <span className="text-slate-600 px-2">
          Page {page} / {totalPages} • {total} total
        </span>
        <div className="flex items-center gap-1">
          <button
            className="border rounded p-1 disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="border rounded p-1 disabled:opacity-50"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ============================ Voice Recorder ============================ */
function useVoiceRecorder() {
  const [supported, setSupported] = useState<boolean>(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      const slice = canvas.width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const x = i * slice;
        const v = dataArray[i] / 128.0;
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
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);

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
      if (timerRef.current) window.clearInterval(timerRef.current);
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
    if (timerRef.current) window.clearInterval(timerRef.current);
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

/* =============================== Messages =============================== */

function MessageBubble({ m, onEdit }: { m: Message; onEdit?: (m: Message) => void }) {
  const mine = m.author === 'instructor';
  return (
    <div className={clsx('flex items-start gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && <AvatarInitials name={m.name} />}
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border bg-white text-slate-900'
        )}
      >
        <div className={clsx('mb-1 text-[11px]', mine ? 'text-slate-300' : 'text-slate-500')}>
          <span className="font-medium">{m.name}</span> &nbsp; {timeFull(m.createdAt)}
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
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        )}

        {mine && onEdit && (
          <button
            onClick={() => onEdit(m)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] underline"
            title="Edit my reply"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>
      {mine && <AvatarInitials name={m.name} />}
    </div>
  );
}

/* ============================== Page (Main) ============================== */

export default function AdminQueryPage() {
  const currentUser = getUserData(); // must include .id

  // list state
  const [items, setItems] = useState<QueryUI[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // server filters/pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [closedFilter, setClosedFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [publicFilter, setPublicFilter] = useState<'all' | 'public' | 'private'>('all');

  // active query selection
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => items.find((i) => i.id === activeId) || null, [items, activeId]);

  // replies cache per query id
  const [replyMap, setReplyMap] = useState<Record<string, Message[]>>({});
  const [loadingReplies, setLoadingReplies] = useState(false);

  // composer attachments
  const [fileInput, setFileInput] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // voice recorder (composer)
  const rec = useVoiceRecorder();

  // sending & editing
  const [sending, setSending] = useState(false);

  // edit state
  const [editing, setEditing] = useState<Message | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const editRec = useVoiceRecorder();

  /* ------------------------ Fetch List (server) ------------------------ */
  async function fetchList() {
    setLoadingList(true);
    setError(null);
    try {
      const isClosed = closedFilter === 'all' ? undefined : closedFilter === 'closed' ? 'Y' : 'N';
      const isPublic = publicFilter === 'all' ? undefined : publicFilter === 'public' ? 'Y' : 'N';

      const res = await api.get<QueryListResponse>(ENDPOINTS.LIST, {
        isClosed,
        isPublic,
        search,
        page,
        limit,
      });

      const data = res.data ?? [];
      const mapped: QueryUI[] = data.map((q) => ({
        id: q.id,
        title: q.title,
        text: q.text,
        student: q.studentName,
        category: 'General',
        askedAt: undefined,
        status: q.isClosed === 'Y' ? 'resolved' : q.replyCount > 0 ? 'answered' : 'pending',
        attachmentUrl: q.attachmentUrl || null,
        voiceAttachment: q.voiceAttachment || null,
        isPublic: q.isPublic,
        isClosed: q.isClosed,
        replyCount: q.replyCount,
      }));
      setItems(mapped);
      setTotal(res.pagination?.total ?? mapped.length);
      if (!activeId && mapped.length > 0) setActiveId(mapped[0].id);
    } catch (e: any) {
      setError(e?.message || 'Failed to load queries');
      setItems([]);
      setTotal(0);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, closedFilter, publicFilter]);

  /* ---------------------- Fetch Replies (per query) -------------------- */
  async function fetchReplies(queryId: string) {
    setLoadingReplies(true);
    try {
      const res = await api.get<RepliesResponse>(ENDPOINTS.REPLIES(queryId), { page: 1, limit: 100 });
      const list = res.data ?? [];
      const mapped: Message[] = list.map((r, i) => {
        const mine = String(r.createdBy) === String(currentUser?.id);
        return {
          id: String(r.id),
          key: `${r.id}-${r.createdAt ?? ''}-${i}`, // unique & stable
          author: mine ? 'instructor' : 'student',
          name: r.replierName || 'User',
          text: r.text || '',
          createdAt: r.createdAt,
          attachmentUrl: r.attachmentUrl,
          voiceAttachment: r.voiceAttachment,
          editable: mine,
        };
      });
      setReplyMap((prev) => ({ ...prev, [queryId]: mapped }));
    } catch {
      setReplyMap((prev) => ({ ...prev, [queryId]: [] }));
    } finally {
      setLoadingReplies(false);
    }
  }

  useEffect(() => {
    if (activeId) fetchReplies(activeId);
  }, [activeId]);

  /* ---------------------- Toggle closed / public ----------------------- */
  async function toggleClosed(id: string) {
    await api.patch(ENDPOINTS.TOGGLE_CLOSED(id));
    await fetchList();
  }
  async function togglePublic(id: string) {
    await api.patch(ENDPOINTS.TOGGLE_PUBLIC(id));
    await fetchList();
  }

  /* ------------------------ File upload helpers ------------------------ */
  async function uploadViaPresign(fileOrBlob: Blob, folder: string) {
    const name = (fileOrBlob as File).name || `voice-${Date.now()}.webm`;
    const safe = sanitizeKeyPart(name);
    const key = `${folder}/${Date.now()}-${safe}`;
    const contentType = (fileOrBlob as any).type || (name.endsWith('.webm') ? 'audio/webm' : 'application/octet-stream');

    const signed = await api.post<SignedUrlResponse>(ENDPOINTS.SIGN, { key, contentType });
    const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
    if (!signedUrl) throw new Error('Failed to get signed URL');
    await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: fileOrBlob });
    return objUrlFromSigned(signedUrl);
  }

  /* ----------------------------- Send reply ---------------------------- */
  async function handleSend(text: string) {
    if (!activeId) return;
    setSending(true);
    try {
      let attachmentUrl: string | undefined;
      let voiceAttachment: string | undefined;

      if (fileInput) {
        attachmentUrl = await uploadViaPresign(fileInput, 'query/attachments');
      }
      if (rec.blob) {
        voiceAttachment = await uploadViaPresign(rec.blob, 'query/voices');
      }

      await api.post(ENDPOINTS.REPLY_CREATE, {
        text,
        queryId: activeId,
        attachmentUrl: attachmentUrl || '',
        voiceAttachment: voiceAttachment || '',
      });

      // reset composer
      setFileInput(null);
      if (fileRef.current) fileRef.current.value = '';
      rec.reset();

      await fetchReplies(activeId);
      await fetchList();
    } finally {
      setSending(false);
    }
  }

  /* ----------------------------- Edit reply ---------------------------- */
  function startEdit(m: Message) {
    setEditing(m);
    setEditingText(m.text);
    setEditFile(null);
    editRec.reset();
  }

  async function saveEdit() {
    if (!editing) return;

    let nextAttachment = editing.attachmentUrl || '';
    let nextVoice = editing.voiceAttachment || '';

    // If user selected new file, upload and replace
    if (editFile) {
      nextAttachment = await uploadViaPresign(editFile, 'query/attachments');
    }
    // If user recorded a new voice, upload and replace
    if (editRec.blob) {
      nextVoice = await uploadViaPresign(editRec.blob, 'query/voices');
    }

    await api.put(ENDPOINTS.REPLY_UPDATE, {
      id: editing.id,
      text: editingText,
      attachmentUrl: nextAttachment,
      voiceAttachment: nextVoice,
    });

    setEditing(null);
    setEditingText('');
    setEditFile(null);
    editRec.reset();

    if (activeId) await fetchReplies(activeId);
  }

  /* --------------------------------- UI --------------------------------- */

  const activeReplies = activeId ? replyMap[activeId] || [] : [];
  const [messageText, setMessageText] = useState('');

  return (
    <main className="m-4 h-[calc(100vh-2rem)] overflow-hidden rounded-lg border bg-white">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          Admin — Student Queries
        </h1>
      </header>

      <div className="relative flex h-[calc(100%-52px)]">
        {/* Left list */}
        <div className="shrink-0 overflow-y-auto border-r bg-white" style={{ width: 380 }}>
          <QueryList
            items={items}
            activeId={activeId || undefined}
            onSelect={(id) => setActiveId(id)}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            search={search}
            onSearchChange={(s) => {
              setPage(1);
              setSearch(s);
            }}
            closedFilter={closedFilter}
            onClosedFilterChange={(v) => {
              setPage(1);
              setClosedFilter(v);
            }}
            publicFilter={publicFilter}
            onPublicFilterChange={(v) => {
              setPage(1);
              setPublicFilter(v);
            }}
            loading={loadingList}
          />
        </div>

        {/* Right panel */}
        <section className="min-w-0 flex-1 flex flex-col bg-slate-50">
          {/* Active header */}
          {active ? (
            <div className="flex items-center justify-between border-b bg-white px-5 py-4">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-900">{active.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={14} /> {active.student}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={14} /> {active.askedAt ? timeFull(active.askedAt) : '—'}
                  </span>
                  <StatusBadge status={active.status} />
                </div>
                <p className="mt-2 text-sm text-slate-800">{active.text}</p>
                <div className="mt-1 space-x-3 text-sm">
                  {active.attachmentUrl && (
                    <a href={active.attachmentUrl} target="_blank" rel="noreferrer" className="underline text-indigo-600">
                      View original attachment
                    </a>
                  )}
                  {active.voiceAttachment && (
                    <audio controls className="mt-2 w-full max-w-md">
                      <source src={active.voiceAttachment} />
                    </audio>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleClosed(active.id)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                >
                  {active.isClosed === 'Y' ? 'Reopen Query' : 'Mark as Resolved'}
                </button>
                <button
                  onClick={() => togglePublic(active.id)}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                >
                  {active.isPublic === 'Y' ? 'Make Private' : 'Make Public'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-600">Select a query to view details.</div>
          )}

          {/* Replies */}
          <div className="flex-1 overflow-y-auto space-y-3 px-5 py-4">
            {loadingReplies && <div className="text-sm text-slate-500">Loading replies…</div>}
            {!loadingReplies &&
              activeReplies.map((m) => (
                <MessageBubble key={m.key} m={m} onEdit={(mm) => mm.editable && startEdit(mm)} />
              ))}
            {!loadingReplies && activeReplies.length === 0 && active && (
              <div className="text-sm text-slate-500">No replies yet.</div>
            )}
          </div>

          {/* Edit bar (with attach + voice) */}
          {editing && (
            <div className="border-t bg-yellow-50 px-4 py-3">
              <div className="mb-2 text-xs text-yellow-800">Editing your reply…</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-md border bg-white px-3 py-2 text-sm"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />

                  {/* attach replacement */}
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => editFileRef.current?.click()}
                    className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
                    title={editFile ? `Attached: ${editFile.name}` : 'Attach/replace file'}
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* voice replacement control */}
                  {!editRec.recording && !editRec.blob && (
                    <button
                      type="button"
                      onClick={() => editRec.start()}
                      className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
                      title="Record new voice"
                      disabled={!editRec.supported}
                    >
                      <Mic size={16} />
                    </button>
                  )}

                  <button
                    className="rounded-md border px-3 py-2 text-sm"
                    onClick={() => {
                      setEditing(null);
                      setEditingText('');
                      setEditFile(null);
                      editRec.reset();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={saveEdit}
                    disabled={editRec.recording}
                    title={editRec.recording ? 'Finish recording before saving' : 'Save'}
                  >
                    Save
                  </button>
                </div>

                {(editFile || editRec.recording || editRec.blob) && (
                  <div className="flex items-center gap-3 text-sm">
                    {editFile && (
                      <span className="text-slate-600 inline-flex items-center gap-1">
                        📎 {editFile.name}
                        <button
                          type="button"
                          className="ml-1 text-slate-500 hover:text-red-600"
                          onClick={() => {
                            setEditFile(null);
                            if (editFileRef.current) editFileRef.current.value = '';
                          }}
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}

                    {editRec.recording && (
                      <div className="flex-1 flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
                        <button
                          type="button"
                          onClick={() => editRec.stop()}
                          title="Stop"
                          className="text-slate-600 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                          {String(Math.floor(editRec.duration / 60)).padStart(1, '0')}:
                          {String(editRec.duration % 60).padStart(2, '0')}
                        </span>
                        <canvas ref={editRec.canvasRef} width={280} height={26} className="h-[26px] w-full max-w-[320px]" />
                        <button
                          type="button"
                          onClick={() => editRec.pause()}
                          className="text-slate-700 hover:text-slate-900"
                          title={editRec.paused ? 'Resume' : 'Pause'}
                        >
                          {editRec.paused ? <Play size={18} /> : <Pause size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            editRec.stop();
                            editRec.reset();
                          }}
                          className="text-slate-700 hover:text-slate-900"
                          title="Discard"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    )}

                    {!editRec.recording && editRec.blob && editRec.url && (
                      <div className="flex-1 flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
                        <button
                          type="button"
                          onClick={() => editRec.reset()}
                          className="text-slate-600 hover:text-red-600"
                          title="Delete voice"
                        >
                          <Trash2 size={16} />
                        </button>
                        <audio controls src={editRec.url} className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Composer */}
          {active && (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (rec.recording) return; // block while recording
                const t = messageText.trim();
                if (!t && !fileInput && !rec.blob) return;
                handleSend(t || '(voice/attachment)');
                setMessageText('');
              }}
              className="border-t bg-white px-4 py-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border bg-white px-3 py-2">
                    <input
                      name="msg"
                      className="w-full border-none outline-none text-sm"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                  </div>

                  {/* File attach */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
                    title={fileInput ? `Attached: ${fileInput.name}` : 'Attach file'}
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Voice control trigger */}
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
                    type="submit"
                    disabled={sending || rec.recording}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
                    title={rec.recording ? 'Finish recording to send' : 'Send'}
                  >
                    <Send size={16} />
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>

                {(fileInput || rec.recording || rec.blob) && (
                  <div className="flex items-center gap-3 text-sm">
                    {fileInput && (
                      <span className="text-slate-600 inline-flex items-center gap-1">
                        📎 {fileInput.name}
                        <button
                          type="button"
                          className="ml-1 text-slate-500 hover:text-red-600"
                          onClick={() => {
                            setFileInput(null);
                            if (fileRef.current) fileRef.current.value = '';
                          }}
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}

                    {rec.recording && (
                      <div className="flex-1 flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
                        <button
                          type="button"
                          onClick={() => rec.stop()}
                          title="Stop recording"
                          className="text-slate-600 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                          {String(Math.floor(rec.duration / 60)).padStart(1, '0')}:
                          {String(rec.duration % 60).padStart(2, '0')}
                        </span>
                        <canvas ref={rec.canvasRef} width={280} height={26} className="h-[26px] w-full max-w-[320px]" />
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

                    {!rec.recording && rec.blob && rec.url && (
                      <div className="flex-1 flex items-center gap-3 rounded-full border px-3 py-1.5 bg-white">
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
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
