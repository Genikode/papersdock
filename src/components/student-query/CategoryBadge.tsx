'use client';
import { Tag } from 'lucide-react';
import { Category } from './types';

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] ring-1 ring-slate-200">
      <Tag size={12} /> {category}
    </span>
  );
}
