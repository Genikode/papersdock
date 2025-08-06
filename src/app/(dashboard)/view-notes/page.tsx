'use client';

import PageHeader from '@/components/PageHeader';
import TableComponent from '@/components/TableComponent';
import { Eye, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/Modal'; // assuming a reusable modal component

const notesData = [
  {
    id: 23,
    title: 'Data Structures Quick Reference',
    noteType: 'dark mode',
    category: 'AS',
    format: 'PDF',
    created: '2024-01-15',
  },
  {
    id: 12,
    title: 'Algorithm Analysis Notes',
    noteType: 'light mode',
    category: 'A2',
    format: 'Word',
    created: '2024-01-20',
  },
  {
    id: 45,
    title: 'Programming Fundamentals Summary',
    noteType: 'dark mode',
    category: 'Composite',
    format: 'PDF',
    created: '2024-01-25',
  },
  {
    id: 56,
    title: 'Calculus Integration Formulas',
    noteType: 'light mode',
    category: 'P2 Crash Course',
    format: 'PDF',
    created: '2024-01-30',
  },
  {
    id: 87,
    title: 'Physics Mechanics Laws',
    noteType: 'dark mode',
    category: 'P4 Crash Course',
    format: 'Word',
    created: '2024-02-01',
  },
];

export default function ViewNotesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  const handleView = (note: any) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Title', accessor: 'title' },
    {
      header: 'Note Type',
      accessor: 'noteType',
      render: (value: string) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            value === 'dark mode'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (value: string) => (
        <span className="text-xs bg-gray-100 rounded-full px-2 py-1">{value}</span>
      ),
    },
    {
      header: 'Format',
      accessor: 'format',
      render: (value: string) => (
        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{value}</span>
      ),
    },
    { header: 'Created', accessor: 'created' },
    {
      header: 'View Background',
      accessor: 'view',
      render: (_: any, row: any) => (
        <button
          onClick={() => handleView(row)}
          className="border px-4 py-1 rounded hover:bg-gray-100"
        >
          View
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_: any, row: any) => (
        <div className="flex gap-3 items-center">
          <Eye className="cursor-pointer w-4 h-4" onClick={() => handleView(row)} />
          <Pencil className="cursor-pointer w-4 h-4" />
          <Trash className="cursor-pointer w-4 h-4" />
        </div>
      ),
    },
  ];

  return (
    <main className="bg-[#F9FAFB] text-gray-800">
      <PageHeader title="View Notes" description="Manage your notes" />
      <div className="mt-4">
        <TableComponent columns={columns} data={notesData} />
      </div>

      {showModal && selectedNote && (
        <Modal title="Note Background" onClose={() => setShowModal(false)}>
          <p className="text-sm text-gray-700">Title: {selectedNote.title}</p>
          <p className="text-sm text-gray-700">Type: {selectedNote.noteType}</p>
          <p className="text-sm text-gray-700">Format: {selectedNote.format}</p>
        </Modal>
      )}
    </main>
  );
}
