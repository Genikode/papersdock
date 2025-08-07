'use client';

import { useState } from 'react';
import { UploadCloud, Save } from 'lucide-react';

export default function AddLecture() {
  const [lectureTitle, setLectureTitle] = useState('');
  const [course, setCourse] = useState('');
  const [chapter, setChapter] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [slides, setSlides] = useState<File | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideo(file);
  };

  const handleSlidesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSlides(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ lectureTitle, course, chapter, video, slides });
  };

  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Add New Lecture</h1>
      <p className="text-sm text-gray-600 mb-6">Create and upload educational content</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow px-6 py-6 max-w-4xl w-full"
      >
        <h2 className="text-lg font-semibold mb-4">Lecture Details</h2>

        {/* Lecture Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Lecture Title</label>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="Enter lecture title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Course */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">e.g., AS, A2, Composite</option>
            <option value="AS">AS</option>
            <option value="A2">A2</option>
            <option value="Composite">Composite</option>
            <option value="P2 Crash Course">P2 Crash Course</option>
            <option value="P4 Crash Course">P4 Crash Course</option>
          </select>
        </div>

        {/* Select Chapter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Select Chapter</label>
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">chapter name</option>
            <option value="CH001">Introduction to Algorithms</option>
            <option value="CH002">Data Structures</option>
            <option value="CH003">OOP Concepts</option>
            {/* Add more chapters dynamically if needed */}
          </select>
        </div>

        {/* Upload Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Video Upload */}
          <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload video lecture</p>
            <label className="cursor-pointer text-sm font-medium text-indigo-600">
              <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              Choose Video
            </label>
          </div>

          {/* Slides Upload */}
          <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload presentation slides</p>
            <label className="cursor-pointer text-sm font-medium text-indigo-600">
              <input type="file" accept=".pdf,.ppt,.pptx" onChange={handleSlidesChange} className="hidden" />
              Choose Files
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2"
        >
          <Save size={16} />
          Save Lecture
        </button>
      </form>
    </main>
  );
}
