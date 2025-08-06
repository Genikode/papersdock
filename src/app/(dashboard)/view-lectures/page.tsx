'use client';

import PageHeader from '@/components/PageHeader';
import TableComponent from '@/components/TableComponent';
import { useState } from 'react';
import { Eye, Edit2, Trash2, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';

const lectures = [
  {
    id: 'CH001',
    lectureName: 'Introduction to Algorithms',
    chapterId: 'CH001',
    chapterName: 'Introduction to Algorithms',
    course: 'AS',
    date: '2024-01-15',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    id: 'CH002',
    lectureName: 'Data Structures Fundamentals',
    chapterId: 'CH002',
    chapterName: 'Data Structures Fundamentals',
    course: 'A2',
    date: '2024-01-20',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  // Add more as needed
];

export default function ViewLecture() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const columns = [
    { header: 'Lecture ID', accessor: 'id' },
    { header: 'Lecture Name', accessor: 'lectureName' },
    { header: 'Chapter ID', accessor: 'chapterId' },
    { header: 'Chapter Name', accessor: 'chapterName' },
    {
      header: 'Courses',
      accessor: 'course',
      render: (value: string) => (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{value}</span>
      ),
    },
    { header: 'Created', accessor: 'date' },
    {
      header: 'Lecture Video',
      accessor: 'videoUrl',
      render: (value: string) => (
        <button
          onClick={() => setSelectedVideo(value)}
          className="px-4 py-1 border rounded text-sm"
        >
          View
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: () => (
        <div className="flex items-center gap-3">
          <button
            className="hover:text-blue-500"
            onClick={() => setShowEditModal(true)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="hover:text-red-500"
            onClick={() => setShowDeleteModal(true)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="bg-[#F9FAFB] min-h-screen p-4">
      <PageHeader
        title="View Lectures"
        description="Manage your lectures"
        buttonText="Add Lecture"
        path="/add-lecture"
      />

      <TableComponent columns={columns} data={lectures} />

      {/* View Video Modal */}
      {selectedVideo && (
        <Modal onClose={() => setSelectedVideo(null)}>
          <iframe
            src={selectedVideo}
            className="w-full aspect-video"
            allowFullScreen
          ></iframe>
        </Modal>
      )}

      {/* Edit Modal (Placeholder) */}
      {showEditModal && (
        <Modal title="Edit Lecture" onClose={() => setShowEditModal(false)}>
          <div className="text-sm text-gray-700">Edit lecture form goes here...</div>
        </Modal>
      )}

      {/* Delete Modal (Placeholder) */}
      {showDeleteModal && (
        <Modal title="Confirm Delete" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete this lecture?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-1 border rounded"
            >
              Cancel
            </button>
            <button className="px-4 py-1 bg-red-500 text-white rounded">Delete</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
