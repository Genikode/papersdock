import React from 'react';

interface Props {
  src: string;
  onClose: () => void;
}

const ImageModal: React.FC<Props> = ({ src, onClose }) => (
  <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded shadow-md max-w-xl">
      <img src={src} alt="Chapter" className="rounded max-w-full h-auto" />
      <button
        onClick={onClose}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Close
      </button>
    </div>
  </div>
);

export default ImageModal;
