'use client';
import { FileText, UserRound, BookOpen, CalendarDays } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Query } from './types';

export default function DetailHeader({
  q, onResolve,
}: { q: Query; onResolve: () => void; }) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-5 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{q.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><UserRound size={14} /> {q.student}</span>
          {q.paper && <span className="inline-flex items-center gap-1"><FileText size={14} /> Paper: {q.paper}</span>}
          {q.chapter && <span className="inline-flex items-center gap-1"><BookOpen size={14} /> Chapter: {q.chapter}</span>}
          <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Date(q.askedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={q.status} size="md" />
        <button
          onClick={onResolve}
          className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:opacity-95"
          disabled={q.status === 'resolved'}
        >
          Mark Query as Resolved
        </button>
      </div>
    </div>
  );
}
