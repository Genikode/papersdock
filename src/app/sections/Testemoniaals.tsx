// app/components/Testimonials.tsx
'use client';

import Image from 'next/image';
import { Star, Quote, Sun, Moon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const testimonials = [
  {
    name: 'Rehan Ali',
    role: 'Composite (AS+A2) Retake Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `love u hogaya sir ur crash course portal really saved my life, gave composite AS+A2 and only started studying in april but alhamdulilah jumped from a d in AS to a B in this retake. May allah bless you Sir taha`,
    school: '',
  },
  {
    name: 'Shafay Shaikh',
    role: 'A-Level Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `Sir, I love you. Aap to best se bhi best hain.
Matlab, main woh bacha tha jisko pseudocode ka P bhi nahi aata tha.
Ratta mujh se lagta nahi tha, lekin sirf aapki wajah se mera A aa gaya. Love you sir.`,
    school: '',
  },
  {
    name: 'Essa Sheikh',
    role: 'Retake Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `Sir, thank you so much. Aap legend hain. Main retake de raha tha, last time U aya, lekin aapke sirf 3-month session se B aa gaya. Love you sir.`,
    school: '',
  },
  {
    name: 'Aeidan Qureshi',
    role: 'A-Level Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `AOA sir, I got B in Computer Science just because of you. Thanks sir.
Last year bhi diya tha Computer lekin U aya tha. Ye grade sirf aapki wajah se aya hai.`,
    school: '',
  },
  {
    name: 'Afra Iqbal',
    role: 'A2 Crash Course Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `Hello sir, I was your student in the A2 batch crash course.
I got an A grade in Computer Science, Alhamdulillah. Thank you so much for all the hard work, time, and effort you put into your classes and notes. They really helped me a lot to achieve my desired grade.`,
    school: '',
  },
  {
    name: 'Salman Hassan',
    role: 'AS Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `Sir, Alhamdulillah I got an "a" in AS Computer Science. Loved your way of teaching and your approach throughout the AS year. Jazakallah khairan. Allah aapko khush rakhay dono jahaanon mein.`,
    school: '',
  },
  {
    name: 'Maryam',
    role: 'Student',
    grade: '9618',
    photo: '/avatar.png',
    quote: `Aoa sir. Just wanted to say thank you for being such a great teacher. No one teaches CS better than you do. Your way of teaching and your mindset of “getting the concept” and not just memorizing everything is exactly how I prefer to study. I haven’t coded in quite a while now but I’m pretty sure I can still write all the ADT codes because my concepts are clear. Thank you for being so amazing and for being so supportive the entire time. I hope Allah rewards you with everything that is good for you.`,
    school: '',
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
      <div className="max-w-6xl mx-auto flex items-center justify-center mb-8">
        <div className="text-center md:text-center w-full md:w-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 ">What Our Students Say</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Join thousands of students who have transformed their A-Level Computer Science results with PapersDock
          </p>
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
