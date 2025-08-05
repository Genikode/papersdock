// app/components/Stats.tsx
import { ShieldCheck, Globe, Users2 } from "lucide-react";

export default function Value() {
  return (
    <section className="py-16 bg-[#F9FAFB] text-center">
      <h2 className="text-2xl font-bold mb-10">Our Values</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        <ValueCard
          title="Excellence"
          description="We strive for the highest quality in all our educational materials and support services."
          icon={<ShieldCheck size={28} className="text-indigo-500" />}
        />
        <ValueCard
          title="Community"
          description="Building a supportive community where students and educators can learn and grow together."
          icon={<Users2 size={28} className="text-purple-500" />}
        />
        <ValueCard
          title="Accessibility"
          description="Making quality education accessible to all students, regardless of their background or location."
          icon={<Globe size={28} className="text-pink-500" />}
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
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center flex flex-col items-center transition hover:shadow-md">
      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50">
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 text-lg mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
