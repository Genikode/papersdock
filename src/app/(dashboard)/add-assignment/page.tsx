'use client';

import { useState } from 'react';
import { UploadCloud, Save } from 'lucide-react';

export default function AddAssignment() {
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);

  const handleSave = () => {
    console.log({
      assignmentTitle,
      dueDate,
      category,
      description,
      videoFile,
      slidesFile
    });
    // Add form submission logic here
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-gray-800 p-6">
      <h1 className="text-3xl font-bold">Create Assignment</h1>
      <p className="text-gray-500 mb-6">Design assignments and quizzes for students</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-semibold mb-4">Assignment Details</h2>

          <div className="mb-4">
            <label className="block font-medium text-sm mb-1">Assignment Title</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Weekly Quiz 1"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium text-sm mb-1">Due Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Category</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Loops"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-medium text-sm mb-1">Descriptions</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Enter assignment description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Save size={18} /> Save Assignment
          </button>
        </div>

        {/* Right Side Upload Section */}
        <div className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-semibold mb-4">Upload Content</h2>

          <div className="border rounded-md p-6 text-center mb-4">
            <UploadCloud className="mx-auto text-gray-400" size={28} />
            <p className="text-sm text-gray-600 mt-2 mb-4">Upload video lecture</p>
            <label className="cursor-pointer inline-block text-blue-600 font-medium">
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile ? videoFile.name : 'Choose Video'}
            </label>
          </div>

          <div className="border rounded-md p-6 text-center">
            <UploadCloud className="mx-auto text-gray-400" size={28} />
            <p className="text-sm text-gray-600 mt-2 mb-4">Upload presentation slides</p>
            <label className="cursor-pointer inline-block text-blue-600 font-medium">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => setSlidesFile(e.target.files?.[0] || null)}
              />
              {slidesFile ? slidesFile.name : 'Choose Files'}
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
