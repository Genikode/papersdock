'use client';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewName(file.name);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">Upload Assignment</Dialog.Title>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm mb-4"
          />

          {previewName && (
            <div className="bg-gray-100 rounded px-3 py-2 text-sm">
              Preview: {previewName}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded w-full"
          >
            Submit
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
