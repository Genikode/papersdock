'use client';

import PageHeader from '@/components/PageHeader';
import NoteCard from '@/components/NoteCard';
import ViewNoteModal from '@/components/ViewNoteModal';
import { useState } from 'react';

const mockNotes = [
  {
    id: 1,
    title: 'Data Structures Quick Reference',
    subject: 'Computer Science',
    course: 'AS',
    format: 'PDF',
    pages: 12,
    created: '1/15/2024',
  },
  {
    id: 2,
    title: 'Algorithm Analysis Notes',
    subject: 'Computer Science',
    course: 'A2',
    format: 'Word',
    pages: 8,
    created: '1/20/2024',
  },
  // Add more mock notes here...
];

export default function StudyNotesPage() {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 6;

  const filtered = mockNotes.filter((n) =>
    (!courseFilter || n.course === courseFilter) &&
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleView = (note: any) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-8">
      <PageHeader title="Study Notes" description="Browse and view your notes" />

      <div className="flex items-center justify-between mb-4">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Courses</option>
          <option value="AS">AS</option>
          <option value="A2">A2</option>
          <option value="Composite">Composite</option>
        </select>

        <input
          type="text"
          placeholder="Search lectures..."
          className="border px-3 py-2 rounded text-sm w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {paginated.map((note) => (
          <NoteCard key={note.id} note={note} onView={handleView} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <span>
          Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`px-3 py-1 border rounded ${page === idx + 1 ? 'bg-indigo-100 font-semibold' : ''}`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* View Modal */}
      <ViewNoteModal
        note={selectedNote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
