// app/components/Contact.tsx
'use client';

import { Mail, MessageCircle, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';

export default function Contact() {
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as typeof e.currentTarget & {
      name: { value: string };
      email: { value: string };
      message: { value: string };
    };

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const to = 'papersdockcoordinator@gmail.com';
    const subject = `New message from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto; // opens default email app with draft
  }, []);

  return (
    <section className="bg-white text-gray-900 dark:bg-[#0D1117] dark:text-white transition-colors py-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Side */}
        <div>
          <h2 className="text-3xl font-bold mb-4">Have Questions? Get in Touch</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Whether it’s about syllabus coverage, sessions, or registration, feel free to reach out. We’re always ready to help.
          </p>

          <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300 mb-8">
            <li className="flex items-center gap-2">
              <MessageCircle size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-gray-800 dark:text-gray-200">WhatsApp: +92 318 2248934</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-gray-800 dark:text-gray-200">papersdockcoordinator@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-gray-800 dark:text-gray-200">Available Globally</span>
            </li>
          </ul>

          <div className="flex gap-4">
            <Link
              href="/contact"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Contact
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.google.com/forms/d/e/1FAIpQLScoTIkG9tHQjF5PSfwbeH-M8qKMXLXILMWPH4aXTaVCBmdqUg/viewform"
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 px-6 py-2 rounded-md text-sm font-medium"
            >
              Registration Link
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="bg-gray-50 dark:bg-[#161B22] p-6 rounded-xl w-full transition-colors border border-transparent dark:border-transparent">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Contact</h3>
          <form className="space-y-4" onSubmit={onSubmit}>
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-[#20262E] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-[#20262E] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="message"
              rows={4}
              placeholder="Your Message"
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-[#20262E] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
