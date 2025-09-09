'use client';

import { BookOpen } from 'lucide-react';
import Image from 'next/image';

interface FilteredResourceBoxProps {
  tag: string;
  title: string;
  category: string;
  type: string;
  imageUrl: string;
}

export default function FilteredResourceBox({
  tag,
  title,
  category,
  type,
  imageUrl,
}: FilteredResourceBoxProps) {
  return (
    <div
      className="
        group relative w-full max-w-[300px] overflow-hidden rounded-2xl
        border border-slate-200 bg-white/90 shadow-sm transition hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900/60
      "
    >
      {/* Top Image (fully visible) */}
      <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 320px) 300px, 300px"
          className="object-contain"
          // or: style={{ objectFit: 'contain' }}
        />
        {tag && (
          <span
            className="
              absolute left-2 top-2 inline-flex items-center rounded-full px-2 py-0.5
              text-[11px] font-medium backdrop-blur-sm ring-1
              bg-white/90 text-slate-700 ring-slate-200
              dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-700
            "
          >
            {tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 text-sm">
        <span
          className="
            inline-block rounded-full px-2 py-[2px] text-[11px] mb-1
            bg-slate-100 text-slate-600
            dark:bg-slate-800/70 dark:text-slate-300
          "
        >
          {type}
        </span>

        <h3 className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {category && (
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">{category}</p>
        )}

        <button
          className="
            mt-3 w-full inline-flex items-center justify-center gap-2
            rounded-md border px-4 py-2 text-sm font-medium transition
            border-slate-200 bg-slate-900 text-white hover:bg-slate-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            dark:border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100
            dark:focus-visible:ring-offset-slate-950
          "
          aria-label={`View notes: ${title}`}
        >
          <BookOpen size={16} />
          View Notes
        </button>
      </div>
    </div>
  );
}
