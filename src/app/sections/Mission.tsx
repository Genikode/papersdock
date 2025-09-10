// src/app/sections/Mission.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { FaEye, FaUser, FaVideo } from 'react-icons/fa';

type StatItem = {
  value: string | number;
  label: string;
  icon: ReactNode; // ✅ no JSX namespace needed
};

export default function Mission() {
  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

        const next: StatItem[] = [
          { value: fmt(s.viewCount), label: 'View Count', icon: <FaEye size={20} /> },
          { value: fmt(s.subscriberCount), label: 'Subscribers', icon: <FaUser size={20} /> },
          { value: fmt(s.videoCount), label: 'Videos', icon: <FaVideo size={20} /> },
          { value: 'Complete', label: 'Notes and Topical Past Papers', icon: <FileText size={20} /> },
        ];

        setStats(next);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('Failed to fetch YouTube stats', err);
        setError('Unable to load stats right now.');
        // Fallback placeholders so the UI still renders
        setStats([
          { value: '-', label: 'View Count', icon: <FaEye size={20} /> },
          { value: '-', label: 'Subscribers', icon: <FaUser size={20} /> },
          { value: '-', label: 'Videos', icon: <FaVideo size={20} /> },
          { value: 'Complete', label: 'Notes and Topical Past Papers', icon: <FileText size={20} /> },
        ]);
      }
    };

    fetchSubscriber();
    return () => controller.abort();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Left */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Our Mission
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            At PapersDock, our mission is to make A-Level Computer Science simple, affordable, and
            effective for every student. We aim to break down complex concepts into clear, practical
            lessons while building strong problem-solving skills.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            By combining expert guidance, structured resources, and innovative tools like our AI
            Pseudocode Logic Checker and Compiler, we help students achieve top grades and prepare
            for real-world applications in technology.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Right */}
        <div className="grid grid-cols-2 gap-6">
          {(stats ?? Array.from({ length: 4 })).map((item, i) =>
            item ? (
              <Stat key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ) : (
              <SkeletonStat key={`skeleton-${i}`} />
            )
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm p-4 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="mb-2 rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm p-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="mb-2 h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
