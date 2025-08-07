'use client';

import { useState } from 'react';
import { UploadCloud, Save } from 'lucide-react';

export default function AddNotes() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [noteType, setNoteType] = useState('');
  const [noteImage, setNoteImage] = useState<File | null>(null);

  const handleSubmit = () => {
    console.log({
      title,
      category,
      noteType,
      noteImage
    });
    // Submit logic here
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-gray-800 p-6">
      <h1 className="text-3xl font-bold">Add New Notes</h1>
      <p className="text-gray-500 mb-6">Create comprehensive study notes and resources</p>

      <div className="bg-white p-6 rounded-md shadow border max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Notes Details</h2>

        <div className="mb-4">
          <label className="block font-medium text-sm mb-1">Notes Title</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter notes title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-medium text-sm mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a category</option>
              <option value="AS">AS</option>
              <option value="A2">A2</option>
              <option value="Composite">Composite</option>
              <option value="Crash Course">Crash Course</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select note type</option>
              <option value="light mode">light mode</option>
              <option value="dark mode">dark mode</option>
            </select>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <label className="block font-medium text-sm mb-2">Upload Note image</label>
          <div className="border rounded-md p-6 text-center">
            <UploadCloud className="mx-auto text-gray-400" size={28} />
            <p className="text-sm text-gray-600 mt-2 mb-4">Upload note image</p>
            <label className="cursor-pointer inline-block text-blue-600 font-medium">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setNoteImage(e.target.files?.[0] || null)}
              />
              {noteImage ? noteImage.name : 'Choose Image'}
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Save size={18} /> Save Notes
        </button>
      </div>
    </main>
  );
}
