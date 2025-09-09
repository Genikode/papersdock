// app/components/Testimonials.tsx
'use client';

import Image from 'next/image';
import { Star, Quote, Sun, Moon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'A-Level Student',
    grade: 'A*',
    photo: '/avatar.png',
    quote:
      'PapersDock transformed my understanding of Computer Science. The interactive coding challenges and expert feedback helped me achieve an A* grade!',
    school: 'Cambridge International',
  },
  {
    name: 'Michael Chen',
    role: 'A-Level Graduate',
    grade: 'A*',
    photo: '/avatar.png',
    quote:
      'The 24/7 support and personalized learning path made all the difference. I went from struggling with algorithms to mastering them completely.',
    school: 'Oxford Academy',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Current Student',
    grade: 'A',
    photo: '/avatar.png',
    quote:
      'Best investment I made for my A-Levels. The mock exams and detailed explanations prepared me perfectly for the real thing.',
    school: 'International School',
  },
  {
    name: 'Liam Smith',
    role: 'A-Level Student',
    grade: 'A*',
    photo: '/avatar.png',
    quote:
      'I loved the interactive coding lab! It made learning so much fun and engaging. Highly recommend PapersDock to anyone serious about Computer Science.',
    school: 'Global High School',
  },
  {
    name: 'Olivia Davis',
    role: 'A-Level Graduate',
    grade: 'A',
    photo: '/avatar.png',
    quote:
      'The AI-powered feedback and personalized study paths were a game-changer. I passed with flying colors!',
    school: 'Tech Academy',
  },
  {
    name: 'Noah Brown',
    role: 'Current Student',
    grade: 'A*',
    photo: '/avatar.png',
    quote:
      'PapersDock made complex topics easy to understand. The mentorship and resources were top-notch. I couldn’t have done it without them!',
    school: 'Future Leaders School',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // apply theme class to html element
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index]);

  const getVisibleTestimonials = () => {
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(testimonials[(index + i) % testimonials.length]);
    }
    return items;
  };

  const visible = getVisibleTestimonials();

  return (
    <section className="py-20 px-4 overflow-hidden bg-gradient-to-b from-[#EEF2FF] to-[#EFF6FF] dark:from-gray-900 dark:to-black">
      <div className="max-w-6xl mx-auto flex items-start justify-between mb-8">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">What Our Students Say</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Join thousands of students who have transformed their A-Level Computer Science results with PapersDock
          </p>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div
            className="bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-sm flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
            aria-hidden
          >
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} fill="currentColor" stroke="currentColor" size={14} />
              ))}
            </div>
            <span>4.9/5 from 2.8k+ students</span>
          </div>

          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200 hover:opacity-90"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
          {visible.map((student, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-left shadow-md transform transition duration-500 ease-in-out hover:scale-[1.02] border border-transparent dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={student.photo}
                    alt={student.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{student.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.role}</p>
                  </div>
                </div>
                <span className="bg-gradient-to-r from-blue-500 to-green-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {student.grade}
                </span>
              </div>

              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} fill="currentColor" stroke="currentColor" size={16} />
                ))}
              </div>

              <Quote className="text-blue-400 dark:text-blue-300 mb-2" size={20} />
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">{student.quote}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{student.school}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6 text-sm font-medium">
          <button
            onClick={prev}
            className="text-blue-600 dark:text-blue-300 hover:underline bg-transparent p-1 rounded"
          >
            ← Previous
          </button>
          <button
            onClick={next}
            className="text-blue-600 dark:text-blue-300 hover:underline bg-transparent p-1 rounded"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
