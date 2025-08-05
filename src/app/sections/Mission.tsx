// app/components/Stats.tsx
import { Heart, Users, FileText, Clock, ShieldCheck, Globe, Users2 } from 'lucide-react';;

export default function Mission (){
  return (
      <section className="py-16 px-4 max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-600">
            We believe every student deserves access to high-quality educational resources. Our mission is to
            bridge the gap between complex Computer Science concepts and student understanding through
            innovative teaching methods and comprehensive study materials.
          </p>
          <p className="text-gray-600 mt-4">
            Founded by educators and industry professionals, PapersDock combines academic excellence with
            real-world applications to prepare students for both exams and future careers in technology.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Stat icon={<Users size={20} />} label="Students Helped" value="500+" />
          <Stat icon={<ShieldCheck size={20} />} label="Success Rate" value="95%" />
          <Stat icon={<FileText size={20} />} label="Resources Created" value="100+" />
          <Stat icon={<Clock size={20} />} label="Support Available" value="24/7" />
        </div>
      </section>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white shadow-sm border rounded-lg p-4 flex flex-col items-center">
      <div className="text-blue-600 mb-2">{icon}</div>
      <h3 className="text-xl font-semibold">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}