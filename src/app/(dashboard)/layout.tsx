'use client';
import type { Metadata } from "next";

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Plus,
  Video,
  FileText,
  StickyNote,
  BadgeCheck,
  Lock,
  Code,
  Edit,
} from 'lucide-react';
import Link from "next/link";
import { useEffect } from 'react';
import { clearAccessToken, clearUserData, getUserData, isLoggedIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const router = useRouter();

    // Role-based navigation items
    const adminNavItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'View Chapter', href: '/view-chapter', icon: Code },
      { label: 'Add Chapter', href: '/add-chapter', icon: Plus },
      { label: 'Update Chapter', href: '/update-chapter/:id', icon: Edit },
      { label: 'View Lectures', href: '/view-lectures', icon: BookOpen },
      { label: 'Add Lectures', href: '/add-lectures', icon: Plus },
      { label: 'View Assignments', href: '/view-assignments', icon: FileText },
      { label: 'Add Assignment', href: '/add-assignment', icon: Plus },
      { label: 'View Notes', href: '/view-notes', icon: StickyNote },
      { label: 'Add Notes', href: '/add-notes', icon: StickyNote },
      { label: 'Fee Approval', href: '/fee-approval', icon: BadgeCheck },
      { label: 'Student Approval', href: '/student-approval', icon: BadgeCheck },
      { label: 'Authentication', href: '/authentication', icon: Lock },

    ];

    const studentNavItems = [
      { label: 'Recorded Lectures', href: '/recorded-lectures', icon: Video },
      { label: 'Assignments', href: '/assignments', icon: FileText },
      { label: 'Notes', href: '/notes', icon: StickyNote },
      { label: 'Fees', href: '/fees', icon: BadgeCheck },
    ];

    const currentUser = getUserData();
    console.log(currentUser);
    const roleName = currentUser?.roleName;
    const navItems = roleName === 'student' ? studentNavItems : roleName === 'admin' || roleName === null ? adminNavItems : [];
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Simple client-side guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);
  return (
  <html lang="en">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className={`bg-white border-[1.5px] border-[whitesmoke] shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} overflow-y-auto`}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-[whitesmoke]">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white font-bold p-2 rounded-md">PD</div>
                {!collapsed && <span className="font-semibold text-gray-700">PapersDock</span>}
              </div>
           
            </div>
          <nav className={`mt-4 flex flex-col space-y-1 ${collapsed ? 'items-center' : ''}`}>
  {navItems.map((item) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex ${collapsed ? 'justify-center px-0' : 'justify-start px-4'} items-center py-3 gap-3 text-sm transition-colors duration-200 w-full ${
          isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-600'} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  })}
</nav>

          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Topbar */}
            <header className="h-14 flex items-center justify-between px-6 border-b border-[whitesmoke] bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setCollapsed(!collapsed)} className="text-gray-600 hover:text-black">
                  <Menu size={22} />
                </button>
                <h1 className="font-semibold text-lg text-gray-800">Dashboard</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Welcome back, {currentUser?.name}</span>
                <button
                  onClick={() => {
                    clearAccessToken();
                    clearUserData();
                    router.replace('/login');
                  }}
                  className="flex items-center gap-1 text-red-500 hover:underline"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </header>

            <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
