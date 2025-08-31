'use client';
import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Query, Status } from './types';
import QueryListItem from './QueryListItem';

export default function QueryList({
  items, activeId, onSelect,
}: { items: Query[]; activeId?: string; onSelect: (id: string) => void; }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|Status>('all');

  const filtered = useMemo(() => {
    const base = status === 'all' ? items : items.filter(i => i.status === status);
    if (!q.trim()) return base;
    const t = q.toLowerCase();
    return base.filter(i =>
      i.title.toLowerCase().includes(t) ||
      i.student.toLowerCase().includes(t) ||
      i.category.toLowerCase().includes(t)
    );
  }, [q, status, items]);

  return (
    <aside className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="text-[15px] font-semibold text-slate-900">Student Queries (Total: {items.length})</h2>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 text-slate-500" size={16} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search queries..."
              className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
          </div>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white hover:bg-slate-50">
            <Filter size={16} />
          </button>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          {(['all','pending','answered','resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s as any)}
              className={`rounded-full px-3 py-1 ring-1 ${status===s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-3 px-4 pb-4">
        {filtered.map(item => (
          <QueryListItem
            key={item.id}
            q={item}
            active={activeId === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-10">No queries found.</div>
        )}
      </div>
    </aside>
  );
}
