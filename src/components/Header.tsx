'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // next-themes
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm fixed top-0 left-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold">
            PD
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">PapersDock</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme toggle (hydration-safe icon) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {/* Avoid SSR mismatch: render icon only after mount */}
            {mounted ? (
              resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />
            ) : (
              // placeholder to keep layout stable
              <span className="inline-block h-[18px] w-[18px]" />
            )}
          </button>

          {/* Sign In Button */}
          <div className="hidden md:block">
            <Link
              href="/login"
              className="px-5 py-2 rounded-md bg-gradient-to-r from-[#4F46E5] to-[#2563EB] dark:from-[#3B82F6] dark:to-[#6366F1] text-white shadow-md text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open navigation menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 px-6 pb-4 transition-colors">
          <nav className="flex flex-col gap-4 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="flex items-center gap-3 mt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-5 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-indigo-600 text-white shadow-md text-sm font-semibold"
              >
                Sign in
              </Link>

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {mounted ? (
                  resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />
                ) : (
                  <span className="inline-block h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
