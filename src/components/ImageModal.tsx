import React from 'react';

interface Props {
  src: string;
  onClose: () => void;
}

const ImageModal: React.FC<Props> = ({ src, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl max-w-xl border border-slate-200 dark:border-slate-800">
      <img
        src={src}
        alt="Chapter"
        className="rounded max-w-full h-auto shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
      />
      <button
        onClick={onClose}
        className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium
                   bg-red-600 hover:bg-red-700 text-white
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                   focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Close
      </button>
    </div>
  </div>
);

export default ImageModal;
