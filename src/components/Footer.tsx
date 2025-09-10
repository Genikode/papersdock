'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer
      className="
        relative pt-16 pb-10 px-6
        text-slate-800 bg-[#a0d4ff]
        bg-[url('/footer-bg.jpeg')] bg-cover bg-bottom
        dark:text-slate-200 dark:bg-slate-950
        dark:bg-[url('/darkfooterbg.png')]
      "
    >
      {/* subtle overlay to improve legibility on both themes */}
      <div className="pointer-events-none absolute inset-0 bg-white/10 dark:bg-slate-950/40" />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo + About */}
        <div>
          <div className="flex items-center gap-2 mb-4">
         <Link href="/" className="flex items-center gap-2">
          <div className="border-1 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold">
            <Image src="/logo4.png" alt="Logo" width={80} height={80} className='rounded' />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">PapersDock</span>
        </Link>
         
          </div>
          <p className="text-sm text-slate-900/90 dark:text-slate-300">
            The kind of learning platform that makes you feel all accomplished inside!
          </p>
          <p className="font-semibold mt-3 text-slate-900 dark:text-slate-100">
            Problem Solving Skills
          </p>
        </div>

        {/* Discover */}
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Discover</h3>
          <ul className="space-y-1 text-sm text-slate-900 dark:text-slate-200">
            <li>Resources</li>
            <li>Pseudocode Compiler</li>
            <li>P1 Guide</li>
            <li>P2 Guide</li>
            <li>P3 Guide</li>
            <li>P4 Guide</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Support</h3>
          <ul className="space-y-1 text-sm text-slate-900 dark:text-slate-200">
            <li>Contact Us</li>
            <li>Frequently Asked Questions</li>
            <li>Pricing Guide</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Join The PapersDock Community
          </h3>
          <p className="text-sm text-slate-900/90 dark:text-slate-300 mb-3">
            Discover all things academic & be the first to hear about exciting new resources!
          </p>
          <form
            className="flex"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="newsletter">Email address</label>
            <input
              id="newsletter"
              type="email"
              placeholder="Enter Your Email Here..."
              className="
                flex-1 p-2 rounded-l-md text-sm
                bg-white/90 text-slate-900 placeholder-slate-500
                border border-white/60
                focus:outline-none focus:ring-2 focus:ring-blue-500/60
                dark:bg-white/10 dark:text-slate-100 dark:placeholder-slate-400
                dark:border-slate-700
              "
            />
            <button
              className="
                px-3 rounded-r-md
                bg-white text-blue-600
                hover:bg-slate-50
                dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white
              "
              aria-label="Subscribe"
            >
              <FiSend size={18} />
            </button>
          </form>

          <div className="flex gap-3 mt-4">
            {[
              { Icon: FaFacebookF, label: 'Facebook' },
              { Icon: FaInstagram, label: 'Instagram' },
              { Icon: FaTwitter, label: 'Twitter' },
              { Icon: FaYoutube, label: 'YouTube' },
            ].map(({ Icon, label }, i) => (
              <button
                key={i}
                aria-label={label}
                className="
                  rounded-full p-2 transition
                  bg-white/30 hover:bg-white/50
                  dark:bg-white/10 dark:hover:bg-white/20
                "
              >
                <Icon className="text-xl text-white dark:text-slate-100" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* YouTube CTA */}
      <div className="relative text-center mt-10">
        <p className="text-blue-900 dark:text-blue-300 font-semibold">Follow Our YouTube Channel</p>
        <div className="inline-flex items-center gap-2 bg-white text-slate-900 text-sm font-medium px-4 py-1.5 rounded mt-2
                        dark:bg-slate-200 dark:text-slate-900">
          <FaYoutube className="text-red-600" size={20} />
          YouTube
        </div>
      </div>

      {/* Footer bottom */}
    
    </footer>
  );
}
