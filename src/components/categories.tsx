'use client';

import clsx from 'clsx';

interface Category {
  id: string;
  title: string;
  count: number;
  icon?: React.ReactNode;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div
      className="w-full flex flex-wrap gap-4 justify-center sm:justify-center"
      role="tablist"
      aria-label="Resource categories"
    >
      {categories.map((cat) => {
        const selected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(selected ? null : cat.id)}
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${cat.id}`}
            className={clsx(
              // mobile: full-width + centered; desktop: original sizing/flow
              'w-full sm:w-auto max-w-[22rem] sm:max-w-none mx-auto sm:mx-0',
              'text-left rounded-2xl px-5 py-2 border transition-all outline-none',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'dark:focus-visible:ring-offset-slate-950',
              selected
                ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            )}
          >
            <div className="flex items-center gap-3 mb-3 justify-center">
              <div
                className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  selected
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                )}
              >
                {cat.icon}
              </div>

              <div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full
                                  bg-slate-100 text-slate-600
                                  dark:bg-slate-800/70 dark:text-slate-300">
                  {cat.id}
                </span>

                <div className="text-[12px] font-medium mt-1
                                text-slate-900 dark:text-slate-100">
                  {cat.title}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
