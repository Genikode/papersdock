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
    <div className="flex flex-wrap gap-4">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id === selectedCategory ? null : cat.id)}
          className={clsx(
            'w-74 text-left rounded-2xl px-5 py-2 border transition-all',
            selectedCategory === cat.id
              ? 'bg-white border-blue-600 shadow text-blue-600'
              : 'bg-white border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              {cat.icon}
            </div>
            <div>
                 <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {cat.id}
            </span>
             <div className="text-[12px] font-medium text-gray-900">
            {cat.title}
          </div>
          <div className="text-sm text-gray-500">
            {cat.count} topics
          </div>
            </div>
           
          </div>
       
        </button>
      ))}
    </div>
  );
}
