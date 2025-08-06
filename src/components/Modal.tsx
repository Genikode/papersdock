'use client';

import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
