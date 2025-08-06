'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent from '@/components/TableComponent';
import { Eye, Edit, Trash2 } from 'lucide-react';
import ImageModal from '@/components/ImageModal';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ViewChapter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const data = [
    {
      id: 'CH091',
      name: 'Introduction to Algorithms',
      course: 'AS',
      status: 'published',
      created: '2024-01-15',
      image: '/loginbg.jpeg',
    },
    {
      id: 'CH002',
      name: 'Data Structures Fundamentals',
      course: 'A2',
      status: 'draft',
      created: '2024-01-20',
     image: '/loginbg.jpeg',
    },
  ];

  const columns = [
    { header: 'Chapter ID', accessor: 'id' },
    { header: 'Chapter Name', accessor: 'name' },
    { header: 'Courses', accessor: 'course' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value}
        </span>
      ),
    },
    { header: 'Created', accessor: 'created' },
    {
      header: 'Chapter Image',
      accessor: 'image',
      render: (_: string, row: any) => (
        <button
          onClick={() => {
            setImageSrc(row.image);
            setShowImageModal(true);
          }}
          className="border px-3 py-1 rounded text-sm"
        >
          View
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_: any, row: any) => (
        <div className="flex gap-3">
          <button className="text-blue-600 hover:text-blue-800">
            <Edit size={18} />
          </button>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => {
              setDeleteRowId(row.id);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="bg-[#F9FAFB] text-gray-800">
      <PageHeader
        title="View Chapter"
        description="Manage your chapters"
        buttonText="Add Chapter"
        path="/add-chapter"
      />

      <div className="px-4 py-6">
        <TableComponent columns={columns} data={data} />
      </div>

      {/* Image Modal */}
      {showImageModal && imageSrc && (
        <ImageModal
          src={imageSrc}
          onClose={() => {
            setImageSrc(null);
            setShowImageModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Confirm Deletion"
          description={`Are you sure you want to delete chapter ID: ${deleteRowId}?`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            console.log('Deleted:', deleteRowId);
            setShowDeleteModal(false);
          }}
        />
      )}
    </main>
  );
}
