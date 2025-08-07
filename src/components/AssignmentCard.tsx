import { useState } from 'react';
import UploadModal from './UploadModal';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  category: string;
  dueDate: string;
  submissions: string;
  status: 'Active' | 'Draft';
}

export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="border p-4 rounded shadow bg-white space-y-2">
      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold text-lg">{assignment.title}</h3>
          <p className="text-sm text-gray-500">{assignment.subject}</p>
          <p className="text-sm">Due: {assignment.dueDate}</p>
          <p className="text-sm">Submissions: {assignment.submissions}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs rounded-full px-2 py-1 bg-green-100 text-green-700 w-fit">
            {assignment.status}
          </span>
          <span className="text-xs border rounded-full px-2 py-1 text-gray-600">
            {assignment.category}
          </span>
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        <button className="flex gap-1 items-center text-sm">
          ⬇️ Download
        </button>
        <button onClick={() => setIsModalOpen(true)} className="flex gap-1 items-center text-sm">
          ⬆️ Upload
        </button>
      </div>

      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
