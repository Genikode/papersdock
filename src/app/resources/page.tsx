'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import clsx from 'clsx';
import FilteredResourceBox from '@/components/FilterNotes';
import { BookOpen as BookIcon, Code2, Cog, DatabaseZap } from 'lucide-react';
import CategoryTabs from '@/components/categories';
import AiLogicChecker from '../sections/AiLogicChecker';

const categories = [
  { id: 'P1', title: 'Theory Fundamentals', count: 5, icon: <BookIcon size={18} /> },
  { id: 'P2', title: 'Problem Solving Skills', count: 3, icon: <Code2 size={18} /> },
  { id: 'P3', title: 'Advanced Theory', count: 3, icon: <Cog size={18} /> },
  { id: 'P4', title: 'Practical Applications', count: 2, icon: <DatabaseZap size={18} /> },
];

const resources = [
  { id: 1, category: 'P1', title: 'DATA REPRESENTATION', type: 'Theory', subType: 'Theory Fundamentals', image: '/background-trial.jpeg' },
  { id: 2, category: 'P1', title: 'MULTIMEDIA', type: 'Theory', subType: 'Theory Fundamentals', image: '/background-trial.jpeg' },
  { id: 3, category: 'P1', title: 'COMPRESSION', type: 'Theory', subType: 'Theory Fundamentals', image: '/background-trial.jpeg' },
  { id: 4, category: 'P4', title: 'LOGIC GATES', type: 'Theory', subType: 'Theory Fundamentals', image: '/background-trial.jpeg' },
  { id: 5, category: 'P1', title: 'COMMUNICATION', type: 'Theory', subType: 'Theory Fundamentals', image: '/background-trial.jpeg' },
  { id: 6, category: 'P2', title: 'ALGORITHMS', type: 'Programming', subType: 'Problem Solving Programming Skills', image: '/background-trial.jpeg' },
  { id: 7, category: 'P2', title: 'PROGRAMMING CONCEPTS', type: 'Programming', subType: 'Problem Solving Programming Skills', image: '/background-trial.jpeg' },
  { id: 8, category: 'P3', title: 'DATA STRUCTURES', type: 'Programming', subType: 'Problem Solving Programming Skills', image: '/background-trial.jpeg' },
];

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [page, setPage] = useState(1);

  const pageSize = 4;
  const filteredResources = selectedCategory
    ? resources.filter((r) => r.category === selectedCategory)
    : resources;

  const totalPages = Math.ceil(filteredResources.length / pageSize);
  const paginatedResources = filteredResources.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
  
    <div className="px-4 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mb-4">
          🚀 <span>Complete Learning Resources</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Master Every Topic</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive resources for all A-Level Computer Science papers. From theory fundamentals to practical applications.
        </p>
      </div>

      <div className="flex flex-wrap justify-center mb-8">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>

        <h2 className="text-lg font-semibold text-gray-800">
          {selectedCategory ? `Resources for ${categories.find(c => c.id === selectedCategory)?.title}` : 'All Resources'}
        </h2>
        <p className="text-sm text-gray-500">
          13 topics • Page 1 of 2 • Click on paper categories above to filter
        </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'dark' | 'light')}
            className="border border-gray-300 rounded-md text-sm px-3 py-2"
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-5">
        {paginatedResources.map((res) => (
          <FilteredResourceBox
            key={res.id}
            tag={res.category}
            title={res.title}
            category={res.subType}
            type={res.type}
            imageUrl={res.image}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-10">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={clsx(
            "flex items-center px-4 py-2 rounded-md border text-sm font-medium",
            page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700"
          )}
        >
          <span className="mr-2">&lt;</span> Previous
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setPage(idx + 1)}
            className={clsx(
              "px-4 py-2 rounded-md border text-sm font-medium",
              page === idx + 1 ? "bg-gray-900 text-white" : "bg-white text-gray-700"
            )}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={clsx(
            "flex items-center px-4 py-2 rounded-md border text-sm font-medium",
            page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700"
          )}
        >
          Next <span className="ml-2">&gt;</span>
        </button>
      </div>
    </div>
      <AiLogicChecker/>
      </>
  );
}
