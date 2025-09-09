// app/components/Stats.tsx
import { ShieldCheck, Globe, Users2 } from "lucide-react";

export default function Value() {
  return (
    <section className="py-16 text-center bg-[#F9FAFB] dark:bg-slate-950">
      <h2 className="text-2xl font-bold mb-10 text-slate-900 dark:text-slate-100">
        Our Values
      </h2>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        <ValueCard
          title="Excellence"
          description="We strive for the highest quality in all our educational materials and support services."
          icon={<ShieldCheck size={28} className="text-indigo-600 dark:text-indigo-400" />}
        />
        <ValueCard
          title="Community"
          description="Building a supportive community where students and educators can learn and grow together."
          icon={<Users2 size={28} className="text-purple-600 dark:text-purple-400" />}
        />
        <ValueCard
          title="Accessibility"
          description="Making quality education accessible to all students, regardless of their background or location."
          icon={<Globe size={28} className="text-pink-600 dark:text-pink-400" />}
        />
      </div>
    </section>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl p-8 text-center flex flex-col items-center
                    border border-slate-200 dark:border-slate-800
                    bg-white/90 dark:bg-slate-900/60
                    shadow-sm hover:shadow-md dark:hover:shadow-slate-900/40
                    transition">
      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full
                      bg-slate-100 dark:bg-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-700">
        {icon}
      </div>
      <h4 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
        {title}
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
