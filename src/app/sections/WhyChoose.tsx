// app/components/WhyChoose.tsx
import { Code2, Brain, UserCheck, FileText, Zap, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Code2 size={24} className="text-white" />,
    title: 'Interactive Coding Lab',
    description: 'Practice with real coding challenges and get instant feedback on your solutions.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Brain size={24} className="text-white" />,
    title: 'AI-Powered Learning',
    description: 'Personalized study paths that adapt to your learning style and pace.',
    color: 'from-pink-500 to-purple-500',
  },
  {
    icon: <UserCheck size={24} className="text-white" />,
    title: 'Expert Mentorship',
    description: 'Connect with experienced teachers and get one-on-one guidance.',
    color: 'from-green-400 to-blue-500',
  },
  {
    icon: <FileText size={24} className="text-white" />,
    title: 'Exam Mastery',
    description: 'Comprehensive past papers and mock exams with detailed mark schemes.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: <Zap size={24} className="text-white" />,
    title: 'Fast Track Learning',
    description: 'Accelerated courses designed to maximize your learning in minimum time.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: <ShieldCheck size={24} className="text-white" />,
    title: 'Grade Guarantee',
    description: "We're so confident in our method, we guarantee your grade improvement.",
    color: 'from-purple-500 to-indigo-500',
  },
];

export default function WhyChoose() {
  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose PapersDock?</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
          Our cutting-edge platform combines the best of technology and education to deliver unmatched results
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-md transition border border-gray-100"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.color}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{feature.description}</p>
              <div
                className={`h-1 w-full rounded-full bg-gradient-to-r ${feature.color}`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
