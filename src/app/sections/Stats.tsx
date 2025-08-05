// app/components/Stats.tsx
import { Users, BookOpen, Trophy, Clock } from 'lucide-react';

export default function Stats() {
  return (
    <section className="bg-[#F9FAFB] py-20 px-4 text-center">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Trusted by Students Worldwide
        </h2>
        <p className="text-gray-500 mb-12 max-w-3xl mx-auto">
          Our proven track record speaks for itself. Join the thousands of students who have achieved their A-Level Computer Science goals with PapersDock.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-3">
              <Users className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">16k +</h3>
            <p className="text-sm font-medium text-gray-700">Students Taught</p>
            <p className="text-xs text-gray-500">Worldwide</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-3">
              <BookOpen className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">500+</h3>
            <p className="text-sm font-medium text-gray-700">Learning Resources</p>
            <p className="text-xs text-gray-500">Compiled Resources</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-3">
              <Trophy className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">4+</h3>
            <p className="text-sm font-medium text-gray-700">Distinction</p>
            <p className="text-xs text-gray-500">Around the World</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-3">
              <Clock className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Fast</h3>
            <p className="text-sm font-medium text-gray-700">Query Support</p>
            <p className="text-xs text-gray-500">When you need help</p>
          </div>
        </div>
      </div>
    </section>
  );
}
