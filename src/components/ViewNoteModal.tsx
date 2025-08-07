'use client';
import { Dialog } from '@headlessui/react';
import { useState } from 'react';

export default function ViewNoteModal({ note, isOpen, onClose }: any) {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white p-6 rounded shadow-lg max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold mb-2">{note.title}</Dialog.Title>
          <p className="text-sm mb-4">Format: {note.format} | Pages: {note.pages}</p>
          <p className="text-sm text-gray-600">Preview not implemented. Attach PDF preview here.</p>
          <button onClick={onClose} className="mt-4 text-sm text-indigo-600">Close</button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
