// app/components/Stats.tsx
import { Users, FileText, Clock, ShieldCheck } from 'lucide-react';

export default function Mission() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Left */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Our Mission
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            We believe every student deserves access to high-quality educational resources. Our mission is to
            bridge the gap between complex Computer Science concepts and student understanding through
            innovative teaching methods and comprehensive study materials.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Founded by educators and industry professionals, PapersDock combines academic excellence with
            real-world applications to prepare students for both exams and future careers in technology.
          </p>
        </div>

        {/* Right */}
        <div className="grid grid-cols-2 gap-6">
          <Stat icon={<Users size={20} />} label="Students Helped" value="500+" />
          <Stat icon={<ShieldCheck size={20} />} label="Success Rate" value="95%" />
          <Stat icon={<FileText size={20} />} label="Resources Created" value="100+" />
          <Stat icon={<Clock size={20} />} label="Support Available" value="24/7" />
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm p-4 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="mb-2 rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
