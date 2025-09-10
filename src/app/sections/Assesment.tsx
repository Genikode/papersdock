'use client';

import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Code2, FileText, MonitorPlay, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

const papers = [
  {
    title: 'Paper 1',
    subtitle: 'Theory Fundamentals',
    duration: '1 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Section 1 to 8 of the syllabus content',
      'Written paper',
      '50% of the AS Level',
      '25% of the A Level',
    ],
    icon: <BookOpenCheck size={20} />,
    // light + dark variants combined
    color: 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
  },
  {
    title: 'Paper 2',
    subtitle: 'Fundamental Problem-solving & Programming Skills',
    duration: '2 hours',
    marks: '75 marks',
    points: [
      'Section 9 to 12 of the syllabus content',
      'Written paper',
      '50% of the AS Level',
      '25% of the A Level',
    ],
    icon: <MonitorPlay size={20} />,
    color: 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20',
  },
  {
    title: 'Paper 3',
    subtitle: 'Advanced Theory',
    duration: '1 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Section 13 to 20 of the syllabus content',
      'Written paper',
      'Externally assessed.',
      '25% of the AS Level',
    ],
    icon: <Code2 size={20} />,
    color: 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20',
  },
  {
    title: 'Paper 4',
    subtitle: 'Practical',
    duration: '2 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Sections 19–20 of the syllabus content',
      'Submit code and testing evidence.',
      'Use Java, Visual Basic®, or Python.',
      'No internet/email, all on computer.',
    ],
    icon: <FileText size={20} />,
    color: 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20',
  },
];

export default function AssessmentOverview() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // initialize theme from localStorage or system preference
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <section className="bg-[#F9FAFB] dark:bg-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center md:text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Syllabus Overview </h2>
            <p className="text-gray-500 dark:text-gray-300 max-w-2xl">
             This is the official syllabus for Cambridge International AS & A-Level Computer Science (9618). At the AS Level, Paper 1 focuses on the theory fundamentals of computer science, while Paper 2 develops essential problem-solving and programming skills. At the A2 Level, Paper 3 explores advanced theory in greater depth, and Paper 4 extends students’ abilities in problem-solving and programming. Together, these four papers provide a comprehensive foundation in both the theoretical and practical aspects of computer science, preparing students for further study and real-world application. 
            </p>
          </div>

         
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-16">
        {papers.map((paper, index) => (
          <div
            key={index}
            className={`rounded-xl border p-6 text-left bg-white dark:bg-gray-800 ${paper.color} text-gray-900 dark:text-gray-100`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                {paper.icon}
                <span>{paper.title}</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                <p>{paper.duration}</p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{paper.subtitle}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">{paper.marks}</p>

            <ul className="text-sm text-gray-600 dark:text-gray-200 space-y-1 mb-4">
              {paper.points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-[5px] h-[6px] w-[6px] rounded-full bg-gray-400 dark:bg-gray-300 inline-block"></span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button className="mt-auto bg-gray-900 text-white px-4 py-2 rounded-md text-sm w-full hover:opacity-95" >
              <Link  href="https://www.cambridgeinternational.org/Images/697372-2026-syllabus.pdf"
              target="_blank">
              
              View Details
              </Link>
            </button>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl px-8 py-10 max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Ready to Start Your Journey?</h3>
          <p className="text-sm mb-4">Our currently running session is for the May–June 2026 exams, which started in August. Late-joining students are welcome, but please note that they will need to clear the fees for all previous months in order to access the class recordings and materials for those sessions.</p>
          <Link
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLScoTIkG9tHQjF5PSfwbeH-M8qKMXLXILMWPH4aXTaVCBmdqUg/viewform"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-md text-sm"
          >
            Registration Form
          </Link>
        </div>
      </div>
    </section>
  );
}