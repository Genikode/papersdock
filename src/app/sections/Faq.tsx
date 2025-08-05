// app/components/FAQ.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: 'How does PapersDock guarantee A* results?',
    answer:
      "Our proven methodology combines interactive learning, expert mentorship, and AI-powered feedback. We track your progress continuously and adjust your learning path. If you don't achieve your target grade after completing our program, we offer additional support at no cost.",
  },
  {
    question: 'What makes PapersDock different from other platforms?',
    answer:
      "PapersDock uniquely blends technology and personal guidance. With real-time progress tracking, dedicated mentors, and tailored coding labs, our learning experience is unmatched in depth and personalization.",
  },
  {
    question: 'How much time do I need to commit weekly?',
    answer:
      "We recommend dedicating 6–8 hours per week. Our flexible schedule allows you to learn at your own pace, while still making steady progress.",
  },
  {
    question: 'Do you cover all A-Level Computer Science exam boards?',
    answer:
      "Yes, we align our curriculum with all major A-Level Computer Science boards, including Cambridge, Edexcel, and OCR.",
  },
  {
    question: 'Can I get help with coursework and projects?',
    answer:
      "Absolutely! Our mentors provide project feedback, code reviews, and practical guidance to help you ace both coursework and final assessments.",
  },
  {
    question: "What if I'm completely new to programming?",
    answer:
      "No worries! Our beginner-friendly modules and one-on-one mentoring are designed to help you build confidence from Day 1. You'll be writing your first program in no time!",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-gray-600">Everything you need to know about PapersDock</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-lg p-5 text-left shadow-sm border border-gray-100 transition"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex justify-between items-center text-left"
            >
              <span className="text-sm md:text-base font-medium text-gray-900">
                {faq.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {openIndex === i && (
              <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-gray-500 mb-3">Still have questions?</p>
        <Link
          href="#"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium shadow hover:bg-blue-700"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}
