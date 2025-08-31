'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Clock4,
  FileText,
  Filter,
  MessageSquareText,
  Mic,
  Paperclip,
  Search,
  Send,
  Tag,
  UserRound,
} from 'lucide-react';

/* ----------------------------- Types & Helpers ---------------------------- */

type Status = 'pending' | 'answered' | 'resolved';
type Category = 'Computer Science' | 'Mathematics' | 'Database';

type Message = {
  id: string;
  author: 'student' | 'instructor';
  name: string;
  text: string;
  createdAt: string; // ISO
};

type Query = {
  id: string;
  title: string;
  student: string;
  category: Category;
  paper?: string;
  chapter?: string;
  askedAt: string; // ISO
  status: Status;
  messages: Message[];
};

const daysAgo = (iso: string) =>
  Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));

const timeFull = (iso: string) => new Date(iso).toLocaleString();

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* --------------------------------- Badges --------------------------------- */

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

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] ring-1 ring-slate-200">
      <Tag size={12} />
      {category}
    </span>
  );
}

/* ---------------------------------- List ---------------------------------- */

function QueryListItem({
  q,
  active,
  onClick,
}: {
  q: Query;
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
        <CategoryBadge category={q.category} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <UserRound size={14} /> {q.student}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> {daysAgo(q.askedAt)}d ago
        </span>
      </div>
      <p className="mt-2 text-[12.5px] text-slate-700 line-clamp-1">
        {q.messages[0]?.text ?? ''}
      </p>
    </button>
  );
}

function QueryList({
  items,
  activeId,
  onSelect,
}: {
  items: Query[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | Status>('all');

  const filtered = useMemo(() => {
    const base = status === 'all' ? items : items.filter((i) => i.status === status);
    if (!q.trim()) return base;
    const t = q.toLowerCase();
    return base.filter(
      (i) =>
        i.title.toLowerCase().includes(t) ||
        i.student.toLowerCase().includes(t) ||
        i.category.toLowerCase().includes(t)
    );
  }, [q, status, items]);

  return (
    <aside className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Student Queries (Total: {items.length})
        </h2>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 text-slate-500" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search queries..."
              className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white hover:bg-slate-50"
            title="Filter"
          >
            <Filter size={16} />
          </button>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          {(['all', 'pending', 'answered', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s as any)}
              className={clsx(
                'rounded-full px-3 py-1 ring-1 capitalize',
                status === s
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-3 px-4 pb-4">
        {filtered.map((item) => (
          <QueryListItem
            key={item.id}
            q={item}
            active={activeId === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">No queries found.</div>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------- Messages -------------------------------- */

function AvatarInitials({ name }: { name: string }) {
  return (
    <div className="grid h-7 w-7 select-none place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {initials(name)}
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
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
        <div>{m.text}</div>
      </div>

      {mine && <AvatarInitials name={m.name} />}
    </div>
  );
}

/* ------------------------------- Detail Header ---------------------------- */

function DetailHeader({ q, onResolve }: { q: Query; onResolve: () => void }) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-5 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{q.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <UserRound size={14} /> {q.student}
          </span>
          {q.paper && (
            <span className="inline-flex items-center gap-1">
              <FileText size={14} /> Paper: {q.paper}
            </span>
          )}
          {q.chapter && (
            <span className="inline-flex items-center gap-1">
              <BookOpen size={14} /> Chapter: {q.chapter}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} /> {timeFull(q.askedAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={q.status} />
        <button
          onClick={onResolve}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={q.status === 'resolved'}
        >
          Mark Query as Resolved
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Composer ------------------------------- */

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    onSend(t);
    setValue('');
  };
  return (
    <form onSubmit={submit} className="border-t bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border bg-white px-3 py-2">
          <input
            className="w-full border-none outline-none text-sm"
            placeholder="Type your message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
          title="Attach"
        >
          <Paperclip size={16} />
        </button>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50"
          title="Voice"
        >
          <Mic size={16} />
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}

/* --------------------------- Resizable Splitter --------------------------- */
/**
 * A11y-friendly vertical separator with mouse, touch, and keyboard support.
 * - Persisted width in localStorage ("studentQuery:leftWidth")
 * - Min/Max clamped to keep layout usable
 */
function useResizable({
  defaultWidth = 360,
  min = 260,
  max = 560,
  storageKey = 'studentQuery:leftWidth',
}: {
  defaultWidth?: number;
  min?: number;
  max?: number;
  storageKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return defaultWidth;
    const saved = Number(localStorage.getItem(storageKey));
    return Number.isFinite(saved) && saved > 0 ? saved : defaultWidth;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(leftWidth));
  }, [leftWidth, storageKey]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const root = containerRef.current!;
    const rect = root.getBoundingClientRect();

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const clientX =
        ev instanceof TouchEvent ? ev.touches[0]?.clientX ?? startX : (ev as MouseEvent).clientX;
      const next = Math.max(min, Math.min(max, clientX - rect.left));
      setLeftWidth(next);
    };

    const stop = () => {
      document.removeEventListener('mousemove', onMove as any);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', onMove as any);
      document.removeEventListener('touchend', stop);
      document.body.style.cursor = '';
      (document.body.style as any).userSelect = '';
    };

    document.addEventListener('mousemove', onMove as any);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', onMove as any, { passive: false });
    document.addEventListener('touchend', stop);
    document.body.style.cursor = 'col-resize';
    (document.body.style as any).userSelect = 'none';
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftWidth((w) => Math.max(min, w - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftWidth((w) => Math.min(max, w + step));
    }
  };

  return { containerRef, leftWidth, setLeftWidth, startDrag, onKey, min, max };
}

/* ---------------------------------- Page ---------------------------------- */

const MOCK: Query[] = [
  {
    id: 'q1',
    title: 'Help with Algorithm Complexity',
    student: 'John Doe',
    category: 'Computer Science',
    paper: 'AD',
    chapter: 'A3',
    askedAt: '2024-01-15T15:30:00Z',
    status: 'pending',
    messages: [
      {
        id: 'm1',
        author: 'student',
        name: 'John Doe',
        text:
          'Can someone explain Big O notation? I’m having trouble understanding the time complexity analysis.',
        createdAt: '2024-01-15T15:30:00Z',
      },
      {
        id: 'm2',
        author: 'instructor',
        name: 'Dr. Smith',
        text:
          'Sure! Big O notation describes the worst-case time complexity of an algorithm. It tells us how the runtime grows as the input size increases.',
        createdAt: '2024-01-15T16:15:00Z',
      },
    ],
  },
  {
    id: 'q2',
    title: 'Calculus Integration Problem',
    student: 'Jane Smith',
    category: 'Mathematics',
    askedAt: '2024-01-10T14:00:00Z',
    status: 'resolved',
    messages: [
      {
        id: 'm1',
        author: 'student',
        name: 'Jane Smith',
        text: '∫(2x cos x) dx — what’s the quickest approach?',
        createdAt: '2024-01-10T14:00:00Z',
      },
      {
        id: 'm2',
        author: 'instructor',
        name: 'Prof. Lee',
        text: 'Use integration by parts or recognize derivative of (x sin x + cos x).',
        createdAt: '2024-01-10T14:10:00Z',
      },
      {
        id: 'm3',
        author: 'student',
        name: 'Jane Smith',
        text: 'Thank you for the explanation!',
        createdAt: '2024-01-10T14:20:00Z',
      },
    ],
  },
  {
    id: 'q3',
    title: 'Database Design Question',
    student: 'Mike Johnson',
    category: 'Database',
    askedAt: '2024-01-12T11:00:00Z',
    status: 'answered',
    messages: [
      {
        id: 'm1',
        author: 'student',
        name: 'Mike Johnson',
        text: 'What’s the difference between 1NF and 2NF?',
        createdAt: '2024-01-12T11:00:00Z',
      },
      {
        id: 'm2',
        author: 'instructor',
        name: 'Dr. Cruz',
        text:
          '1NF removes repeating groups; 2NF removes partial dependencies for composite keys.',
        createdAt: '2024-01-12T12:00:00Z',
      },
    ],
  },
];

export default function StudentQueryPage() {
  const [data, setData] = useState<Query[]>(MOCK);
  const [activeId, setActiveId] = useState<string>(MOCK[0].id);

  const { containerRef, leftWidth, startDrag, onKey, min, max } = useResizable({
    defaultWidth: 360,
    min: 280,
    max: 560,
  });

  useEffect(() => {
    const first = data.find((q) => q.status !== 'resolved');
    if (first) setActiveId(first.id);
  }, []);

  const active = data.find((q) => q.id === activeId)!;

  const patch = (id: string, fn: (q: Query) => Query) =>
    setData((prev) => prev.map((q) => (q.id === id ? fn(q) : q)));

  const handleSend = (text: string) => {
    const msg: Message = {
      id: `m${active.messages.length + 1}`,
      author: 'instructor',
      name: 'Dr. Smith',
      text,
      createdAt: new Date().toISOString(),
    };
    patch(activeId, (q) => ({
      ...q,
      status: q.status === 'pending' ? 'answered' : q.status,
      messages: [...q.messages, msg],
    }));
  };

  const handleResolve = () => patch(activeId, (q) => ({ ...q, status: 'resolved' }));

  return (
    <main className="m-4 h-[calc(100vh-2rem)] overflow-hidden rounded-lg border bg-white">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CircleDot size={18} /> Student Query
        </h1>
      </header>

      {/* Resizable container */}
      <div ref={containerRef} className="flex h-[calc(100%-52px)] relative">
        {/* Left panel (list) */}
        <div
          className="shrink-0 overflow-y-auto border-r bg-white"
          style={{ width: leftWidth }}
        >
          <QueryList items={data} activeId={activeId} onSelect={setActiveId} />
        </div>

        {/* Divider Handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={leftWidth}
          tabIndex={0}
          onKeyDown={onKey}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="group relative z-10 h-full w-[6px] shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-slate-200 active:bg-slate-300"
        >
          {/* Tiny drag dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-y-1 opacity-60 group-hover:opacity-100">
            <div className="h-1 w-1 rounded-full bg-slate-500" />
            <div className="h-1 w-1 rounded-full bg-slate-500" />
            <div className="h-1 w-1 rounded-full bg-slate-500" />
          </div>
        </div>

        {/* Right panel (details) */}
        <section className="min-w-0 flex-1 flex flex-col bg-slate-50">
          <DetailHeader q={active} onResolve={handleResolve} />
          <div className="flex-1 overflow-y-auto space-y-3 px-5 py-4">
            {active.messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
          </div>
          <Composer onSend={handleSend} />
        </section>
      </div>
    </main>
  );
}
