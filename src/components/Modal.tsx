'use client';

import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;

  statusUser?: string | null | undefined;
}

export default function Modal({ title, onClose, children, statusUser }: ModalProps) {

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center">
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">

          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {/* Status of User */}
          {statusUser && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {statusUser?.includes('N') ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Active</span>
            ) :  (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Inactive</span>
            )}
            
          </div>
          )}
          </div>
          
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100
                       dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <X />
          </button>
        </div>
        <div className="p-4 text-slate-700 dark:text-slate-300">{children}</div>
      </div>
    </div>
  );
}
