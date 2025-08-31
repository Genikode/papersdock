'use client';
import clsx from 'clsx';
import { Clock, User } from 'lucide-react';
import { Query } from './types';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';

const daysAgo = (iso: string) => Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (1000*60*60*24)));

export default function QueryListItem({
  q, active, onClick,
}: { q: Query; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-md border p-3 hover:bg-slate-50',
        'focus:outline-none',
        active && 'ring-2 ring-indigo-300 bg-white'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold text-slate-900 line-clamp-1">{q.title}</h3>
        <StatusBadge status={q.status} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <CategoryBadge category={q.category} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1"><User size={14} /> {q.student}</span>
        <span className="inline-flex items-center gap-1"><Clock size={14} /> {daysAgo(q.askedAt)}d ago</span>
      </div>
      <p className="mt-2 text-[12.5px] text-slate-700 line-clamp-1">{q.messages[0]?.text ?? ''}</p>
    </button>
  );
}
