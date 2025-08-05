// app/components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Resources', href: '/resources' },

  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold">
            PD
          </div>
          <span className="font-bold text-lg text-gray-900">PapersDock</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium ${
                pathname === link.href ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Sign In Button */}
        <div className="hidden md:block">
          <Link
            href="/login"
            className="px-5 py-2 rounded-md bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white shadow-md text-sm font-semibold"
          >
            Sign in
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white px-6 pb-4">
          <nav className="flex flex-col gap-4 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base font-medium ${
                  pathname === link.href ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 w-full text-center px-5 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md text-sm font-semibold"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
