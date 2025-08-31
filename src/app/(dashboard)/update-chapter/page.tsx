'use client';

import { useState } from 'react';
import { UploadCloud, Save } from 'lucide-react';

export default function UpdatesChapter() {
  const [chapterName, setChapterName] = useState('');
  const [course, setCourse] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle save logic
    // console.log({ chapterName, course, image });
  };

  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Chapter</h1>
      <p className="text-sm text-gray-600 mb-6">Create and upload chapter</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow px-6 py-6 max-w-3xl w-full"
      >
        <h2 className="text-lg font-semibold mb-4">Chapter Details</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Chapter Name</label>
          <input
            type="text"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            placeholder="Enter chapter name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">Select Course</option>
            <option value="AS">AS</option>
            <option value="A2">A2</option>
            <option value="Composite">Composite</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Upload Chapter Image</label>
          <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload chapter image</p>
            <label className="cursor-pointer text-sm font-medium text-indigo-600">
              <input type="file" onChange={handleImageChange} className="hidden" />
              Choose Image
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2"
        >
          <Save size={16} />
          Save Chapter
        </button>
      </form>
    </main>
  );
}
