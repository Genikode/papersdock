'use client';

import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="bg-[#a0d4ff] bg-[url('/footer-bg.jpeg')] bg-cover bg-bottom text-gray-800 pt-16 pb-10 px-6"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo + About */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white shadow-md rounded-md px-3 py-1 font-bold text-blue-600">PD</div>
            <span className="text-lg font-semibold text-black">PapersDock</span>
          </div>
          <p className="text-sm text-black opacity-80">
            The kind of learning platform that makes you feel all accomplished inside!
          </p>
          <p className="font-semibold mt-3 text-black">Problem Solving Skills</p>
        </div>

        {/* Discover */}
        <div>
          <h3 className="font-semibold text-blue-900 mb-2">Discover</h3>
          <ul className="space-y-1 text-sm text-black">
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
          <h3 className="font-semibold text-blue-900 mb-2">Support</h3>
          <ul className="space-y-1 text-sm text-black">
            <li>Contact Us</li>
            <li>Frequently Asked Questions</li>
            <li>Pricing Guide</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-semibold text-blue-900 mb-2">Join The PapersDock Community</h3>
          <p className="text-sm text-black opacity-80 mb-3">
            Discover all things academic & be the first to hear about exciting new resources!
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter Your Email Here..."
              className="flex-1 p-2 rounded-l-md text-sm bg-white/20 text-white border-none focus:outline-none"
            />
            <button className="bg-white text-blue-600 px-3 rounded-r-md">
              <FiSend size={18} />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="rounded-full bg-white/20 p-2">
              <FaFacebookF className="text-xl text-white" />
            </div>
            <div className="rounded-full bg-white/20 p-2">
              <FaInstagram className="text-xl text-white" />
            </div>
            <div className="rounded-full bg-white/20 p-2">
              <FaTwitter className="text-xl text-white" />
            </div>
            <div className="rounded-full bg-white/20 p-2">
              <FaYoutube className="text-xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* YouTube CTA */}
      <div className="text-center mt-10">
        <p className="text-blue-900 font-semibold">Follow Our YouTube Channel</p>
        <div className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-1.5 rounded mt-2">
          <FaYoutube className="text-red-600" size={20} />
          YouTube
        </div>
      </div>

      {/* Footer bottom */}
      <div className="mt-10 border-t border-blue-300 pt-4 text-sm text-black text-center">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
          <div className="flex gap-4">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms and Conditions</a>
          </div>
          <div>&copy; 2024 PapersDock Learning Pty Ltd. All rights reserved.</div>
          <div>
        
          </div>
        </div>
      </div>
    </footer>
  );
}