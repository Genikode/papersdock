'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface Lecture {
  id: number;
  title: string;
  subject: string;
  chapter: string;
  date: string;
  views: number;
  thumbnail: string;
  videoUrl: string;
  course: string;
}

const lectures: Lecture[] = [
  {
    id: 1,
    title: 'Introduction to Algorithms',
    subject: 'Computer Science',
    chapter: 'Chapter 1: Fundamentals',
    date: '1/15/2024',
    views: 60,
    thumbnail: '/videos/lecture-thumb.jpg',
    videoUrl: '/videos/sample.mp4',
    course: 'AS',
  },
  {
    id: 2,
    title: 'Data Structures Fundamentals',
    subject: 'Computer Science',
    chapter: 'Chapter 2: Data Organization',
    date: '1/20/2024',
    views: 90,
    thumbnail: '/videos/lecture-thumb.jpg',
    videoUrl: '/videos/sample.mp4',
    course: 'A2',
  },
  // Add more lecture entries...
];

const courses = ['All', 'AS', 'A2', 'Composite', 'P2 Crash Course', 'P4 Crash Course'];

export default function RecordedLectures() {
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  const itemsPerPage = 6;

  const filteredLectures = selectedCourse === 'All'
    ? lectures
    : lectures.filter((lecture) => lecture.course === selectedCourse);

  const paginatedLectures = filteredLectures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLectures.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Recorded Lectures</h1>

      <div className="flex items-center justify-between mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded text-sm"
        >
          {courses.map((course) => (
            <option key={course}>{course}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search lectures..."
          className="border px-3 py-2 rounded text-sm w-64"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedLectures.map((lecture) => (
          <div
            key={lecture.id}
            className="bg-white shadow rounded overflow-hidden"
          >
            <img src={lecture.thumbnail} alt={lecture.title} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-800">{lecture.title}</h2>
              <p className="text-xs text-gray-500">{lecture.subject}</p>
              <p className="text-xs text-gray-500">{lecture.chapter}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400">{lecture.date}</span>
                <button
                  onClick={() => setSelectedLecture(lecture)}
                  className="bg-gray-800 text-white px-3 py-1 text-xs rounded flex items-center gap-1"
                >
                  <Play size={14} />
                  Watch
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === idx + 1 ? 'bg-gray-200 font-semibold' : ''
            }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {selectedLecture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg overflow-hidden w-[90%] max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{selectedLecture.title}</h2>
              <button
                onClick={() => setSelectedLecture(null)}
                className="text-gray-500 hover:text-red-500 text-lg"
              >
                &times;
              </button>
            </div>
            <video
              controls
              src={selectedLecture.videoUrl}
              className="w-full h-80 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
