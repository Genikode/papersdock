"use client";
import Image from 'next/image';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getUserData, isLoggedIn, setAccessToken, setUserData, UserData } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaUser, FaVideo } from 'react-icons/fa';
import clsx from 'clsx';
type StatItem = {
  value: string | number;
  label: string;
  icon: ReactNode; // ✅ no JSX namespace needed
};
type SkeletonStatProps = {
  /** How many bottom stat cards to render (default 2) */
  bottomCards?: number;
  /** Show the top-left "Views" block skeleton (default true) */
  showTopLeft?: boolean;
  /** Pass extra classes if needed */
  className?: string;
};
export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
     const currentUser = getUserData();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
      const [stats, setStats] = useState<StatItem[] | null>(null);
      const [viewCount, setViewCount] = useState(0);
   
    
      useEffect(() => {
        const controller = new AbortController();
    
        const fetchSubscriber = async () => {
          try {
            const response = await fetch(
              'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCbOwD2JG5N9DePz3xIw56pg&key=AIzaSyDHsu2C6n000D9UnbKADiClkh2RJTzhZx4',
              { cache: 'no-store', signal: controller.signal }
            );
            const data = await response.json();
    
            if (!response.ok) {
              throw new Error(data?.error?.message || 'Failed to fetch stats');
            }
    
            const s = data?.items?.[0]?.statistics ?? {};
            const fmt = (n: unknown) =>
              new Intl.NumberFormat('en-US').format(Number(n ?? 0));
            setViewCount(Number(s.viewCount));
            const next: StatItem[] = [
              // { value: fmt(s.viewCount), label: 'View Count', icon: <FaEye size={20} /> },
              { value: fmt(s.subscriberCount), label: 'Subscribers', icon: <FaUser size={20} /> },
              { value: fmt(s.videoCount), label: 'Videos', icon: <FaVideo size={20} /> },
              // { value: 'Complete', label: 'Notes and Topical Past Papers', icon: <FileText size={20} /> },
            ];
    
            setStats(next);
          } catch (err) {
            if ((err as any)?.name === 'AbortError') return;
            console.error('Failed to fetch YouTube stats', err);
            setError('Unable to load stats right now.');
            // Fallback placeholders so the UI still renders
            setStats([
              // { value: '-', label: 'View Count', icon: <FaEye size={20} /> },
              { value: '-', label: 'Subscribers', icon: <FaUser size={20} /> },
              { value: '-', label: 'Videos', icon: <FaVideo size={20} /> },
              // { value: 'Complete', label: 'Notes and Topical Past Papers', icon: <FileText size={20} /> },
            ]);
          }
        };
    
        fetchSubscriber();
        return () => controller.abort();
      }, []);
    

  
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left: Login Form */}
  <div className="flex flex-col justify-center px-8 sm:px-20 min-h-screen bg-white dark:bg-slate-950">
  <button
    className="text-sm text-slate-600 dark:text-slate-400 mb-8 hover:underline"
    onClick={() => router.push('/')}
  >
    &larr; Back to home
  </button>

  <div className="flex flex-col items-center mb-6">
   <Link href="/" className="flex items-center gap-2">
          <div className=" text-white rounded-xl flex items-center justify-center text-sm font-bold">
            <Image src="/logo4.png" alt="Logo" width={100} height={100} className='rounded-2xl ' />
          </div>
       
        </Link>
    <h2 className="text-xl font-bold mt-4 text-slate-900 dark:text-slate-100">Login</h2>
    <p className="text-slate-600 dark:text-slate-400 text-sm">Info related portal</p>
  </div>

  <form
    className="space-y-5"
    onSubmit={async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const result = await api.post<{
          status: number;
          success: boolean;
          message: string;
          accessToken: string;
          userData: UserData;
        }>('/users/login-user', { email, password });
        setAccessToken(result.accessToken);
        if (result.userData) {
          setUserData(result.userData);
        }
        if (result.userData.roleName === 'student') {
          router.replace('/recorded-lectures');
        } else {
          router.replace('/dashboard');
        }
      } catch (err: any) {
        const message = err?.message || 'Login failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    }}
  >
    <div>
      <label className="text-sm text-slate-900 dark:text-slate-100 font-medium">Email*</label>
      <div className="mt-1 border rounded-md overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <input
          type="email"
          placeholder="mail@website.com"
          className="w-full px-4 py-2 outline-none bg-transparent
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </div>

    <div>
      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Password*</label>
      <div className="mt-1 border rounded-md overflow-hidden flex items-center
                      border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 character"
          className="w-full px-4 py-2 outline-none bg-transparent
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="px-3 text-slate-400 dark:text-slate-500"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    <div className="flex justify-between items-center text-sm">
      <label className="flex items-center gap-2 text-slate-900 dark:text-slate-200">
        <input type="checkbox" className="accent-blue-600 dark:accent-blue-500" /> Remember me
      </label>
      <a href="#" className="text-blue-600 dark:text-blue-400">Forget password?</a>
    </div>

    {error && (
      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
    )}

    <button
      type="submit"
      disabled={loading}
      className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500
                 text-white font-semibold rounded-md disabled:opacity-60"
    >
      {loading ? 'Logging in...' : 'Login'}
    </button>

    <p className="text-sm text-center text-slate-900 dark:text-slate-200">
      Not registered yet? <a className="text-blue-600 dark:text-blue-400" href="#">Contact Coordinator</a>
    </p>
  </form>

  <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-10">
    &copy;2024 PapersDock. All rights reserved.
  </p>
</div>


      {/* Right: Visual Banner */}
      <div className="hidden md:flex items-center justify-center relative bg-gradient-to-r from-[#2A3D7C] to-[#3C2376] text-white">
        <Image
          src="/login-bg.png"
          alt="Login Visual"
          layout="fill"
          objectFit="cover"
          className="absolute z-0 opacity-30"
        />

        <div className="z-10 text-center max-w-md px-6">
          {viewCount && stats ? (
            
       <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md text-white shadow-lg relative ">
  {/* Top section */}
  <div className="flex justify-between items-start">
    {viewCount && (
      <div>
        <h2 className="text-4xl font-bold">{viewCount}</h2>
        <p className="text-sm text-white/80 mt-1 text-left">Views</p>
      </div>
    )}
    {/* <div>
      <h2 className="text-4xl font-bold">98.7%</h2>
      <p className="text-sm text-white/80 mt-1">Success Rate</p>
    </div> */}
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="white"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 17l6-6 4 4 8-8"
        />
      </svg>
    </div>
  </div>

  {/* Bottom cards */}
  <div className="mt-6 flex gap-3">
      {(stats ?? Array.from({ length: 2 })).map((item, i) =>
            item ? (
    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow">
     {item.icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{item.value}</p>
        <p className="text-xs text-white/80">{item.label}</p>
      </div>
    </div>
   ) : (
           null
            )
          )}

  </div>
</div>
          ):
          <SkeletonStat />
          }


          <h2 className="text-2xl font-bold leading-snug m-6">Master Computer Science<br />With Excellence.</h2>
          <p className="text-sm mb-4">
            From pseudocode to problem-solving, master A-Level Computer Science with expert guidance. Clear explanations, practice, and support every step of the way.
          </p>

        </div>
      </div>
    </div>
  );
}
function SkeletonStat({
  bottomCards = 2,
  showTopLeft = true,
  className,
}: SkeletonStatProps) {
  return (
    <div
      aria-busy="true"
      className={clsx(
        'bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md text-white shadow-lg relative',
        className
      )}
    >
      {/* Top section */}
      <div className="flex justify-between items-start">
        {showTopLeft ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 w-32 rounded-md bg-white/20" />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
        ) : (
          <div />
        )}

        <div className="w-10 h-10 rounded-xl bg-white/20 shadow-md animate-pulse" />
      </div>

      {/* Bottom cards */}
      <div className="mt-6 flex gap-3">
        {Array.from({ length: bottomCards }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 shadow animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-28 rounded bg-white/20 mb-2 animate-pulse" />
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
