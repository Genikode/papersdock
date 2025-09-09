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
  <div className="fixed inset-0 bg-black/30 dark:bg-black/60" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="w-full max-w-md rounded-xl p-6 shadow-xl
                             bg-white dark:bg-slate-900
                             border border-slate-200 dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Upload Assignment
        </Dialog.Title>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100
                     dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm
                   rounded border px-3 py-2
                   border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm
                   dark:file:bg-slate-800 dark:file:text-slate-200"
      />

      {previewName && (
        <div className="rounded px-3 py-2 text-sm
                        bg-slate-100 text-slate-700
                        dark:bg-slate-800 dark:text-slate-300">
          Preview: {previewName}
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full rounded px-4 py-2 text-white
                   bg-gradient-to-r from-blue-600 to-purple-600
                   hover:from-blue-700 hover:to-purple-700
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                   focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Submit
      </button>
    </Dialog.Panel>
  </div>
</Dialog>

  );
}
