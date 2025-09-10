// app/components/FAQ.tsx
'use client';

import React, { JSX, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type FAQItem = { question: string; answer: string };

const faqs: FAQItem[] = [
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
    answer: "No, you cannot; you would have to join the session to get the recordings.",
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
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="bg-white dark:bg-gray-900 transition-colors py-14 sm:py-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Everything you need to know about PapersDock
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          const contentId = `faq-panel-${i}`;
          return (
            <div
              key={faq.question}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-5 text-left shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className="w-full flex justify-between items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 rounded"
              >
                <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 break-words">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
                )}
              </button>

              {/* Smooth height transition for mobile */}
              <div
                id={contentId}
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line break-words">
                    {renderAnswerWithLinks(faq.answer)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8 sm:mt-10">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
          Still have questions?
        </p>
        <Link
          href="/contact"
          className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-md text-sm font-medium shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}

/** Turns raw URLs in the answer into clickable links while preserving line breaks. */
function renderAnswerWithLinks(text: string) {
  const urlRegex =
    /(https?:\/\/[^\s]+)/gi;

  const parts: Array<string | JSX.Element> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const url = match[0];

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    parts.push(
      <a
        key={`${url}-${start}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80 break-all"
      >
        {url}
      </a>
    );

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
