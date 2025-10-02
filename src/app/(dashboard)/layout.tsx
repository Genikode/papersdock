'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Video,
  FileText,
  StickyNote,
  BadgeCheck,
  Lock,
  Code,
  Edit,
  Sun,
  Moon,
  NotebookPen,
} from 'lucide-react';

import '../globals.css';
import { clearAccessToken, clearUserData, getUserData, isLoggedIn } from '@/lib/auth';
import { ThemeProvider, useTheme } from 'next-themes';
import Image from 'next/image';

/** Shared nav link renderer for desktop + mobile */
function NavLinks({
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  items: { label: string; href: string; icon: any }[];
  collapsed?: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={`mt-4 flex flex-col space-y-1 ${collapsed ? 'items-center' : ''}`}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex ${collapsed ? 'justify-center px-0' : 'justify-start px-4'} items-center py-3 gap-3 text-sm transition-colors duration-200 w-full ${
              isActive
                ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-950/40 dark:text-blue-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon
              size={20}
              className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Hydration-safe theme toggle */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="rounded p-2 text-gray-600 hover:text-black hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
      title="Toggle theme"
    >
      {mounted ? (
        resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />
      ) : (
        <span className="inline-block h-[18px] w-[18px]" />
      )}
    </button>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Mount guard to keep SSR/CSR output identical
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Only read auth data on the client after mount
  const currentUser = mounted ? getUserData() : null;
  const roleName = currentUser?.roleName ?? null;

  // Role-based items
  const adminNavItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'View Chapter', href: '/view-chapter', icon: Code },
      { label: 'Student Queries', href: '/student-query', icon: BookOpen },
      { label: 'View Assignments', href: '/view-assignments', icon: FileText },
      { label: 'View Notes', href: '/view-notes', icon: StickyNote },
      { label: 'Fee Approval', href: '/fee-approval', icon: BadgeCheck },
      { label: 'Student Approval', href: '/student-approval', icon: BadgeCheck },
      { label: 'Authentication', href: '/authentication', icon: Lock },
      { label: 'View Courses', href: '/view-course', icon: BookOpen },
      { label: 'Zoom Meeting', href: '/create-link', icon: Edit },
      { label: 'Suspicious User', href: '/suspicious-user', icon: Sun },
      {label: 'Login Activity', href : "/login-activity", icon: NotebookPen}
    ],
    []
  );

  const studentNavItems = useMemo(
    () => [
      { label: 'Recorded Lectures', href: '/recorded-lectures', icon: Video },
      { label: 'Assignments', href: '/assignments', icon: FileText },
      { label: 'Notes', href: '/notes', icon: StickyNote },
      { label: 'Fees', href: '/fees', icon: BadgeCheck },
      { label: 'Zoom Meeting', href: '/student-link', icon: Edit },
      { label: 'My Query', href: '/my-query', icon: BookOpen },
    ],
    []
  );

  // Until mounted, render an empty nav list so SSR == CSR
  const navItems = useMemo(() => {
    if (!mounted) return [];
    if (roleName === 'student') return studentNavItems;
    if (roleName === 'admin' || roleName == null) return adminNavItems;
    return [];
  }, [mounted, roleName, adminNavItems, studentNavItems]);

  // Desktop sidebar collapse & mobile drawer
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (mounted && !isLoggedIn()) {
      router.replace('/login');
    }
  }, [router, mounted]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearAccessToken();
    clearUserData();
    router.replace('/login');
  }

  // Hydration-safe greeting text
  const safeName = mounted ? (currentUser?.name || 'User') : 'User';
  const safeFirst = mounted ? (currentUser?.name?.split(' ')[0] || 'User') : 'User';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen overflow-hidden">
            {/* ========== Desktop Sidebar (md+) ========== */}
            <aside
              className={`hidden md:block bg-white dark:bg-slate-900 border-[1.5px] border-[whitesmoke] dark:border-slate-800 shadow-sm transition-all duration-300 ${
                collapsed ? 'w-16' : 'w-64'
              } overflow-y-auto`}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[whitesmoke] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo4.png" alt="Logo" width={40} height={40} className="rounded-2xl" />
                    <span className="font-bold text-lg text-gray-900 dark:text-white">PapersDock</span>
                  </Link>
                </div>
              </div>
              <NavLinks items={navItems} collapsed={collapsed} pathname={pathname} />
            </aside>

            {/* ========== Mobile Drawer (sm and below) ========== */}
            <div className="md:hidden" aria-hidden={!mobileOpen}>
              {/* Overlay */}
              <div
                className={`fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity ${
                  mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setMobileOpen(false)}
              />
              {/* Panel */}
              <div
                className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-[whitesmoke] dark:border-slate-800 shadow-lg transform transition-transform ${
                  mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-[whitesmoke] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white font-bold p-2 rounded-md">PD</div>
                    <span className="font-semibold text-gray-700 dark:text-slate-200">PapersDock</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-black dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close navigation"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-1">
                  <NavLinks items={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                </div>

                <div className="mt-auto border-t border-[whitesmoke] dark:border-slate-800 p-4 flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </div>
            </div>

            {/* ========== Main Content ========== */}
            <div className="flex-1 flex flex-col">
              {/* Topbar */}
              <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[whitesmoke] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Mobile burger */}
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="md:hidden rounded p-2 text-gray-600 hover:text-black hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                    aria-label="Open navigation"
                  >
                    <Menu size={22} />
                  </button>
                  {/* Desktop collapse toggle */}
                  <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="hidden md:inline-flex rounded p-2 text-gray-600 hover:text-black hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                    aria-label="Toggle sidebar"
                  >
                    <Menu size={22} />
                  </button>
                  <h1 className="font-semibold text-lg text-gray-800 dark:text-slate-100 hidden sm:block">Dashboard</h1>
                </div>

                {/* Right-side actions (desktop) */}
                <div className="hidden md:flex items-center gap-2">
                  <ThemeToggle />
                  <div className="ml-2 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                    <span className="truncate max-w-[40ch]" suppressHydrationWarning>
                      Welcome back, {safeName}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 text-red-500 dark:text-red-400 hover:underline"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </div>

                {/* Compact right-side (mobile) */}
                <div className="md:hidden flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm text-gray-600 dark:text-slate-400" suppressHydrationWarning>
                    Hi, {safeFirst}
                  </span>
                </div>
              </header>

              <main className="flex-1 p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
