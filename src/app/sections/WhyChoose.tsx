// app/components/WhyChoose.tsx
import { Code2, Brain, UserCheck, FileText, Zap, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Code2 size={24} className="text-white" />,
    title: 'AI Pseudocode Logic Checker',
    description:
      'Automatically evaluates pseudocode logic against marking schemes and provides instant feedback. (Coming Soon)',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Brain size={24} className="text-white" />,
    title: 'Pseudocode Compiler',
    description:
      'Run and visualize the output of pseudocode in real-time, making concepts easier to grasp. (Coming Soon)',
    color: 'from-pink-500 to-purple-500',
  },
  {
    icon: <UserCheck size={24} className="text-white" />,
    title: 'Query Portal',
    description:
      'Submit your questions anytime and get reliable answers from our expert team.',
    color: 'from-green-400 to-blue-500',
  },
  {
    icon: <FileText size={24} className="text-white" />,
    title: 'Exam Mastery',
    description:
      'Complete coverage of the syllabus with structured preparation guidance to maximize exam performance.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: <Zap size={24} className="text-white" />,
    title: 'Compiled Notes & Topical Practice',
    description:
      'Access well-organized notes and topical past papers designed for efficient revision.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: <ShieldCheck size={24} className="text-white" />,
    title: 'Real World Guidance',
    description:
      'Practical insights and mentorship to connect classroom learning with real-world problem solving.',
    color: 'from-purple-500 to-indigo-500',
  },
];

export default function WhyChoose() {
  return (
    <section className="py-20 px-4 text-center bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Why Choose PapersDock?</h2>
        <p className="text-gray-500 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Our platform blends technology and education to deliver unmatched results all at an affordable cost. With a focus on improving problem-solving skills, we empower students to think critically, master concepts, and achieve success without breaking the bank.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-left shadow-sm hover:shadow-md dark:hover:shadow-black/40 transition-colors border border-gray-100 dark:border-gray-700 flex flex-col h-[250px] md:h-[250px] lg:h-[250px] overflow-hidden"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.color} ring-1 ring-black/10 dark:ring-white/10`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {feature.description}
              </p>
              {/* pinned at the bottom for perfect alignment */}
              <div
                className={`h-1 w-full rounded-full bg-gradient-to-r ${feature.color} opacity-95 mt-auto`}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
