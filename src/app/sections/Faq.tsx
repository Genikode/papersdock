// app/components/FAQ.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: "How can we register for the session?",
    answer: `Below are the links for the following sessions that we offer currently. You can learn about the registration process in detail by watching the videos below. The registration form link is also provided so you can register directly.

A2: https://www.youtube.com/watch?v=xBCXHiTaF70
AS: https://www.youtube.com/watch?v=eLb_xlU1pkQ
Form Link: https://docs.google.com/forms/d/e/1FAIpQLScoTIkG9tHQjF5PSfwbeH-M8qKMXLXILMWPH4aXTaVCBmdqUg/viewform`,
  },
  {
    question: "Is there an Oct/Nov intake that you guys offer?",
    answer: "No, we do not offer Oct/Nov intake.",
  },
  {
    question: "Can we buy the recordings?",
    answer:
      "No, you cannot; you would have to join the session to get the recordings.",
  },
  {
    question: "What are the dues per session?",
    answer:
      "The fee is Rs. 5,000 per month for AS and A2 students and Rs. 10,000 per month for composite students.",
  },
  {
    question:
      "What about the classes that we have missed, how can we cover that content?",
    answer:
      "Each live class is recorded and then posted on the portal for students to access, ensuring that students don't fall behind.",
  },
  {
    question: "I want to join now, do I have to pay for the previous months?",
    answer:
      "Yes, since the session started in August and all recorded lectures are available, students who join later still need to clear the fees for the previous months. This policy ensures fairness to all students who have been paying regularly since August while receiving the same content.",
  },
  {
    question: "Can I start the session after Oct/Nov Intake?",
    answer:
      "Yes, you can, but you would have to clear the dues for the previous months as you will receive the recordings of those months. This policy ensures fairness to all students who have been paying regularly since August while receiving the same content. Therefore, we cannot allow anyone to access previous months' recordings without clearing the fee for those months.",
  },
  {
    question: "Is there another session or batch?",
    answer:
      "No, there’s only one batch and its session started in August. There will be a crash course around February, but that will only cover CS Paper 4 and Paper 2. The classes in the crash course will be relatively fast-paced compared to the regular session.",
  },
  {
    question: "Does PapersDock offer O Level classes?",
    answer: "No, we only offer A Level Computer Science classes for now.",
  },
  {
    question: "Do you offer discounts on fees?",
    answer:
      "No, we don’t offer discounts. Fee concession is only considered in cases of genuine financial difficulty, which you will need to explain to us.",
  },
  {
    question: "Do you offer any past papers sessions?",
    answer:
      "No, we don’t offer a separate yearly past paper session. We believe yearly past papers should be completed by students for preparation. However, by the end of the session, we conduct a 10-day topical past paper session.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="bg-white dark:bg-gray-900 transition-colors py-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Everything you need to know about PapersDock
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 text-left shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
              className="w-full flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
            >
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                {faq.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            {openIndex === i && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Still have questions?</p>
        <Link
          href="/contact"
          className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}
