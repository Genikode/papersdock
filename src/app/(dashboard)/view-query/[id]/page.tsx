'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, BookOpen, BadgeInfo, Paperclip, Mic, Send, Image as ImageIcon } from 'lucide-react';

/* ----------------------------- Types & Mock Data ---------------------------- */
type MsgKind = 'text' | 'image' | 'audio';
type Author = 'student' | 'instructor';

type Message = {
  id: string;
  kind: MsgKind;
  author: Author;
  authorName: string;
  createdAt: string; // ISO
  text?: string;
  imageUrl?: string;
  audioSeconds?: number;
};

type QueryInfo = {
  id: string;
  title: string;
  description: string;
  paper: string;
  chapter: string;
  status: 'in-progress' | 'resolved' | 'pending';
  createdAt: string; // ISO
  messages: Message[];
};

const QUERIES: Record<string, QueryInfo> = {
  '1': {
    id: '1',
    title: 'Help with Binary Search Algorithm',
    description:
      "I'm having trouble understanding the time complexity of binary search algorithm. Can someone explain how we arrive at O(log n) and provide a step-by-step breakdown?",
    paper: 'Data Structure',
    chapter: 'Data Structure',
    status: 'in-progress',
    createdAt: '2024-01-20T12:00:00Z',
    messages: [
      {
        id: 'm1',
        kind: 'text',
        author: 'student',
        authorName: 'John Doe',
        createdAt: '2024-01-20T15:00:00Z',
        text:
          "I'm having trouble understanding the time complexity of binary search algorithm. Can someone explain how we arrive at O(log n)?",
      },
      {
        id: 'm2',
        kind: 'image',
        author: 'student',
        authorName: 'John Doe',
        createdAt: '2024-01-20T15:45:00Z',
        imageUrl:
          'https://images.unsplash.com/photo-1511485977113-f34c92461ad9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', // placeholder
        text: "Here's my algorithm implementation screenshot",
      },
      {
        id: 'm3',
        kind: 'text',
        author: 'instructor',
        authorName: 'Dr. Smith',
        createdAt: '2024-01-20T16:15:00Z',
        text:
          "Great question! Binary search has O(log n) time complexity because we eliminate half of the remaining elements in each step. Let me break it down for you.",
      },
      {
        id: 'm4',
        kind: 'audio',
        author: 'student',
        authorName: 'John Doe',
        createdAt: '2024-01-20T16:30:00Z',
        audioSeconds: 15,
        text: 'Let me explain my confusion with audio',
      },
    ],
  },
};

/* --------------------------------- UI Bits --------------------------------- */
const tinyAvatar = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function StatusPill({ status }: { status: QueryInfo['status'] }) {
  const map = {
    'in-progress': 'bg-blue-50 text-blue-700 ring-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  }[status];
  const label = status.replace('-', ' ');
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] ring-1', map)}>
      {label}
    </span>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div className="flex-1">
        <div className="text-slate-500">{label}</div>
        <div className="font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------- Message UI -------------------------------- */
function MessageBubble({ m }: { m: Message }) {
  const mine = m.author === 'instructor';
  const ts = new Date(m.createdAt).toLocaleString();

  const base = clsx(
    'max-w-[92%] sm:max-w-[85%] rounded-2xl text-sm shadow-sm',
    mine ? 'bg-slate-100 text-slate-900 rounded-br-md' : 'bg-slate-900 text-white rounded-bl-md'
  );

  return (
    <div className={clsx('flex items-start gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-300 text-[10px] font-semibold text-slate-800">
          {tinyAvatar(m.authorName)}
        </div>
      )}

      <div className="space-y-1">
        <div className={clsx('px-3 py-2', base)}>
          <div
            className={clsx(
              'mb-1 text-[11px]',
              mine ? 'text-slate-600' : 'text-slate-300'
            )}
          >
            <span className="font-medium">{m.authorName}</span>
            <span className="mx-1">•</span>
            <span>{ts}</span>
          </div>

          {/* Content */}
          {m.kind === 'text' && <div>{m.text}</div>}

          {m.kind === 'image' && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-md border border-slate-800/30 bg-slate-950/40 sm:bg-slate-950/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt="attachment"
                  className="block max-h-72 w-full object-contain"
                />
              </div>
              {m.text && (
                <div className={clsx('text-xs', mine ? 'text-slate-700' : 'text-slate-300')}>
                  {m.text}
                </div>
              )}
            </div>
          )}

          {m.kind === 'audio' && (
            <div className="rounded-md bg-slate-800/40 p-2 sm:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-700/60">
                  <Mic size={16} />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Voice Message</div>
                  <div className="text-xs opacity-80">{m.audioSeconds ?? 0}s</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* little note under bubble for the audio example */}
        {m.kind !== 'text' && m.text && mine && (
          <div className="pl-2 text-xs text-slate-500">{m.text}</div>
        )}
      </div>

      {mine && (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
          {tinyAvatar(m.authorName)}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Page ----------------------------------- */
export default function ViewQueryPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const data = useMemo<QueryInfo | null>(() => QUERIES[id] ?? null, [id]);

  // local reply state (demo only)
  const [draft, setDraft] = useState('');

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-slate-900">Query Details</h1>
        <div className="mt-4 rounded-lg border bg-white p-6">
          <p className="text-slate-600">No query found for id: <span className="font-mono">{id}</span></p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="text-lg font-semibold text-slate-900">Query Details</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Conversation panel */}
        <section className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900">Conversation</h2>
          </div>

          <div className="space-y-4 p-3 sm:p-4">
            {data.messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
          </div>

          {/* Composer */}
          <div className="border-t p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message..."
                className="min-w-0 flex-1 rounded-md border bg-white px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring-2"
              />
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
                type="button"
                onClick={() => {
                  if (!draft.trim()) return;
                  alert(`Send: ${draft.trim()} (wire to your API)`);
                  setDraft('');
                }}
                className="grid h-10 w-10 place-items-center rounded-md bg-slate-900 text-white hover:opacity-95"
                title="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Right info card */}
        <aside className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900">Query Information</h2>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{data.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{data.description}</p>
            </div>

            <div className="h-px bg-slate-200" />

            <MetaRow icon={<BookOpen size={16} />} label="Paper" value={data.paper} />
            <MetaRow icon={<ImageIcon size={16} />} label="Chapter" value={data.chapter} />

            <div className="flex items-center gap-2 text-sm">
              <BadgeInfo size={16} className="text-slate-500" />
              <div className="text-slate-500">Status:</div>
              <StatusPill status={data.status} />
            </div>

            <MetaRow
              icon={<CalendarDays size={16} />}
              label="Created"
              value={new Date(data.createdAt).toLocaleDateString()}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
