'use client';

import PageHeader from '@/components/PageHeader';
import AssignmentCard from '@/components/AssignmentCard';
import { useState } from 'react';

type Assignment = {
  id: number;
  title: string;
  subject: string;
  category: string;
  dueDate: string;
  submissions: string;
  status: "Active" | "Draft";
};

const assignments: Assignment[] = [
  {
    id: 1,
    title: 'Mathematics Quiz - Algebra Basics',
    subject: 'Mathematics',
    category: 'A2',
    dueDate: '2024-01-25',
    submissions: '45 / 50',
    status: 'Active',
  },
  {
    id: 2,
    title: 'Physics Assignment - Motion and Forces',
    subject: 'Physics',
    category: 'AS',
    dueDate: '2024-01-22',
    submissions: '38 / 42',
    status: 'Active',
  },
];

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!filterCategory || a.category === filterCategory)
  );

  return (
    <main className="bg-[#F9FAFB] p-6 min-h-screen">
      <PageHeader title="Assignments" description="All current assignments" />

      <div className="flex justify-between items-center mt-4 mb-2">
        <select
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="">All Categories</option>
          <option value="AS">AS</option>
          <option value="A2">A2</option>
        </select>

        <input
          type="text"
          placeholder="Search assignment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-1 rounded w-64"
        />
      </div>

      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </main>
  );
}
